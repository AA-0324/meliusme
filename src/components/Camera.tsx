import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera as CameraIcon, X, RotateCcw, Check, Image } from 'lucide-react';
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

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
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
    onClose();
  }, [stopCamera, onClose]);

  const capturePhoto = useCallback(() => {
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
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setCapturedPhoto(dataUrl);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  }, [stopCamera]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, [stopCamera]);

  // Start camera when facingMode changes after switching
  useEffect(() => {
    if (open && !stream && !capturedPhoto) {
      startCamera();
    }
  }, [facingMode]);

  // Start camera when opened
  useEffect(() => {
    if (open) {
      setCapturedPhoto(null);
      setError(null);
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
          {/* Hidden elements */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Header */}
          <div className="flex items-center justify-between p-4 safe-top">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </Button>
            <h1 className="text-white font-semibold">Take a Photo</h1>
            <div className="w-10" />
          </div>

          {/* Camera view / Preview */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {error ? (
              <div className="text-center p-8">
                <p className="text-white/80 mb-4">{error}</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-black hover:bg-white/90"
                >
                  <Image className="w-5 h-5 mr-2" />
                  Choose from Gallery
                </Button>
              </div>
            ) : capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Controls */}
          <div className="p-6 safe-bottom">
            {capturedPhoto ? (
              <div className="flex items-center justify-center gap-8">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={retakePhoto}
                  className="text-white hover:bg-white/10 flex-col h-auto py-3"
                >
                  <RotateCcw className="w-8 h-8 mb-1" />
                  <span className="text-xs">Retake</span>
                </Button>
                <Button
                  onClick={confirmPhoto}
                  className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90"
                >
                  <Check className="w-10 h-10" />
                </Button>
                <div className="w-16" />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-white hover:bg-white/10 w-12 h-12"
                >
                  <Image className="w-6 h-6" />
                </Button>
                <button
                  onClick={capturePhoto}
                  disabled={!stream}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50"
                >
                  <div className="w-16 h-16 rounded-full bg-white" />
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="text-white hover:bg-white/10 w-12 h-12"
                >
                  <CameraIcon className="w-6 h-6" />
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
