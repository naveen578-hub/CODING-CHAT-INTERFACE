# Coding Chat Interface

A full-stack AI chat assistant for programming questions, built with React + Vite on the
frontend and a Node/Express backend that streams responses from Anthropic's Claude API.

## Why a backend at all?

The frontend never talks to Claude directly. An LLM API key must stay server-side —
shipping it to the browser means anyone can read it out of the page and rack up charges
on your account. The Express server in `server/` holds the key, calls the Anthropic API,
and streams the response back to the browser over Server-Sent Events.

## Features

- Real responses from Claude (`claude-sonnet-4-5` by default), not canned strings
- Token-by-token streaming, rendered as the model generates it
- Multi-turn conversation history sent with every request
- Markdown code-block formatting with syntax highlighting styling
- Request cancellation on unmount (no state updates after the component is gone)

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, lucide-react icons
- **Backend:** Node.js, Express, `@anthropic-ai/sdk`
- **Dev workflow:** `concurrently` runs both servers with one command; Vite proxies
  `/api/*` to the backend so there's no CORS friction locally

## Setup

```bash
npm install
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY to your own key
npm run dev
```

This starts the Vite dev server (frontend) and the Express server (backend) together.
Open the URL Vite prints (typically `http://localhost:5173`).

### Environment variables (`.env`)

| Variable | Description | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (required) | — |
| `ANTHROPIC_MODEL` | Model to use | `claude-sonnet-4-5` |
| `PORT` | Backend port | `3001` |

`.env` is gitignored — never commit real API keys.

## Production build

```bash
npm run build    # outputs static frontend to dist/
node server/index.js   # run the backend separately, behind your own reverse proxy
```

## Project structure

```
├── src/                # React frontend
│   ├── App.jsx          # Chat UI + streaming client
│   ├── main.jsx
│   └── index.css
├── server/
│   └── index.js         # Express backend, proxies to Claude with SSE streaming
├── vite.config.js       # Dev proxy: /api -> localhost:3001
├── tailwind.config.js
└── .env.example
```
