export const SOURCE_AI = 'ai'

function sourceTranscript(n) {
  return `transcript:${n}`
}

export function buildSystemPrompt() {
  return `You are an English speaking practice tutor. Generate a random conversation topic along with example sentences for practice.

Rules:
1. The topic should be random and engaging — do NOT derive it from the provided transcripts.
2. Provide the topic title and a list of example sentences.
3. At least 50% of the example sentences MUST be taken verbatim from the provided transcripts. Mark each sentence with its source: "${SOURCE_AI}" for AI-generated, or "${sourceTranscript(1)}" (e.g., "${sourceTranscript(2)}") for sentences from transcripts.
4. The remaining sentences can be AI-generated to complement the practice.

Return ONLY valid JSON in this exact format:
{
  "title": "Topic title here",
  "examples": [
    { "text": "Example sentence", "source": "${SOURCE_AI}" },
    { "text": "Verbatim sentence from transcript", "source": "${sourceTranscript(1)}" }
  ]
}`
}

export function parseTopicResponse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty response from LLM')
  }

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('No JSON found in LLM response')
  }

  let data
  try {
    data = JSON.parse(match[0])
  } catch {
    throw new Error('Failed to parse LLM response as JSON')
  }

  if (!data.title || typeof data.title !== 'string') {
    throw new Error('Topic missing valid title')
  }
  if (!Array.isArray(data.examples) || data.examples.length === 0) {
    throw new Error('Topic missing examples array')
  }
  for (let i = 0; i < data.examples.length; i++) {
    const ex = data.examples[i]
    if (!ex.text || typeof ex.text !== 'string') {
      throw new Error(`Example ${i} missing text`)
    }
    if (!ex.source || typeof ex.source !== 'string') {
      throw new Error(`Example ${i} missing source`)
    }
  }

  return data
}

export function enrichExamples(examples, transcripts) {
  const srcMap = {}
  transcripts.forEach((t, i) => {
    srcMap[sourceTranscript(i + 1)] = { id: t.id, title: t.title }
  })

  return examples.map(ex => ({
    ...ex,
    transcriptId: srcMap[ex.source]?.id || null,
    transcriptTitle: srcMap[ex.source]?.title || null,
  }))
}
