import { describe, it, expect } from 'vitest'
import { SOURCE_AI, buildSystemPrompt, parseTopicResponse, enrichExamples } from '../src/shared/schema'

describe('SOURCE_AI', () => {
  it('is the string "ai"', () => {
    expect(SOURCE_AI).toBe('ai')
  })
})

describe('buildSystemPrompt', () => {
  it('includes the 50% rule', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('50%')
    expect(prompt).toContain('verbatim')
  })

  it('includes SOURCE_AI and transcript source format', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('"ai"')
    expect(prompt).toContain('"transcript:1"')
  })

  it('includes JSON schema in the prompt', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('"title"')
    expect(prompt).toContain('"examples"')
    expect(prompt).toContain('"text"')
    expect(prompt).toContain('"source"')
  })
})

describe('parseTopicResponse', () => {
  const validJson = '{"title": "My Topic", "examples": [{"text": "Hello", "source": "ai"}, {"text": "World", "source": "transcript:1"}]}'

  it('parses a valid topic JSON', () => {
    const topic = parseTopicResponse(validJson)
    expect(topic.title).toBe('My Topic')
    expect(topic.examples).toHaveLength(2)
    expect(topic.examples[0].text).toBe('Hello')
    expect(topic.examples[0].source).toBe('ai')
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
    expect(() => parseTopicResponse('{"title": "X", "examples": [}')).toThrow('Failed to parse')
  })

  it('throws when title is missing', () => {
    expect(() => parseTopicResponse('{"examples": []}')).toThrow('missing valid title')
  })

  it('throws when examples is not an array', () => {
    expect(() => parseTopicResponse('{"title": "X", "examples": "not-array"}')).toThrow('missing examples array')
  })

  it('throws when examples is empty', () => {
    expect(() => parseTopicResponse('{"title": "X", "examples": []}')).toThrow('missing examples array')
  })

  it('throws when an example is missing text', () => {
    expect(() => parseTopicResponse('{"title": "X", "examples": [{"source": "ai"}]}')).toThrow('missing text')
  })

  it('throws when an example is missing source', () => {
    expect(() => parseTopicResponse('{"title": "X", "examples": [{"text": "hello"}]}')).toThrow('missing source')
  })
})

describe('enrichExamples', () => {
  const examples = [
    { text: 'AI sentence', source: 'ai' },
    { text: 'From transcript', source: 'transcript:1' },
    { text: 'Also from transcript', source: 'transcript:2' },
  ]

  const transcripts = [
    { id: 't1', title: 'First' },
    { id: 't2', title: 'Second' },
  ]

  it('enriches transcript-sourced examples with id and title', () => {
    const enriched = enrichExamples(examples, transcripts)
    expect(enriched[1].transcriptId).toBe('t1')
    expect(enriched[1].transcriptTitle).toBe('First')
    expect(enriched[2].transcriptId).toBe('t2')
    expect(enriched[2].transcriptTitle).toBe('Second')
  })

  it('leaves AI-sourced examples with null transcript fields', () => {
    const enriched = enrichExamples(examples, transcripts)
    expect(enriched[0].transcriptId).toBeNull()
    expect(enriched[0].transcriptTitle).toBeNull()
    expect(enriched[0].source).toBe('ai')
  })

  it('preserves all original fields', () => {
    const enriched = enrichExamples(examples, transcripts)
    expect(enriched[0].text).toBe('AI sentence')
    expect(enriched[0].source).toBe('ai')
  })

  it('handles unknown source keys by assigning nulls', () => {
    const unknownSource = [{ text: 'Mystery', source: 'transcript:99' }]
    const enriched = enrichExamples(unknownSource, transcripts)
    expect(enriched[0].transcriptId).toBeNull()
    expect(enriched[0].transcriptTitle).toBeNull()
  })
})
