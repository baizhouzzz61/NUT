import { describe, it, expect, vi, beforeEach } from 'vitest'

// Import the worker handler
import workerModule from '../worker/src/index'
const worker = workerModule.default || workerModule

function buildEnv(overrides = {}) {
  return {
    DEEPGRAM_API: 'https://api.deepgram.com/v1/listen',
    ANTHROPIC_API: 'https://api.anthropic.com/v1/messages',
    DEEPGRAM_API_KEY: 'dg-key',
    ANTHROPIC_API_KEY: 'anthro-key',
    ...overrides,
  }
}

describe('worker routing', () => {
  it('returns 404 for unknown paths', async () => {
    const req = new Request('http://localhost/unknown')
    const res = await worker.fetch(req, buildEnv())
    expect(res.status).toBe(404)
  })

  it('returns 404 for GET on known paths', async () => {
    const req = new Request('http://localhost/api/transcribe')
    const res = await worker.fetch(req, buildEnv())
    expect(res.status).toBe(404)
  })

  it('handles OPTIONS preflight with CORS headers', async () => {
    const req = new Request('http://localhost/api/transcribe', { method: 'OPTIONS' })
    const res = await worker.fetch(req, buildEnv())
    expect(res.status).toBe(200)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })
})

describe('transcribe endpoint', () => {
  it('returns 400 when no audio file is provided', async () => {
    const form = new FormData()
    const req = new Request('http://localhost/api/transcribe', { method: 'POST', body: form })
    const res = await worker.fetch(req, buildEnv())
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('No audio')
  })

  it('proxies audio to Deepgram and returns transcript', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        results: { channels: [{ alternatives: [{ transcript: 'Hello world' }] }] },
      }),
    })

    const form = new FormData()
    const audio = new File(['audio-data'], 'test.mp3', { type: 'audio/mpeg' })
    form.append('audio', audio)
    const req = new Request('http://localhost/api/transcribe', { method: 'POST', body: form })

    const res = await worker.fetch(req, buildEnv())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.transcript).toBe('Hello world')

    const [deepgramUrl, deepgramOpts] = fetch.mock.calls[0]
    expect(deepgramUrl).toContain('api.deepgram.com')
    expect(deepgramOpts.headers.Authorization).toBe('Token dg-key')
  })

  it('returns CORS headers on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        results: { channels: [{ alternatives: [{ transcript: '' }] }] },
      }),
    })

    const form = new FormData()
    form.append('audio', new File(['data'], 'test.mp3', { type: 'audio/mpeg' }))
    const req = new Request('http://localhost/api/transcribe', { method: 'POST', body: form })
    const res = await worker.fetch(req, buildEnv())
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})

describe('generate-topic endpoint', () => {
  it('returns 400 when no transcripts provided', async () => {
    const req = new Request('http://localhost/api/generate-topic', {
      method: 'POST',
      body: JSON.stringify({ transcripts: [] }),
    })
    const res = await worker.fetch(req, buildEnv())
    expect(res.status).toBe(400)
  })

  it('proxies transcript data to Claude and returns parsed topic', async () => {
    const claudeResponse = {
      content: [{
        text: '{"title": "Technology and Life", "examples": [{"text": "Hello there", "source": "transcript:1"}, {"text": "AI is powerful", "source": "ai"}]}',
      }],
    }

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(claudeResponse),
    })

    const transcripts = [{ id: '1', title: 'Tech Talk', content: 'Hello there. This is about tech.' }]
    const req = new Request('http://localhost/api/generate-topic', {
      method: 'POST',
      body: JSON.stringify({ transcripts }),
    })

    const res = await worker.fetch(req, buildEnv())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.topic.title).toBe('Technology and Life')
    expect(data.topic.examples).toHaveLength(2)
    expect(data.topic.examples[0].source).toBe('transcript:1')
    expect(data.topic.examples[1].source).toBe('ai')

    // Verify Claude was called correctly
    const [claudeUrl, claudeOpts] = fetch.mock.calls[0]
    expect(claudeUrl).toContain('api.anthropic.com')
    expect(claudeOpts.headers['x-api-key']).toBe('anthro-key')
    const body = JSON.parse(claudeOpts.body)
    expect(body.model).toBe('claude-sonnet-4-6')
    expect(body.system).toContain('50%')
    expect(body.system).toContain('verbatim')
    expect(body.messages[0].content).toContain('Tech Talk')
  })

  it('returns 500 on Claude API error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
    })

    const req = new Request('http://localhost/api/generate-topic', {
      method: 'POST',
      body: JSON.stringify({ transcripts: [{ id: '1', title: 'X', content: 'Y' }] }),
    })

    const res = await worker.fetch(req, buildEnv())
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Invalid API key')
  })

  it('returns CORS headers on topic response', async () => {
    const claudeResponse = {
      content: [{ text: '{"title": "X", "examples": []}' }],
    }
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(claudeResponse),
    })

    const req = new Request('http://localhost/api/generate-topic', {
      method: 'POST',
      body: JSON.stringify({ transcripts: [{ id: '1', title: 'A', content: 'B' }] }),
    })
    const res = await worker.fetch(req, buildEnv())
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})

describe('worker error boundary', () => {
  it('catches unexpected errors and returns 500', async () => {
    const req = new Request('http://localhost/api/generate-topic', {
      method: 'POST',
      body: 'not-json', // will cause JSON.parse to fail
    })
    const res = await worker.fetch(req, buildEnv())
    expect(res.status).toBe(500)
  })
})
