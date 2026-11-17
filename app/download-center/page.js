'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Icons, Ring } from '@/components/ui';

// MZAZI TECH — download centre.
//
// Listening is free and stays in the browser (embedded player). The download is
// the paid part: a pass in 30 / 100 / 300 shillings, bought from the wallet.
// The button never decides anything — the server checks the pass on the file
// request, so a forwarded link downloads nothing.

const dur = (s) => {
  const m = Math.floor((s || 0) / 60);
  const r = (s || 0) % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

export default function DownloadCenterPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState('');
  const [playing, setPlaying] = useState(null);
  // Watch shows the video; Listen drops to audio so it survives the screen
  // locking. Only one of them may ever be running, or you get two soundtracks.
  const [mode, setMode] = useState('watch');
  const [pass, setPass] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [paywall, setPaywall] = useState(null);
  const [busy, setBusy] = useState(false);
  const audioRef = useRef(null);

  // Media Session is what turns a playing tab into a notification with a pause
  // button, and what lets the audio survive the screen locking.
  const attachMediaSession = useCallback(() => {
    if (!('mediaSession' in navigator) || !playing) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: playing.title,
        artist: playing.author || 'MZAZI TECH',
        album: 'MZAZI Download Centre',
        artwork: [{ src: playing.thumb, sizes: '320x180', type: 'image/jpeg' }],
      });
      navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
      navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
      navigator.mediaSession.setActionHandler('stop', () => { audioRef.current?.pause(); setPlaying(null); });
    } catch {}
  }, [playing]);

  const stopPlayback = useCallback(() => {
    audioRef.current?.pause();
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
    setPlaying(null);
  }, []);

  const loadPass = useCallback(() => {
    fetch('/api/music/pass', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { setPass(d.pass); setTiers(d.tiers || []); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadPass(); }, [loadPass]);

  async function runSearch(e) {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    setSearching(true); setNote('');
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
      const d = await res.json();
      if (!res.ok) { setNote(d?.error || 'Search failed.'); setResults([]); return; }
      setResults(d.results || []);
      if (!d.results?.length) setNote('Nothing matched that — try a different title or artist.');
    } catch { setNote('Network error — try again.'); }
    finally { setSearching(false); }
  }

  async function download(song) {
    if (!pass) { setPaywall(song); return; }
    // A real navigation, so the phone's own download manager handles the file.
    window.location.href = `/api/music/download?id=${encodeURIComponent(song.id)}`;
  }

  async function buy(tier) {
    setBusy(true); setNote('');
    try {
      const res = await fetch('/api/music/pass', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const d = await res.json();
      if (!res.ok) { setNote(d?.error || 'Could not buy that pass.'); return; }
      setPass(d.pass);
      const song = paywall;
      setPaywall(null);
      if (song) setTimeout(() => { window.location.href = `/api/music/download?id=${encodeURIComponent(song.id)}`; }, 400);
    } catch { setNote('Network error — try again.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="wrap" style={{ paddingTop: 22, paddingBottom: 40 }}>
      <section className="anim-fade-up d1">
        <p className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--dim)' }}>Free to listen</p>
        <h1 className="section-title" style={{ marginTop: 6 }}>Download centre</h1>
        <p className="lede mt-3" style={{ maxWidth: 620 }}>
          Play anything here for free. To keep a song on your phone, a pass costs 30 a day,
          100 a week or 300 a month — paid from your wallet, no card needed.
        </p>
      </section>

      {pass && (
        <p className="dc-pass">
          <Icons.Check size={13} /> Downloads unlocked · {pass.tier} · until {new Date(pass.expires_at).toLocaleDateString()}
        </p>
      )}
      {note && <p className="tm-note">{note}</p>}

      <form className="dc-search" onSubmit={runSearch}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a song or artist…"
          aria-label="Search songs"
        />
        <Button type="submit" loading={searching} icon={<Icons.Search size={15} />}>Search</Button>
      </form>

      {searching && <div className="tm-loading"><Ring size={22} /><span>Looking…</span></div>}

      {playing && (
        <Card className="dc-player">
          <div className="dc-player-head">
            <div>
              <strong>{playing.title}</strong>
              <span>{playing.author} · now playing</span>
            </div>
            <button type="button" onClick={stopPlayback} aria-label="Close player">×</button>
          </div>
          {mode === 'watch' ? (
            <iframe
              className="dc-frame"
              title={playing.title}
              src={`https://www.youtube.com/embed/${playing.id}?autoplay=1&playsinline=1`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <audio
              ref={audioRef}
              className="dc-audio"
              controls
              autoPlay
              preload="none"
              src={`/api/music/stream?id=${encodeURIComponent(playing.id)}`}
              onPlay={attachMediaSession}
            />
          )}

          <div className="dc-mode">
            <button type="button" className={mode === 'watch' ? 'is-on' : ''} onClick={() => setMode('watch')}>
              Watch video
            </button>
            <button type="button" className={mode === 'listen' ? 'is-on' : ''} onClick={() => setMode('listen')}>
              Background audio
            </button>
          </div>
        </Card>
      )}

      <ul className="dc-list">
        {results.map((s) => (
          <li key={s.id}>
            <img src={s.thumb} alt="" loading="lazy" width="64" height="48" />
            <div className="dc-meta">
              <strong>{s.title}</strong>
              <span>{s.author} · {dur(s.seconds)}</span>
            </div>
            <div className="dc-actions">
              <button type="button" className="dc-play" onClick={() => setPlaying(s)} aria-label={`Play ${s.title}`}>
                <Icons.Play size={14} />
              </button>
              <button type="button" className="dc-dl" onClick={() => download(s)}>
                {pass ? 'Download' : 'Unlock'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {paywall && (
        <div className="tm-modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setPaywall(null); }}>
          <div className="tm-sheet dc-paywall">
            <div className="tm-sheet-head">
              <div>
                <strong>Download “{paywall.title.slice(0, 40)}”</strong>
                <span>Choose a pass — it covers every song until it expires.</span>
              </div>
              <button type="button" onClick={() => setPaywall(null)} aria-label="Close">×</button>
            </div>
            <div className="dc-tiers">
              {tiers.map((t) => (
                <button key={t.id} type="button" onClick={() => buy(t.id)} disabled={busy}>
                  <span>{t.label}</span>
                  <strong>{t.priceLabel}</strong>
                </button>
              ))}
            </div>
            <p className="dc-fine">Paid from your wallet balance. Songs save to your phone's Downloads folder.</p>
          </div>
        </div>
      )}
    </div>
  );
}
