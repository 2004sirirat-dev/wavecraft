import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { prompt, style } = await req.json();

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY as string,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content:
            `Write song lyrics in a ${style} style about: "${prompt}".\n` +
            `Structure them with section labels on their own lines: [Intro], [Verse 1], [Chorus], [Verse 2], [Chorus], [Outro].\n` +
            `Keep the whole thing under 200 words. Return only the lyrics, nothing else.`,
        },
      ],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return NextResponse.json({ error: errText }, { status: 500 });
  }

  const data = await anthropicRes.json();
  const lyrics = (data.content || [])
    .map((block: any) => block.text || '')
    .join('\n')
    .trim();

  return NextResponse.json({ lyrics });
}
