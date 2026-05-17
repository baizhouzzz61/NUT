const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function transcribeAudio(audioFile) {
  const form = new FormData()
  form.append('audio', audioFile)
  const res = await fetch(`${API_BASE}/api/transcribe`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Transcription failed')
  }
  return res.json()
}

export async function generateTopic(transcripts, userPrompt) {
  const res = await fetch(`${API_BASE}/api/generate-topic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcripts, userPrompt }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Topic generation failed')
  }
  return res.json()
}
