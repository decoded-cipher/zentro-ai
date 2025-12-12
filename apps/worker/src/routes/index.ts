
import { Router } from 'express';
import JSZip from 'jszip';
import { promises as fs } from 'fs';
import { join } from 'path';
import { addClient, removeClient } from '../helpers/sse';
import { processChat } from '../core/processor';
import { shouldExcludeFile } from '../helpers/filters';

const router = Router();

const BASE_WORK_DIR = '/tmp/zentro';


// SSE endpoint for clients to subscribe to updates
router.get('/subscribe', (req, res) => {
    const projectId = req.query.projectId as string;

    if (!projectId) {
        res.status(400).json({ error: 'projectId query parameter is required' });
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    res.flushHeaders();

    addClient(res, projectId);
    res.write(`data: ${JSON.stringify({ type: 'connected', projectId })}\n\n`);

    req.on('close', () => {
        removeClient(res);
    });
});


// Endpoint to receive chat prompts
router.post('/chat', (req, res) => {
    const { projectId, prompt } = req.body;

    if (!projectId || !prompt) {
        res.status(400).send('Missing projectId or prompt');
        return;
    }

    processChat(projectId, prompt).catch(err => console.error(err));

    res.json({ status: 'processing' });
});

// Endpoint to download project as zip
router.get('/download', async (req, res) => {
    const projectId = req.query.projectId as string;

    if (!projectId) {
        res.status(400).json({ error: 'projectId query parameter is required' });
        return;
    }

    const projectPath = BASE_WORK_DIR;

    try {
        // Check if project directory exists
        try {
            await fs.access(projectPath);
        } catch {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        // Set headers for zip download
        const zipFileName = `project-${projectId}-${Date.now()}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Create JSZip instance
        const zip = new JSZip();

        // Recursively add files to zip, excluding filtered files
        async function addDirectoryToZip(dirPath: string, basePath: string) {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);
                const relativePath = basePath 
                    ? join(basePath, entry.name).replace(/\\/g, '/')
                    : entry.name;

                // Check if file should be excluded
                const exclude = await shouldExcludeFile(fullPath, projectPath);
                if (exclude) {
                    continue;
                }

                if (entry.isDirectory()) {
                    await addDirectoryToZip(fullPath, relativePath);
                } else if (entry.isFile()) {
                    try {
                        const fileContent = await fs.readFile(fullPath);
                        zip.file(relativePath, fileContent);
                    } catch (err) {
                        console.warn(`Failed to read file ${fullPath}:`, err);
                        // Continue with other files even if one fails
                    }
                }
            }
        }

        // Start adding files
        await addDirectoryToZip(projectPath, '');

        // Generate zip file and stream it to response
        const zipBuffer = await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 } // Maximum compression
        });

        res.send(zipBuffer);
    } catch (error) {
        console.error('Error creating zip:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to create zip file' });
        }
    }
});


export default router;
