import Docker from 'dockerode';
import { publishLogs } from '@repo/logger';
import { createLogger } from '@repo/logger';
import { CONFIG } from './config';

const docker = new Docker({ socketPath: CONFIG.DOCKER_SOCKET });
const logger = createLogger({
    serviceName: 'manager',
    serviceVersion: '1.0.0',
    container: 'manager-log-collector',
});

interface LogStream {
    containerId: string;
    stream: NodeJS.ReadableStream | null;
    buffer: LogEntry[];
    flushTimer: NodeJS.Timeout | null;
}

interface LogEntry {
    projectId: string;
    service: string;
    container: string;
    level: string;
    message: string;
    labels?: Record<string, string>;
    metadata?: string;
    timestamp?: Date;
}

// Map of container ID to log stream
const activeStreams = new Map<string, LogStream>();

// Buffer size before flushing
const BUFFER_SIZE = 50;
// Flush interval in milliseconds
const FLUSH_INTERVAL = 2000; // 2 seconds

/**
 * Parse log line to extract level and message
 * Handles various log formats:
 * - JSON logs: {"level":"info","message":"..."}
 * - Standard logs: "INFO: message" or "ERROR: message"
 * - Plain logs: "message"
 */
function parseLogLine(line: string, containerName: string, serviceType: string): { level: string; message: string } {
    // Try to parse as JSON first
    try {
        const json = JSON.parse(line);
        if (json.level && json.message) {
            return {
                level: json.level.toLowerCase(),
                message: typeof json.message === 'string' ? json.message : JSON.stringify(json.message)
            };
        }
        // If it's JSON but doesn't have level/message, stringify the whole thing
        return {
            level: 'info',
            message: JSON.stringify(json)
        };
    } catch {
        // Not JSON, try to parse standard log format
        const upperLine = line.toUpperCase();
        if (upperLine.startsWith('ERROR') || upperLine.startsWith('ERR')) {
            return {
                level: 'error',
                message: line.replace(/^(ERROR|ERR):\s*/i, '').trim()
            };
        }
        if (upperLine.startsWith('WARN') || upperLine.startsWith('WARNING')) {
            return {
                level: 'warn',
                message: line.replace(/^(WARN|WARNING):\s*/i, '').trim()
            };
        }
        if (upperLine.startsWith('INFO')) {
            return {
                level: 'info',
                message: line.replace(/^INFO:\s*/i, '').trim()
            };
        }
        if (upperLine.startsWith('DEBUG')) {
            return {
                level: 'debug',
                message: line.replace(/^DEBUG:\s*/i, '').trim()
            };
        }
        // Default to info for plain logs
        return {
            level: 'info',
            message: line.trim()
        };
    }
}

/**
 * Extract project ID from container name
 * Container names are: code-server-{projectId} or worker-{projectId}
 */
function extractProjectId(containerName: string): string | null {
    const match = containerName.match(/^(code-server|worker)-(.+)$/);
    return match ? match[2] : null;
}

/**
 * Start collecting logs from a Docker container
 */
export async function startLogCollection(containerId: string, containerName: string, projectId: string): Promise<void> {
    // Skip if already collecting
    if (activeStreams.has(containerId)) {
        logger.debug('Log collection already started', { containerId, containerName });
        return;
    }

    try {
        const container = docker.getContainer(containerId);
        const containerInfo = await container.inspect();
        
        // Determine service type from container name
        const serviceType = containerName.startsWith('code-server-') ? 'code-server' : 'worker';
        
        logger.info('Starting log collection', { containerId, containerName, projectId, serviceType });

        // Create log stream
        const logStream: LogStream = {
            containerId,
            stream: null,
            buffer: [],
            flushTimer: null
        };

        // Get container logs stream
        const stream = await container.logs({
            follow: true,
            stdout: true,
            stderr: true,
            timestamps: true,
            tail: 0 // Start from now
        });

        logStream.stream = stream;

        // Set up flush timer
        logStream.flushTimer = setInterval(() => {
            flushLogs(containerId);
        }, FLUSH_INTERVAL);

        // Process log stream
        stream.on('data', (chunk: Buffer) => {
            const lines = chunk.toString('utf-8').split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                // Parse timestamp and message from Docker log format
                // Format: 2024-01-01T12:00:00.000000000Z message
                const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.-]+Z)\s+(.+)$/);
                const timestamp = timestampMatch ? new Date(timestampMatch[1]) : new Date();
                const logContent = timestampMatch ? timestampMatch[2] : line;

                const { level, message } = parseLogLine(logContent, containerName, serviceType);

                logStream.buffer.push({
                    projectId,
                    service: serviceType,
                    container: containerName,
                    level,
                    message,
                    timestamp,
                    labels: {
                        container_id: containerId,
                        container_name: containerName
                    }
                });

                // Flush if buffer is full
                if (logStream.buffer.length >= BUFFER_SIZE) {
                    flushLogs(containerId);
                }
            }
        });

        stream.on('error', (error: Error) => {
            logger.error('Error in log stream', { 
                containerId, 
                containerName,
                error: error.message 
            });
            stopLogCollection(containerId);
        });

        stream.on('end', () => {
            logger.info('Log stream ended', { containerId, containerName });
            stopLogCollection(containerId);
        });

        activeStreams.set(containerId, logStream);
        logger.info('Log collection started', { containerId, containerName, projectId });

    } catch (error) {
        logger.error('Failed to start log collection', { 
            containerId, 
            containerName,
            error: error instanceof Error ? error.message : String(error)
        });
    }
}

/**
 * Flush buffered logs to Kafka
 */
async function flushLogs(containerId: string): Promise<void> {
    const logStream = activeStreams.get(containerId);
    if (!logStream || logStream.buffer.length === 0) {
        return;
    }

    const logsToFlush = logStream.buffer.splice(0, BUFFER_SIZE);

    try {
        await publishLogs(logsToFlush.map(l => ({
            timestamp: (l.timestamp || new Date()).toISOString(),
            projectId: l.projectId,
            service: l.service,
            container: l.container,
            level: l.level,
            message: l.message,
            labels: l.labels,
            metadata: l.metadata,
        })));
        logger.debug('Logs flushed to Kafka', { 
            containerId, 
            count: logsToFlush.length 
        });
    } catch (error) {
        logger.error('Failed to flush logs', { 
            containerId,
            error: error instanceof Error ? error.message : String(error)
        });
        // Put logs back in buffer to retry
        logStream.buffer.unshift(...logsToFlush);
    }
}

/**
 * Stop collecting logs from a container
 */
export async function stopLogCollection(containerId: string): Promise<void> {
    const logStream = activeStreams.get(containerId);
    if (!logStream) {
        return;
    }

    logger.info('Stopping log collection', { containerId });

    // Clear flush timer
    if (logStream.flushTimer) {
        clearInterval(logStream.flushTimer);
        logStream.flushTimer = null;
    }

    // Flush remaining logs
    if (logStream.buffer.length > 0) {
        await flushLogs(containerId);
    }

    // Stop stream
    if (logStream.stream) {
        logStream.stream.destroy();
        logStream.stream = null;
    }

    activeStreams.delete(containerId);
    logger.info('Log collection stopped', { containerId });
}

/**
 * Restore log collection for existing containers
 * Called on manager startup to resume log collection for running containers
 */
export async function restoreLogCollections(): Promise<void> {
    try {
        const containers = await docker.listContainers({
            filters: {
                label: ['managed-by=zentro-manager']
            }
        });

        logger.info('Restoring log collections', { containerCount: containers.length });

        for (const containerInfo of containers) {
            const container = docker.getContainer(containerInfo.Id);
            const inspect = await container.inspect();
            
            const projectId = inspect.Config.Labels['zentro.project.id'];
            const containerName = inspect.Name.replace(/^\//, ''); // Remove leading slash
            
            if (projectId && containerName) {
                // Check if container is running
                if (inspect.State.Running) {
                    await startLogCollection(containerInfo.Id, containerName, projectId);
                    logger.debug('Log collection restored', { containerId: containerInfo.Id, containerName, projectId });
                } else {
                    logger.debug('Skipping stopped container', { containerId: containerInfo.Id, containerName });
                }
            }
        }

        logger.info('Log collections restored', { activeStreams: activeStreams.size });
    } catch (error) {
        logger.error('Failed to restore log collections', { 
            error: error instanceof Error ? error.message : String(error)
        });
    }
}

/**
 * Stop all log collections (cleanup on shutdown)
 */
export async function stopAllLogCollections(): Promise<void> {
    logger.info('Stopping all log collections', { count: activeStreams.size });
    
    const promises = Array.from(activeStreams.keys()).map(containerId => 
        stopLogCollection(containerId)
    );
    
    await Promise.allSettled(promises);
}

