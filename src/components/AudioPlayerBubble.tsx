import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerBubbleProps {
  src: string;
  isUser?: boolean;
}

export function AudioPlayerBubble({ src, isUser }: AudioPlayerBubbleProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bars] = useState(() =>
    Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2)
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setPlaying(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Draw waveform bars
  useEffect(() => {
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
    const barWidth = 2.5;
    const gap = 1.5;
    const totalBars = Math.floor(w / (barWidth + gap));
    const displayBars = bars.slice(0, totalBars);

    displayBars.forEach((amp, i) => {
      const x = i * (barWidth + gap);
      const barH = amp * (h - 4);
      const y = (h - barH) / 2;
      const isFilled = i / totalBars <= progress;

      ctx.fillStyle = isUser
        ? isFilled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)'
        : isFilled ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 1);
      ctx.fill();
    });
  }, [bars, currentTime, duration, isUser]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas || !duration) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause */}
      <button
        onClick={toggle}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
          isUser
            ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground'
            : 'bg-primary/10 hover:bg-primary/20 text-primary'
        )}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>

      {/* Waveform + time */}
      <div className="flex-1 flex flex-col gap-0.5">
        <canvas
          ref={canvasRef}
          onClick={seek}
          className="h-7 w-full cursor-pointer"
        />
        <div className="flex justify-between px-0.5">
          <span className={cn(
            'text-[10px]',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}>
            {fmt(playing ? currentTime : duration)}
          </span>
          <Mic className={cn(
            'h-3 w-3',
            isUser ? 'text-primary-foreground/50' : 'text-muted-foreground/50'
          )} />
        </div>
      </div>
    </div>
  );
}
