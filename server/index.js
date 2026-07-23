import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const PORT = process.env.PORT || 3001;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.');
    process.exit(1);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const SYSTEM_PROMPT = `You are a helpful, friendly coding assistant embedded in a chat UI.
Help with programming questions, algorithms, debugging, and software design.
Use markdown code fences with a language tag for any code you share.
Keep answers focused and practical.`;

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages must be a non-empty array' });
    }

    const anthropicMessages = messages.map((m) => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content,
    }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Both the stream's 'error' event and the finalMessage() rejection can fire
    // for the same failure, so guard response completion to a single write/end.
    let ended = false;
    const finish = (errorMessage) => {
        if (ended) return;
        ended = true;
        res.write(errorMessage
            ? `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            : 'data: [DONE]\n\n');
        res.end();
    };

    try {
        const stream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: anthropicMessages,
        });

        stream.on('text', (delta) => {
            if (!ended) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        });

        stream.on('error', (err) => {
            console.error('Anthropic stream error:', err.message || err);
            finish('Model request failed.');
        });

        await stream.finalMessage();
        finish();
    } catch (err) {
        console.error('Chat endpoint error:', err.message || err);
        finish('Model request failed.');
    }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
    console.log(`Chat backend listening on http://localhost:${PORT}`);
});
