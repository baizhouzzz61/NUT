import { buildSystemPrompt, parseTopicResponse } from '../../src/shared/schema.js'

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
  const { transcripts, userPrompt } = await request.json()

  if (!transcripts || !transcripts.length) {
    return new Response(JSON.stringify({ error: 'No transcripts provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const transcriptTexts = transcripts
    .map((t, i) => `[Transcript ${i + 1}: "${t.title}"]\n${t.content}`)
    .join('\n\n')

  const promptHint = userPrompt ? `The user wants a topic about: "${userPrompt}".` : ''
  const userMessage = `${promptHint} Generate a speaking practice topic using these transcripts as example sources:\n\n${transcriptTexts}`

  const systemPrompt = buildSystemPrompt()

  const deepseekResp = await fetch(env.DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  })

  const data = await deepseekResp.json()

  if (data.error) {
    return new Response(JSON.stringify({ error: data.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const content = data.choices[0].message.content
  const topic = parseTopicResponse(content)

  return new Response(JSON.stringify({ topic }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
