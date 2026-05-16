import { describe, it, expect, vi, beforeEach } from 'vitest'
import { transcribeAudio, generateTopic } from '../src/api'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('transcribeAudio', () => {
  it('sends audio file as FormData and returns transcript', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ transcript: 'This is a test transcript.' }),
    })

    const audio = new File(['fake-audio-data'], 'test.mp3', { type: 'audio/mpeg' })
    const result = await transcribeAudio(audio)

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toContain('/api/transcribe')
    expect(opts.method).toBe('POST')
    expect(opts.body).toBeInstanceOf(FormData)
    expect(result.transcript).toBe('This is a test transcript.')
  })

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Bad audio' }),
    })

    const audio = new File(['data'], 'bad.wav', { type: 'audio/wav' })
    await expect(transcribeAudio(audio)).rejects.toThrow('Bad audio')
  })

  it('throws on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    const audio = new File(['data'], 'test.mp3', { type: 'audio/mpeg' })
    await expect(transcribeAudio(audio)).rejects.toThrow('Network error')
  })
})

describe('generateTopic', () => {
  it('sends transcripts as JSON and returns topic', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        topic: {
          title: 'Technology',
          examples: [{ text: 'AI is changing the world', source: 'transcript:1' }],
        },
      }),
    })

    const transcripts = [{ id: '1', title: 'AI News', content: 'AI is changing the world.' }]
    const result = await generateTopic(transcripts)

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toContain('/api/generate-topic')
    expect(opts.method).toBe('POST')
    expect(opts.headers['Content-Type']).toBe('application/json')
    const body = JSON.parse(opts.body)
    expect(body.transcripts).toEqual(transcripts)
    expect(result.topic.title).toBe('Technology')
  })

  it('throws on error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Model overloaded' }),
    })

    await expect(generateTopic([{ id: '1', title: 'X', content: 'Y' }])).rejects.toThrow('Model overloaded')
  })

  it('throws on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Timeout'))
    await expect(generateTopic([{ id: '1', title: 'X', content: 'Y' }])).rejects.toThrow('Timeout')
  })
})
