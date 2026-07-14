import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Check, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';


interface CameraProps {
  open: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
}

export function Camera({ open, onClose, onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'preview'>('camera');

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. You can upload a photo instead.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedPhoto(null);
    setError(null);
    setMode('camera');
    onClose();
  }, [stopCamera, onClose]);

  const capturePhoto = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        setMode('preview');
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setMode('camera');
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      handleClose();
    }
  }, [capturedPhoto, onCapture, handleClose]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX = 1280;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedPhoto(dataUrl);
          setMode('preview');
          stopCamera();
        } else {
          setCapturedPhoto(src);
          setMode('preview');
          stopCamera();
        }
      };
      img.onerror = () => {
        setCapturedPhoto(src);
        setMode('preview');
        stopCamera();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, [stopCamera]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, [stopCamera]);

  const handleChooseGallery = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Start camera when facingMode changes
  useEffect(() => {
    if (open && mode === 'camera' && !stream && !capturedPhoto) {
      startCamera();
    }
  }, [facingMode]);

  // Reset when opened - go directly to camera
  useEffect(() => {
    if (open) {
      setCapturedPhoto(null);
      setError(null);
      setMode('camera');
      startCamera();
    } else {
      stopCamera();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Header */}
          <div className="flex items-center justify-between p-4 safe-top">
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </Button>
            <h1 className="text-white font-bold text-lg">
              {mode === 'camera' ? 'Take a Photo' : 'Preview'}
            </h1>
            <div className="w-10" />
          </div>

          {/* Main content */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {error && mode === 'camera' ? (
              <div className="text-center p-8 space-y-4">
                <p className="text-white/80 mb-4">{error}</p>
                <Button onClick={handleChooseGallery} variant="outline"
                  className="w-64 h-14 rounded-2xl border-white/30 text-white hover:bg-white/10 font-semibold text-base gap-3">
                  <ImagePlus className="w-5 h-5" />
                  Choose from Gallery
                </Button>
              </div>
            ) : mode === 'preview' && capturedPhoto ? (
              <img src={capturedPhoto} alt="Captured" className="w-full h-full object-contain" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
          </div>

          {/* Controls */}
          <div className="p-6 pb-10 safe-bottom">
            {mode === 'preview' ? (
              <div className="flex items-center justify-center gap-6">
                <Button variant="ghost" onClick={retakePhoto} className="text-white hover:bg-white/10 flex-col h-auto py-3 px-5 rounded-2xl">
                  <RotateCcw className="w-7 h-7 mb-1" />
                  <span className="text-xs font-medium">Retake</span>
                </Button>
                <button onClick={confirmPhoto} className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-2xl shadow-primary/40 flex items-center justify-center">
                  <Check className="w-9 h-9 text-white" />
                </button>
                <div className="w-[76px]" />
              </div>
            ) : mode === 'camera' ? (
              <div className="flex items-center justify-center gap-6">
                <Button variant="ghost" size="icon" onClick={handleChooseGallery} className="text-white hover:bg-white/10 w-14 h-14 rounded-2xl">
                  <ImagePlus className="w-6 h-6" />
                </Button>
                <button onClick={capturePhoto} disabled={!stream} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50 group">
                  <div className="w-16 h-16 rounded-full bg-white group-active:scale-90 transition-transform" />
                </button>
                <Button variant="ghost" size="icon" onClick={switchCamera} className="text-white hover:bg-white/10 w-14 h-14 rounded-2xl">
                  <RotateCcw className="w-6 h-6" />
                </Button>
              </div>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
