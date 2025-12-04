import { Router } from 'express';
import { addClient, removeClient } from '../helpers/sse';
import { processChat } from '../helpers/processor';

const router = Router();

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

router.post('/chat', (req, res) => {
    const { projectId, prompt } = req.body;

    if (!projectId || !prompt) {
        res.status(400).send('Missing projectId or prompt');
        return;
    }

    processChat(projectId, prompt).catch(err => console.error(err));

    res.json({ status: 'processing' });
});

export default router;
