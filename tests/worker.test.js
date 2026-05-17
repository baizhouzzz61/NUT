import { describe, it, expect, vi, beforeEach } from 'vitest'

// Import the worker handler
import workerModule from '../worker/src/index'
const worker = workerModule.default || workerModule

function buildEnv(overrides = {}) {
  return {
    DEEPGRAM_API: 'https://api.deepgram.com/v1/listen',
    DEEPSEEK_API: 'https://api.deepseek.com/v1/chat/completions',
    DEEPGRAM_API_KEY: 'dg-key',
    DEEPSEEK_API_KEY: 'ds-key',
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

  it('proxies transcript data to DeepSeek and returns parsed topic', async () => {
    const deepseekResponse = {
      choices: [{
        message: {
          content: '{"title": "Greetings", "segments": [{"text": "A: Hello there!\\n", "source": "ai"}, {"text": "B: Hi! How are you?\\n", "source": "transcript:1"}, {"text": "A: I am doing great.\\n", "source": "ai"}]}',
        },
      }],
    }

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(deepseekResponse),
    })

    const transcripts = [{ id: '1', title: 'Tech Talk', content: 'Hello there. This is about tech.' }]
    const req = new Request('http://localhost/api/generate-topic', {
      method: 'POST',
      body: JSON.stringify({ transcripts }),
    })

    const res = await worker.fetch(req, buildEnv())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.topic.title).toBe('Greetings')
    expect(data.topic.segments).toHaveLength(3)
    expect(data.topic.segments[0].source).toBe('ai')
    expect(data.topic.segments[1].source).toBe('transcript:1')

    // Verify DeepSeek was called correctly
    const [deepseekUrl, deepseekOpts] = fetch.mock.calls[0]
    expect(deepseekUrl).toContain('api.deepseek.com')
    expect(deepseekOpts.headers.Authorization).toBe('Bearer ds-key')
    const body = JSON.parse(deepseekOpts.body)
    expect(body.model).toBe('deepseek-chat')
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[0].content).toContain('50%')
    expect(body.messages[0].content).toContain('segments')
    expect(body.messages[1].content).toContain('Tech Talk')
  })

  it('returns 500 on DeepSeek API error', async () => {
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
    const deepseekResponse = {
      choices: [{ message: { content: '{"title": "X", "segments": [{"text": "A: Hi\\n", "source": "ai"}]}' } }],
    }
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(deepseekResponse),
    })

    const req = new Request('http://localhost/api/generate-topic', {
      method: 'POST',
      body: JSON.stringify({ transcripts: [{ id: '1', title: 'A', content: 'B' }] }),
    })
    const res = await worker.fetch(req, buildEnv())
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('includes userPrompt in the user message when provided', async () => {
    const deepseekResponse = {
      choices: [{
        message: {
          content: '{"title": "Coffee Talk", "segments": [{"text": "A: Can I get a latte please?\\n", "source": "transcript:1"}, {"text": "B: Sure, anything else?\\n", "source": "ai"}]}',
        },
      }],
    }
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(deepseekResponse),
    })

    const req = new Request('http://localhost/api/generate-topic', {
      method: 'POST',
      body: JSON.stringify({
        transcripts: [{ id: '1', title: 'Cafe', content: 'One latte.' }],
        userPrompt: 'ordering coffee at a cafe',
      }),
    })
    const res = await worker.fetch(req, buildEnv())
    expect(res.status).toBe(200)

    const [, deepseekOpts] = fetch.mock.calls[0]
    const body = JSON.parse(deepseekOpts.body)
    expect(body.messages[1].content).toContain('ordering coffee at a cafe')
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
