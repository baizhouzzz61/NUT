import { buildSystemPrompt, parseTopicResponse } from '../../src/shared/schema.js'

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'POST') {
    return new Response('Not found', { status: 404 })
  }

  try {
    const body = await request.json()
    const { transcripts, userPrompt } = body

    if (!transcripts || !transcripts.length) {
      return new Response(JSON.stringify({ error: 'No transcripts provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const content = data.choices[0].message.content
    const topic = parseTopicResponse(content)

    return new Response(JSON.stringify({ topic }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
