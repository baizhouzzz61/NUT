import Dexie from 'dexie'

const db = new Dexie('NUT')

db.version(1).stores({
  transcripts: 'id, title, createdAt',
  topics: 'id, title, createdAt',
})

export async function addTranscript(transcript) {
  return db.transcripts.add({ ...transcript, createdAt: new Date(), updatedAt: new Date() })
}

export async function updateTranscript(id, data) {
  return db.transcripts.update(id, { ...data, updatedAt: new Date() })
}

export async function deleteTranscript(id) {
  return db.transcripts.delete(id)
}

export async function getAllTranscripts() {
  return db.transcripts.orderBy('createdAt').reverse().toArray()
}

export async function getTranscript(id) {
  return db.transcripts.get(id)
}

export async function addTopic(topic) {
  return db.topics.add({ ...topic, createdAt: new Date() })
}

export async function getAllTopics() {
  return db.topics.orderBy('createdAt').reverse().toArray()
}

export async function clearAll() {
  await db.transcripts.clear()
  await db.topics.clear()
}
