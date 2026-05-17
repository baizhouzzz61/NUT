import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, parseTopicResponse } from '../src/shared/schema'

describe('buildSystemPrompt', () => {
  it('requires English-only output', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('English')
    expect(prompt).toContain('never output Chinese')
  })

  it('requires continuous passage, not individual sentences', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('continuous')
    expect(prompt).toContain('passage')
    expect(prompt).toContain('speaker labels')
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

  it('includes JSON schema with title and passage', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('"title"')
    expect(prompt).toContain('"passage"')
  })
})

describe('parseTopicResponse', () => {
  const validJson = '{"title": "My Topic", "passage": "A: Hello\\nB: Hi there\\nA: How are you?"}'

  it('parses a valid topic JSON', () => {
    const topic = parseTopicResponse(validJson)
    expect(topic.title).toBe('My Topic')
    expect(topic.passage).toContain('Hello')
    expect(topic.passage).toContain('Hi there')
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
    expect(() => parseTopicResponse('{"title": "X", "passage": broken}')).toThrow('Failed to parse')
  })

  it('throws when title is missing', () => {
    expect(() => parseTopicResponse('{"passage": "Hello"}')).toThrow('missing valid title')
  })

  it('throws when passage is missing', () => {
    expect(() => parseTopicResponse('{"title": "X"}')).toThrow('missing passage')
  })

  it('throws when passage is empty', () => {
    expect(() => parseTopicResponse('{"title": "X", "passage": ""}')).toThrow('missing passage')
    expect(() => parseTopicResponse('{"title": "X", "passage": "   "}')).toThrow('missing passage')
  })
})
