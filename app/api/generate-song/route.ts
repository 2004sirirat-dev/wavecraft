import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { lyrics, style, lengthMs } = await req.json();

  if (!lyrics || typeof lyrics !== 'string') {
    return NextResponse.json({ error: 'Missing lyrics' }, { status: 400 });
  }

  const prompt = `${style} song. Lyrics:\n${lyrics}`;
  const duration = Math.min(Math.max(lengthMs || 60000, 10000), 300000); // clamp 10s-5min

  const elevenRes = await fetch(
    'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/*',
        'xi-api-key': process.env.ELEVENLABS_API_KEY as string,
      },
      body: JSON.stringify({
        prompt,
        music_length_ms: duration,
        model_id: 'music_v2',
      }),
    }
  );

  if (!elevenRes.ok) {
    const errText = await elevenRes.text();
    return NextResponse.json({ error: errText }, { status: 500 });
  }

  const audioBuffer = await elevenRes.arrayBuffer();
  return new NextResponse(Buffer.from(audioBuffer), {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
}
