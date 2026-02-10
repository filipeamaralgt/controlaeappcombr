import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, SwitchCamera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File, preview: string) => void;
}

export function CameraCapture({ open, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flash, setFlash] = useState(false);

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setLoading(true);
    // Stop previous stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      onClose();
    } finally {
      setLoading(false);
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSwitchCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file, URL.createObjectURL(file));
        }
        handleClose();
      },
      'image/jpeg',
      0.92
    );
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-white hover:bg-white/20"
          onClick={handleClose}
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-white hover:bg-white/20"
          onClick={handleSwitchCamera}
        >
          <SwitchCamera className="h-5 w-5" />
        </Button>
      </div>

      {/* Video */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            loading ? 'opacity-0' : 'opacity-100',
            facingMode === 'user' && 'scale-x-[-1]'
          )}
        />
        {/* Flash overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-white pointer-events-none transition-opacity duration-200',
            flash ? 'opacity-70' : 'opacity-0'
          )}
        />
      </div>

      {/* Bottom bar */}
      <div className="bg-gradient-to-t from-black/80 to-transparent px-6 py-8 flex items-center justify-center">
        <button
          onClick={handleCapture}
          disabled={loading}
          className="relative h-[72px] w-[72px] rounded-full border-[4px] border-white flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50"
        >
          <div className="h-[58px] w-[58px] rounded-full bg-white transition-all active:bg-white/80" />
        </button>
      </div>
    </div>
  );
}
