export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    const corsHeaders = { 'Access-Control-Allow-Origin': '*' }

    try {
      if (url.pathname === '/api/transcribe' && request.method === 'POST') {
        return await handleTranscribe(request, env, corsHeaders)
      }
      if (url.pathname === '/api/generate-topic' && request.method === 'POST') {
        return await handleGenerateTopic(request, env, corsHeaders)
      }
      return new Response('Not found', { status: 404, headers: corsHeaders })
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  },
}

async function handleTranscribe(request, env, corsHeaders) {
  const formData = await request.formData()
  const audio = formData.get('audio')

  if (!audio) {
    return new Response(JSON.stringify({ error: 'No audio file' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const deepgramResp = await fetch(`${env.DEEPGRAM_API}?model=nova-2&smart_format=true`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
      'Content-Type': audio.type,
    },
    body: audio,
  })

  const result = await deepgramResp.json()
  const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''

  return new Response(JSON.stringify({ transcript }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

async function handleGenerateTopic(request, env, corsHeaders) {
  const { transcripts } = await request.json()

  if (!transcripts || !transcripts.length) {
    return new Response(JSON.stringify({ error: 'No transcripts provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const transcriptTexts = transcripts
    .map((t, i) => `[Transcript ${i + 1}: "${t.title}"]\n${t.content}`)
    .join('\n\n')

  const systemPrompt = `You are an English speaking practice tutor. Generate a random conversation topic along with example sentences for practice.

Rules:
1. The topic should be random and engaging — do NOT derive it from the provided transcripts.
2. Provide the topic title and a list of example sentences.
3. At least 50% of the example sentences MUST be taken verbatim from the provided transcripts. Mark each sentence with its source: "ai" for AI-generated, or the transcript index (e.g., "transcript:1") for sentences from transcripts.
4. The remaining sentences can be AI-generated to complement the practice.

Return ONLY valid JSON in this exact format:
{
  "title": "Topic title here",
  "examples": [
    { "text": "Example sentence", "source": "ai" },
    { "text": "Verbatim sentence from transcript", "source": "transcript:1" }
  ]
}`

  const userMessage = `Generate a speaking practice topic using these transcripts as example sources:\n\n${transcriptTexts}`

  const anthropicResp = await fetch(env.ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  const data = await anthropicResp.json()

  if (data.error) {
    return new Response(JSON.stringify({ error: data.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const content = data.content[0].text
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  const topic = JSON.parse(jsonMatch[0])

  return new Response(JSON.stringify({ topic }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
