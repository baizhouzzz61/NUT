# ADR 0002: IndexedDB for Persistent Storage

## Status

Accepted

## Context

NUT needs to persist transcripts and generated topics. As a pure frontend application with no backend database, we need a client-side storage mechanism that can hold hundreds of text entries.

## Decision

Use **IndexedDB** via the browser's built-in API. Each transcript and topic is stored as a structured object. A lightweight wrapper library (idb or Dexie.js) is used to avoid raw IndexedDB API boilerplate.

## Alternatives considered

- **localStorage**: Capped at ~5MB, unsuitable for storing many text articles and audio file references.
- **Cloudflare D1 / server-side DB**: Would reintroduce a backend, defeating the simplicity of the pure-frontend architecture.
- **OPFS (Origin Private File System)**: Good for large binary files, but IndexedDB is a better fit for structured JSON data.

## Consequences

- Data is scoped to the browser/device — no cross-device sync
- The user is responsible for their own data portability (future export/import feature may address this)
- Storage limit is generous (~50% of disk, browser-dependent), sufficient for text data
