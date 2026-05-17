import { describe, it, expect, beforeEach } from 'vitest'
import { addTranscript, getAllTranscripts, updateTranscript, deleteTranscript, addTopic, getAllTopics, getTranscript, clearAll } from '../src/db'

beforeEach(async () => {
  await clearAll()
})

describe('transcripts', () => {
  it('adds and retrieves a transcript', async () => {
    await addTranscript({ id: '1', title: 'Test', content: 'Hello world', source: 'manual' })
    const all = await getAllTranscripts()
    expect(all).toHaveLength(1)
    expect(all[0].title).toBe('Test')
    expect(all[0].source).toBe('manual')
  })

  it('returns transcripts sorted by createdAt descending', async () => {
    await addTranscript({ id: '1', title: 'First', content: 'A', source: 'manual', createdAt: new Date('2024-01-01') })
    await addTranscript({ id: '2', title: 'Second', content: 'B', source: 'audio', createdAt: new Date('2024-06-01') })
    const all = await getAllTranscripts()
    expect(all[0].title).toBe('Second')
    expect(all[1].title).toBe('First')
  })

  it('updates a transcript', async () => {
    await addTranscript({ id: '1', title: 'Original', content: 'Hello', source: 'manual' })
    await updateTranscript('1', { title: 'Updated', content: 'World' })
    const t = await getTranscript('1')
    expect(t.title).toBe('Updated')
    expect(t.content).toBe('World')
  })

  it('deletes a transcript', async () => {
    await addTranscript({ id: '1', title: 'To Delete', content: '...', source: 'manual' })
    await deleteTranscript('1')
    const all = await getAllTranscripts()
    expect(all).toHaveLength(0)
  })

  it('gets a single transcript by id', async () => {
    await addTranscript({ id: 'x', title: 'X', content: 'content-x', source: 'audio' })
    const t = await getTranscript('x')
    expect(t.title).toBe('X')
  })

  it('sets createdAt and updatedAt on add', async () => {
    await addTranscript({ id: '1', title: 'T', content: 'C', source: 'manual' })
    const all = await getAllTranscripts()
    expect(all[0].createdAt).toBeInstanceOf(Date)
    expect(all[0].updatedAt).toBeInstanceOf(Date)
  })
})

describe('topics', () => {
  it('adds and retrieves a topic', async () => {
    await addTopic({
      id: 't1',
      title: 'Daily Routines',
      examples: [{ text: 'I wake up early', source: 'ai' }],
      usedTranscriptIds: ['1'],
    })
    const all = await getAllTopics()
    expect(all).toHaveLength(1)
    expect(all[0].title).toBe('Daily Routines')
    expect(all[0].examples).toHaveLength(1)
  })

  it('returns topics sorted by createdAt descending', async () => {
    await addTopic({ id: 't1', title: 'Old', examples: [], usedTranscriptIds: [], createdAt: new Date('2024-01-01') })
    await addTopic({ id: 't2', title: 'New', examples: [], usedTranscriptIds: [], createdAt: new Date('2024-12-01') })
    const all = await getAllTopics()
    expect(all[0].title).toBe('New')
  })

})

