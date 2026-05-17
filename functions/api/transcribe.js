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
    const formData = await request.formData()
    const audio = formData.get('audio')

    if (!audio) {
      return new Response(JSON.stringify({ error: 'No audio file' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
