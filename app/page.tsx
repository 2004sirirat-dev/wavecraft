'use client';

import { useRef, useState } from 'react';

type Song = {
  id: string;
  title: string;
  meta: string;
  tag: string;
  audioUrl?: string;
  bars: number[];
};

const STYLES = ['Pop', 'Acoustic', 'Lo-fi', 'Cinematic', 'Lullaby', 'Hip-hop'];

const seedSongs: Song[] = [
  { id: 's1', title: 'Leaving Elm Street', meta: 'Pop · 1:42', tag: 'Pop', bars: randomBars() },
  { id: 's2', title: 'Static and Streetlights', meta: 'Lo-fi · 2:10', tag: 'Lo-fi', bars: randomBars() },
  { id: 's3', title: 'Paper Boats', meta: 'Acoustic · 1:58', tag: 'Acoustic', bars: randomBars() },
];

function randomBars() {
  return Array.from({ length: 28 }, () => 8 + Math.round(Math.random() * 56));
}

export default function Page() {
  const [songs, setSongs] = useState<Song[]>(seedSongs);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Pop');
  const [status, setStatus] = useState<'idle' | 'lyrics' | 'audio'>('idle');
  const [error, setError] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('Type an idea first');
      return;
    }
    setError('');
    try {
      setStatus('lyrics');
      const lyricsRes = await fetch('/api/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style }),
      });
      if (!lyricsRes.ok) throw new Error('Lyrics generation failed');
      const { lyrics } = await lyricsRes.json();

      setStatus('audio');
      const songRes = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics, style, lengthMs: 60000 }),
      });
      if (!songRes.ok) throw new Error('Song generation failed');
      const blob = await songRes.blob();
      const audioUrl = URL.createObjectURL(blob);

      const title = prompt.trim().split(' ').slice(0, 4).join(' ').replace(/[.,!?]$/, '');
      const newSong: Song = {
        id: `song-${Date.now()}`,
        title: title.charAt(0).toUpperCase() + title.slice(1),
        meta: `${style} · ~60 sec`,
        tag: style,
        audioUrl,
        bars: randomBars(),
      };
      setSongs((prev) => [newSong, ...prev]);
      setPrompt('');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setStatus('idle');
    }
  }

  function togglePlay(song: Song) {
    if (!song.audioUrl) return; // seed songs have no real audio
    if (playingId === song.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(song.audioUrl);
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(song.id);
  }

  const busy = status !== 'idle';

  return (
    <>
      <h2 className="sr-only">
        Wavecraft: an AI song generator with a prompt-based create panel and a feed of generated songs to browse and play.
      </h2>

      <nav>
        <div className="logo">
          <span className="logo-mark"></span>Wavecraft
        </div>
        <div className="nav-links">
          <a href="#">Discover</a>
          <a href="#">Library</a>
          <a href="#">Pricing</a>
          <button className="nav-cta">Sign up</button>
        </div>
      </nav>

      <section className="create-section">
        <h1>Describe a song. Get the whole track.</h1>
        <p className="sub">Lyrics, melody, and vocals — generated from a sentence.</p>

        <div className="create-panel">
          <textarea
            id="prompt"
            placeholder="A road-trip song about leaving a small town, warm and a little wistful..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="chip-row">
            {STYLES.map((s) => (
              <button
                key={s}
                className={`chip ${style === s ? 'active' : ''}`}
                onClick={() => setStyle(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="panel-footer">
            {error ? (
              <span className="error-label">{error}</span>
            ) : (
              <span className="duration-label">
                {status === 'lyrics' && 'Writing lyrics...'}
                {status === 'audio' && 'Composing audio — this can take 20–30s...'}
                {status === 'idle' && '~60 sec · vocals on'}
              </span>
            )}
            <button className="generate-btn" onClick={handleGenerate} disabled={busy} type="button">
              {busy ?
