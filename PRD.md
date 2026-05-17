## Problem Statement

The user wants to practice English speaking using their own English audio materials. Currently they have no way to: transcribe English audio to text, store and organize those transcripts, or generate speaking practice topics that incorporate sentences from their own materials.

## Solution

NUT is a single-user web application that allows the user to upload English audio for AI transcription, manually input English text, store all transcripts in a local library, and generate random speaking practice topics whose example sentences are sourced at least 50% from the user's own stored transcripts.

## User Stories

1. As a learner, I want to upload an English audio file (MP3/WAV/M4A/FLAC) and receive an accurate English transcript, so that I can convert spoken English materials into text.
2. As a learner, I want to preview the transcript before saving it, so that I can verify its accuracy.
3. As a learner, I want to manually edit the transcript after AI transcription, so that I can correct any errors before storing.
4. As a learner, I want to manually type in an English text and save it as a transcript, so that I can add materials without needing an audio file.
5. As a learner, I want to give each transcript a title, so that I can identify and organize my materials.
6. As a learner, I want to see all my saved transcripts in a list with title, source type (audio/manual), and creation date, so that I can browse my library.
7. As a learner, I want to edit a previously saved transcript's title and content, so that I can correct or update it.
8. As a learner, I want to delete a transcript from my library, so that I can remove unwanted materials.
9. As a learner, I want to select a subset of my stored transcripts, so that I can choose which materials to use as source for topic generation.
10. As a learner, I want to request an AI-generated random speaking practice topic, so that I can practice speaking on diverse subjects.
11. As a learner, I want the generated topic to include a topic title and a list of example sentences, so that I have structured practice material.
12. As a learner, I want at least 50% of the example sentences to come from my selected transcripts, so that the practice material incorporates vocabulary and phrases I've already encountered.
13. As a learner, I want each example sentence to be visibly marked as AI-generated or sourced from a specific transcript, so that I know where each sentence comes from.
14. As a learner, I want to save a generated topic to my history, so that I can review it later.
15. As a learner, I want to browse my topic history with title, example count, and source transcript count, so that I can find past practice sessions.
16. As a learner, I want to view a topic's full details, so that I can see all example sentences and their sources.
17. As a learner, I want to filter a topic's examples to show only those sourced from my transcripts, so that I can focus on familiar material.

## Implementation Decisions

### Architecture

- **Pure frontend SPA** with Vue 3 + Vite, no backend server. API keys are kept secure via a Cloudflare Worker proxy, not exposed in the browser.
- **Cloudflare Workers** serve as the only backend, proxying requests to Deepgram (speech-to-text) and Claude (LLM). Two endpoints: `POST /api/transcribe` and `POST /api/generate-topic`.
- **IndexedDB** (via Dexie.js) for all persistent storage. Data lives in the user's browser. No cross-device sync.

### Technology stack

- Vue 3 + Vite + Naive UI + Pinia + Vue Router
- Dexie.js for IndexedDB
- Cloudflare Workers for API proxy
- Deepgram (Nova-2 model, smart_format) for speech-to-text
- DeepSeek (deepseek-chat) for topic generation
- Claude (Anthropic API, claude-sonnet-4-6) for topic generation

### Data model

**Transcript**: `id`, `title`, `content`, `source` (enum: `audio` | `manual`), `audioUrl` (optional), `createdAt`, `updatedAt`

**Topic**: `id`, `title`, `examples` (array of `{ text, source }` where source is `"ai"` or `"transcript:N"` referencing the transcript index in the prompt), `usedTranscriptIds`, `sourceMetadata` (maps `transcript:N` → `{ id, title }` for UI display), `createdAt`

### Topic generation prompt

Claude receives selected transcripts as a numbered list. The system prompt instructs it to: generate a random topic (not derived from transcripts), provide example sentences, source at least 50% from transcripts, mark each sentence with source, and return structured JSON. The JSON is parsed by the Worker and returned to the frontend. The frontend enriches each example with transcript metadata for display.

### UI structure

Three routes: Library (`/`), Generate (`/generate`), History (`/history`). Navigation between them via top-right buttons.

### Source highlighting

In the topic view, examples sourced from transcripts are displayed with a green background and a tag showing the transcript title. AI-generated examples have a neutral background and an "AI" tag.

## Testing Decisions

- **What makes a good test**: Test only the public interface — function inputs and outputs. Do not test implementation details, Vue component internals, or UI rendering.
- **Framework**: Vitest (bundled with Vite ecosystem).
- **Modules to test**:
  - **IndexedDB Data Layer** (`db/index.js`): CRUD operations against a real Dexie instance with `fake-indexeddb` polyfill.
  - **API Client** (`api.js`): Mock `fetch` and verify correct request shape, response parsing, and error handling.
  - **Cloudflare Worker** (`worker/src/index.js`): Mock `fetch` for Deepgram/Anthropic, verify endpoint routing, CORS headers, prompt construction, JSON parsing from Claude response, and error propagation.
- **Modules NOT tested**: All three Vue views — these are thin wrappers over the stores and API client. Their behavior is covered by the module tests.

## Out of Scope

- User authentication or multi-user support
- Cross-device sync or cloud storage
- Audio recording in the browser
- Re-transcription feature (manual editing only)
- Topic difficulty levels, topic type preferences, or configurable example count
- Data export/import
- Mobile app (responsive Web only)

## Further Notes

- The project name "NUT" was chosen by the user.
- Deepgram API key and Anthropic API key are stored as Cloudflare Worker secrets, not in any repository.
- The Worker is deployed via `wrangler deploy`; the frontend is served via static hosting.
