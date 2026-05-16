# ADR 0001: Cloudflare Workers as API Proxy

## Status

Accepted

## Context

NUT is a single-user web application that calls two external AI APIs: Deepgram (speech-to-text) and Claude (LLM for topic generation). These APIs require secret keys that cannot be exposed in browser-side JavaScript. We need a way to proxy requests without building and hosting a full backend server.

## Decision

Use **Cloudflare Workers** to proxy API calls. Two endpoints:

- `POST /api/transcribe` — forwards audio to Deepgram, returns transcript
- `POST /api/generate-topic` — forwards prompt to Claude, returns topic

Worker secrets store the API keys. The frontend calls the Worker URL, never the third-party APIs directly.

## Alternatives considered

- **Vercel Edge Functions**: Similar capability, but Cloudflare Workers' free tier (100k requests/day) is 10× larger.
- **Full backend server (FastAPI/Express)**: Would require a 24/7 hosting solution, overkill for a single-user app.
- **API keys in browser**: Rejected for security — keys in client-side code are trivially extractable.

## Consequences

- No server to maintain or pay for within free tier limits
- Worker cold starts add minor latency (typically <50ms)
- Two API providers to manage, each with their own key rotation cycle
