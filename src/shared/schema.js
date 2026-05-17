export function buildSystemPrompt() {
  return `You are an English speaking practice tutor. The user will describe a topic they want to practice. Generate a continuous, flowing conversation dialogue matching their request.

Rules:
1. The ENTIRE response must be in English — never output Chinese or any other language.
2. Generate a single long, continuous conversation passage: a back-and-forth dialogue between 2-3 speakers (labeled as A:, B:, etc.). Do NOT output individual sentences, bullet points, or a numbered list.
3. Weave material from the provided transcripts naturally into the dialogue. You may adapt and modify transcript sentences — change a few words, rephrase slightly — to fit the conversation flow and the user's requested topic. They do not need to be 100% verbatim.
4. At least 50% of the dialogue content should be derived or adapted from the provided transcripts.

Return ONLY valid JSON in this exact format:
{
  "title": "Topic title here",
  "passage": "The full continuous dialogue as a single string with speaker labels like A: ... B: ..."
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
  if (!data.passage || typeof data.passage !== 'string' || !data.passage.trim()) {
    throw new Error('Topic missing passage')
  }

  return data
}
