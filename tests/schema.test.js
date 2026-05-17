import { describe, it, expect } from 'vitest'
import { SOURCE_AI, buildSystemPrompt, parseTopicResponse } from '../src/shared/schema'

describe('SOURCE_AI', () => {
  it('is the string "ai"', () => {
    expect(SOURCE_AI).toBe('ai')
  })
})

describe('buildSystemPrompt', () => {
  it('requires English-only output', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('English')
    expect(prompt).toContain('never output Chinese')
  })

  it('requires continuous dialogue with segments', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('segments')
    expect(prompt).toContain('dialogue')
  })

  it('allows adapting transcript sentences', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('adapt')
    expect(prompt).toContain('not need to be 100% verbatim')
  })

  it('includes the 50% rule', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('50%')
  })

  it('includes JSON schema with segments array', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('"title"')
    expect(prompt).toContain('"segments"')
    expect(prompt).toContain('"text"')
    expect(prompt).toContain('"source"')
  })
})

describe('parseTopicResponse', () => {
  const validJson = '{"title": "My Topic", "segments": [{"text": "A: Hello\\n", "source": "ai"}, {"text": "B: Hi\\n", "source": "transcript:1"}]}'

  it('parses a valid topic JSON with segments', () => {
    const topic = parseTopicResponse(validJson)
    expect(topic.title).toBe('My Topic')
    expect(topic.segments).toHaveLength(2)
    expect(topic.segments[0].text).toContain('Hello')
    expect(topic.segments[0].source).toBe('ai')
    expect(topic.segments[1].source).toBe('transcript:1')
  })

  it('parses JSON wrapped in extra text (LLM output)', () => {
    const wrapped = 'Here is the topic:\n```json\n' + validJson + '\n```'
    const topic = parseTopicResponse(wrapped)
    expect(topic.title).toBe('My Topic')
  })

  it('throws on empty string', () => {
    expect(() => parseTopicResponse('')).toThrow('Empty response')
  })

  it('throws on null/undefined', () => {
    expect(() => parseTopicResponse(null)).toThrow('Empty response')
    expect(() => parseTopicResponse(undefined)).toThrow('Empty response')
  })

  it('throws when no JSON object found', () => {
    expect(() => parseTopicResponse('just some text')).toThrow('No JSON')
  })

  it('throws on invalid JSON', () => {
    expect(() => parseTopicResponse('{"title": "X", "segments": broken}')).toThrow('Failed to parse')
  })

  it('throws when title is missing', () => {
    expect(() => parseTopicResponse('{"segments": []}')).toThrow('missing valid title')
  })

  it('throws when segments is not an array', () => {
    expect(() => parseTopicResponse('{"title": "X", "segments": "not-array"}')).toThrow('missing segments array')
  })

  it('throws when segments is empty', () => {
    expect(() => parseTopicResponse('{"title": "X", "segments": []}')).toThrow('missing segments array')
  })

  it('throws when a segment is missing text', () => {
    expect(() => parseTopicResponse('{"title": "X", "segments": [{"source": "ai"}]}')).toThrow('missing text')
  })

  it('throws when a segment is missing source', () => {
    expect(() => parseTopicResponse('{"title": "X", "segments": [{"text": "hello"}]}')).toThrow('missing source')
  })
})
