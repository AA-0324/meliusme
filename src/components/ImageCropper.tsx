import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCrop: (croppedDataUrl: string) => void;
}

export function ImageCropper({ open, imageSrc, onClose, onCrop }: ImageCropperProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const CROP_SIZE = 240;

  useEffect(() => {
    if (!open || !imageSrc) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [open, imageSrc]);

  // Calculate image dimensions to cover the crop circle
  const getImgStyle = () => {
    const { w, h } = imgNaturalSize;
    if (w === 0 || h === 0) return { width: CROP_SIZE, height: CROP_SIZE };
    const aspect = w / h;
    let displayW: number, displayH: number;
    if (aspect >= 1) {
      // Landscape: height = CROP_SIZE, width scales
      displayH = CROP_SIZE;
      displayW = CROP_SIZE * aspect;
    } else {
      // Portrait: width = CROP_SIZE, height scales
      displayW = CROP_SIZE;
      displayH = CROP_SIZE / aspect;
    }
    return { width: displayW, height: displayH };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const outputSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d')!;

    const { width: displayW, height: displayH } = getImgStyle();
    const scaledW = displayW * scale;
    const scaledH = displayH * scale;
    // Center of crop circle is center of container
    // Image is drawn at center + offset
    const drawX = (CROP_SIZE - scaledW) / 2 + offset.x;
    const drawY = (CROP_SIZE - scaledH) / 2 + offset.y;

    // Map crop circle (0,0,CROP_SIZE,CROP_SIZE) back to source image coords
    const scaleX = img.naturalWidth / scaledW;
    const scaleY = img.naturalHeight / scaledH;
    const srcX = (0 - drawX) * scaleX;
    const srcY = (0 - drawY) * scaleY;
    const srcW = CROP_SIZE * scaleX;
    const srcH = CROP_SIZE * scaleY;

    // Draw circular clip
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  }, [scale, offset, onCrop, imgNaturalSize]);

  const imgStyle = getImgStyle();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-6"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between w-full max-w-xs mb-6">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform">
              <X className="w-5 h-5 text-white" />
            </button>
            <p className="text-white font-semibold text-sm">Move & Scale</p>
            <button onClick={handleCrop} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform">
              <Check className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>

          {/* Crop area */}
          <div
            className="relative rounded-full overflow-hidden border-2 border-white/20 cursor-move touch-none"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {imgNaturalSize.w > 0 && (
              <img
                src={imageSrc}
                alt=""
                className="absolute pointer-events-none select-none"
                style={{
                  width: imgStyle.width * scale,
                  height: imgStyle.height * scale,
                  left: (CROP_SIZE - imgStyle.width * scale) / 2 + offset.x,
                  top: (CROP_SIZE - imgStyle.height * scale) / 2 + offset.y,
                }}
                draggable={false}
              />
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
            >
              <ZoomOut className="w-5 h-5 text-white" />
            </button>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-32 accent-primary"
            />
            <button
              onClick={() => setScale(s => Math.min(3, s + 0.1))}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
