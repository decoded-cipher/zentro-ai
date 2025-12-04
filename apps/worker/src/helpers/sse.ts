import { Response } from 'express';

export type SSEClient = Response;

const sseClients = new Map<SSEClient, string>();

export function broadcastToSSE(data: any) {
    const { projectId } = data;
    const message = `data: ${JSON.stringify(data)}\n\n`;
    
    for (const [client, clientProjectId] of sseClients.entries()) {
        if (clientProjectId === projectId) {
            try {
                client.write(message);
            } catch {
                sseClients.delete(client);
            }
        }
    }
}

export function addClient(client: SSEClient, projectId: string) {
    sseClients.set(client, projectId);
}

export function removeClient(client: SSEClient) {
    sseClients.delete(client);
}
