import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  const [cropSize, setCropSize] = useState(280);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const clampOffset = useCallback((next: { x: number; y: number }, nextScale = scale) => {
    const { w, h } = imgNaturalSize;
    if (!w || !h) return { x: 0, y: 0 };
    const baseScale = Math.max(cropSize / w, cropSize / h);
    const scaledW = w * baseScale * nextScale;
    const scaledH = h * baseScale * nextScale;
    const maxX = Math.max(0, (scaledW - cropSize) / 2);
    const maxY = Math.max(0, (scaledH - cropSize) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }, [cropSize, imgNaturalSize, scale]);

  const setSafeScale = useCallback((value: number | ((current: number) => number)) => {
    setScale(current => {
      const next = Math.min(4, Math.max(1, typeof value === 'function' ? value(current) : value));
      setOffset(currentOffset => clampOffset(currentOffset, next));
      return next;
    });
  }, [clampOffset]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyTouchAction: body.style.touchAction,
    };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.touchAction = previous.bodyTouchAction;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const updateSize = () => {
      setCropSize(Math.min(320, Math.max(240, window.innerWidth - 96)));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [open]);

  useEffect(() => {
    if (!open || !imageSrc) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setSafeScale(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [open, imageSrc, setSafeScale]);

  const imgStyle = useMemo(() => {
    const { w, h } = imgNaturalSize;
    if (!w || !h) return { width: cropSize, height: cropSize };
    const baseScale = Math.max(cropSize / w, cropSize / h);
    return { width: w * baseScale, height: h * baseScale };
  }, [cropSize, imgNaturalSize]);

  useEffect(() => {
    if (!open) return;
    setOffset(current => clampOffset(current));
  }, [open, cropSize, imgNaturalSize.w, imgNaturalSize.h, clampOffset]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset(clampOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
  }, [dragging, dragStart, clampOffset]);

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

    const { width: displayW, height: displayH } = imgStyle;
    const scaledW = displayW * scale;
    const scaledH = displayH * scale;
    // Center of crop circle is center of container
    // Image is drawn at center + offset
    const drawX = (cropSize - scaledW) / 2 + offset.x;
    const drawY = (cropSize - scaledH) / 2 + offset.y;

    // Map crop circle (0,0,CROP_SIZE,CROP_SIZE) back to source image coords
    const scaleX = img.naturalWidth / scaledW;
    const scaleY = img.naturalHeight / scaledH;
    const srcX = (0 - drawX) * scaleX;
    const srcY = (0 - drawY) * scaleY;
    const srcW = cropSize * scaleX;
    const srcH = cropSize * scaleY;

    // Draw circular clip
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  }, [cropSize, imgStyle, scale, offset, onCrop]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] bg-background/55 backdrop-blur-xl flex flex-col items-center justify-center p-6"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between w-full max-w-xs mb-6">
            <button onClick={onClose} className="w-11 h-11 rounded-full bg-card/80 border border-border flex items-center justify-center active:scale-90 transition-transform shadow-lg">
              <X className="w-5 h-5 text-foreground" />
            </button>
            <p className="text-foreground font-semibold text-sm">Move & Scale</p>
            <button onClick={handleCrop} className="w-11 h-11 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-primary/30">
              <Check className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>

          {/* Crop area */}
          <div
            className="relative rounded-full overflow-hidden border-2 border-border cursor-move touch-none bg-muted shadow-2xl"
            style={{ width: cropSize, height: cropSize }}
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
                  left: (cropSize - imgStyle.width * scale) / 2 + offset.x,
                  top: (cropSize - imgStyle.height * scale) / 2 + offset.y,
                }}
                draggable={false}
              />
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-4 mt-6 rounded-full bg-card/80 border border-border px-4 py-3 shadow-lg">
            <button
              onClick={() => setSafeScale(s => s - 0.15)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
            >
              <ZoomOut className="w-5 h-5 text-foreground" />
            </button>
            <input
              type="range"
              min="1"
              max="4"
              step="0.05"
              value={scale}
              onChange={(e) => setSafeScale(parseFloat(e.target.value))}
              className="w-32 accent-primary"
            />
            <button
              onClick={() => setSafeScale(s => s + 0.15)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
            >
              <ZoomIn className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
