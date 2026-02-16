import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerBubbleProps {
  src: string;
  isUser?: boolean;
  compact?: boolean;
}

export function AudioPlayerBubble({ src, isUser, compact }: AudioPlayerBubbleProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bars] = useState(() =>
    Array.from({ length: 48 }, () => Math.random() * 0.7 + 0.3)
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const progress = duration > 0 ? currentTime / duration : 0;
    const barWidth = compact ? 2 : 2.5;
    const gap = compact ? 1 : 1.5;
    const totalBars = Math.floor(w / (barWidth + gap));
    const displayBars = bars.slice(0, totalBars);

    displayBars.forEach((amp, i) => {
      const x = i * (barWidth + gap);
      const barH = amp * (h - 6);
      const y = (h - barH) / 2;
      const isFilled = i / totalBars <= progress;

      ctx.fillStyle = isUser
        ? isFilled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)'
        : isFilled ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.25)';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 1);
      ctx.fill();
    });

    // Draw scrubber dot
    if (duration > 0) {
      const dotX = progress * w;
      const dotR = compact ? 4 : 5;
      ctx.fillStyle = isUser ? 'rgba(255,255,255,0.95)' : 'hsl(var(--primary))';
      ctx.beginPath();
      ctx.arc(Math.max(dotR, Math.min(dotX, w - dotR)), h / 2, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [bars, currentTime, duration, isUser, compact]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      // Re-assign src to ensure it's loaded (fixes iOS playback issues)
      if (audio.readyState === 0) {
        audio.src = src;
        audio.load();
      }
      audio.play().then(() => setPlaying(true)).catch((err) => {
        console.warn('Audio playback failed:', err);
        setPlaying(false);
      });
    }
  };

  const seek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas || !duration) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  };

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const btnSize = compact ? 'h-8 w-8' : 'h-10 w-10';
  const iconSize = compact ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';

  return (
    <div className={cn('flex items-center gap-2', compact ? 'min-w-[180px]' : 'min-w-[210px]')}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause */}
      <button
        onClick={toggle}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full transition-all active:scale-95',
          btnSize,
          isUser
            ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground'
            : 'bg-primary/15 hover:bg-primary/25 text-primary'
        )}
      >
        {playing ? <Pause className={iconSize} /> : <Play className={cn(iconSize, 'ml-0.5')} />}
      </button>

      {/* Waveform + time */}
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <canvas
          ref={canvasRef}
          onClick={seek}
          className={cn('w-full cursor-pointer', compact ? 'h-6' : 'h-8')}
        />
        <span className={cn(
          'text-[10px] leading-none',
          isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
        )}>
          {fmt(playing ? currentTime : duration)}
        </span>
      </div>
    </div>
  );
}
