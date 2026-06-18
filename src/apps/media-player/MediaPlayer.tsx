'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface MediaPlayerProps {
  windowId: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  frequency?: number; // for generated tones
}

const SAMPLE_TRACKS: Track[] = [
  { id: '1', title: 'Ambient Dreams', artist: 'WebOS Audio', duration: 30, frequency: 440 },
  { id: '2', title: 'Digital Sunrise', artist: 'WebOS Audio', duration: 25, frequency: 523 },
  { id: '3', title: 'Neon Pulse', artist: 'WebOS Audio', duration: 35, frequency: 349 },
  { id: '4', title: 'Cosmic Journey', artist: 'WebOS Audio', duration: 28, frequency: 392 },
  { id: '5', title: 'Binary Rain', artist: 'WebOS Audio', duration: 32, frequency: 466 },
];

export default function MediaPlayer({ windowId }: MediaPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<Track>(SAMPLE_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const stopAudio = useCallback(() => {
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch { /* ignore */ }
      oscillatorRef.current = null;
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
    cancelAnimationFrame(animationRef.current);
  }, []);

  const startAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;

    stopAudio();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const analyser = ctx.createAnalyser();

    oscillator.type = 'sine';
    oscillator.frequency.value = currentTrack.frequency || 440;

    // Add subtle vibrato for interest
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 3;
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    lfo.start();

    gain.gain.value = volume * 0.15; // Keep it quiet
    analyser.fftSize = 256;

    oscillator.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);

    oscillator.start();
    oscillatorRef.current = oscillator;
    gainRef.current = gain;
    analyserRef.current = analyser;

    // Update time
    timeIntervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= currentTrack.duration) {
          setIsPlaying(false);
          stopAudio();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    // Visualizer
    const drawVisualizer = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      const canvas = canvasRef.current;
      const ctx2d = canvas.getContext('2d');
      if (!ctx2d) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx2d.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        const hue = (i / bufferLength) * 120 + 200;
        ctx2d.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
        ctx2d.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(drawVisualizer);
    };
    drawVisualizer();
  }, [currentTrack, volume, stopAudio]);

  useEffect(() => {
    if (isPlaying) {
      startAudio();
    } else {
      stopAudio();
    }
    return stopAudio;
  }, [isPlaying, startAudio, stopAudio]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume * 0.15;
    }
  }, [volume]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const selectTrack = (track: Track) => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentTrack(track);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-surface)' }}>
      {/* Visualizer */}
      <div className="relative h-40 flex-shrink-0" style={{ background: 'var(--bg-primary)' }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          className="w-full h-full"
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-20">🎵</span>
          </div>
        )}
      </div>

      {/* Now Playing */}
      <div className="px-4 py-3 text-center">
        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{currentTrack.title}</div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{currentTrack.artist}</div>
      </div>

      {/* Progress */}
      <div className="px-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-8 text-right" style={{ color: 'var(--text-tertiary)' }}>{formatTime(currentTime)}</span>
          <div className="flex-1 h-1 rounded-full cursor-pointer" style={{ background: 'var(--bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(currentTime / currentTrack.duration) * 100}%`, background: 'var(--accent)' }}
            />
          </div>
          <span className="text-[10px] w-8" style={{ color: 'var(--text-tertiary)' }}>{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4">
        <button className="text-lg opacity-50 hover:opacity-100 transition-all" onClick={() => {
          const idx = SAMPLE_TRACKS.findIndex(t => t.id === currentTrack.id);
          selectTrack(SAMPLE_TRACKS[idx > 0 ? idx - 1 : SAMPLE_TRACKS.length - 1]);
        }}>⏮</button>
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all hover:brightness-110 active:scale-95"
          style={{ background: 'var(--accent)', color: 'white' }}
          onClick={togglePlay}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="text-lg opacity-50 hover:opacity-100 transition-all" onClick={() => {
          const idx = SAMPLE_TRACKS.findIndex(t => t.id === currentTrack.id);
          selectTrack(SAMPLE_TRACKS[(idx + 1) % SAMPLE_TRACKS.length]);
        }}>⏭</button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 px-6 mb-3">
        <span className="text-sm">🔈</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 accent-[var(--accent)]"
        />
        <span className="text-sm">🔊</span>
      </div>

      {/* Playlist */}
      <div className="flex-1 overflow-y-auto border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="px-3 py-2 text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          Playlist
        </div>
        {SAMPLE_TRACKS.map(track => (
          <button
            key={track.id}
            className={`w-full flex items-center gap-3 px-3 py-2 transition-all text-left ${
              currentTrack.id === track.id ? '' : 'hover:bg-white/5'
            }`}
            style={{
              background: currentTrack.id === track.id ? 'var(--accent-muted)' : undefined,
            }}
            onClick={() => selectTrack(track)}
          >
            <span className="text-sm">
              {currentTrack.id === track.id && isPlaying ? '🔊' : '🎵'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: currentTrack.id === track.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                {track.title}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{track.artist}</div>
            </div>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{formatTime(track.duration)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
