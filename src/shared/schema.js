export const SOURCE_AI = 'ai'

export function buildSystemPrompt() {
  return `You are an English speaking practice tutor. The user will describe a topic they want to practice. Generate a continuous, flowing conversation dialogue matching their request.

Rules:
1. The ENTIRE response must be in English — never output Chinese or any other language.
2. Generate a back-and-forth dialogue between 2-3 speakers (labeled as A:, B:, etc.). Break it into natural turn-by-turn segments — each segment is one speaker's line or a short group of lines.
3. Weave material from the provided transcripts naturally into the dialogue. You may adapt and modify transcript sentences — change a few words, rephrase slightly — to fit the conversation flow and the user's requested topic. They do not need to be 100% verbatim.
4. At least 50% of the dialogue content should be derived or adapted from the provided transcripts.

For each segment, mark its source: use "${SOURCE_AI}" for AI-generated content, or "transcript:1", "transcript:2" etc. for content adapted from transcripts. Map transcript numbers to the same transcripts provided in order.

Return ONLY valid JSON in this exact format:
{
  "title": "Topic title here",
  "segments": [
    {"text": "A: Hello there!\\n", "source": "ai"},
    {"text": "B: Hi! Good to see you.\\n", "source": "transcript:1"}
  ]
}`
}

export function parseTopicResponse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty response from LLM')
  }

  // Strip markdown code fences that LLMs sometimes wrap JSON in
  let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim()

  const match = cleaned.match(/\{[\s\S]*\}/)
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
  if (!Array.isArray(data.segments) || data.segments.length === 0) {
    throw new Error('Topic missing segments array')
  }
  for (let i = 0; i < data.segments.length; i++) {
    const s = data.segments[i]
    if (!s.text || typeof s.text !== 'string') {
      throw new Error(`Segment ${i} missing text`)
    }
    if (!s.source || typeof s.source !== 'string') {
      throw new Error(`Segment ${i} missing source`)
    }
  }

  return data
}
