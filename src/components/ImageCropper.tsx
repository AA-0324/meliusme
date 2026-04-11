import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/button';

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCrop: (croppedDataUrl: string) => void;
}

export function ImageCropper({ open, imageSrc, onClose, onCrop }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!open || !imageSrc) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.width, h: img.height });
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [open, imageSrc]);

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

    const cropSize = 256;
    const canvas = document.createElement('canvas');
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext('2d')!;

    // Calculate the visible area in image coordinates
    const viewSize = 240; // matches the CSS crop circle
    const imgScale = Math.max(viewSize / img.width, viewSize / img.height) * scale;
    const drawW = img.width * imgScale;
    const drawH = img.height * imgScale;
    const drawX = (viewSize - drawW) / 2 + offset.x;
    const drawY = (viewSize - drawH) / 2 + offset.y;

    // Map crop circle back to source
    const srcX = (0 - drawX) / imgScale;
    const srcY = (0 - drawY) / imgScale;
    const srcSize = viewSize / imgScale;

    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, cropSize, cropSize);
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  }, [scale, offset, onCrop]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-black/90 flex flex-col items-center justify-center p-6"
        >
          <div className="flex items-center justify-between w-full max-w-sm mb-4">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
            <p className="text-white font-semibold text-sm">Move & Scale</p>
            <button onClick={handleCrop} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>

          <div
            ref={containerRef}
            className="relative w-60 h-60 rounded-full overflow-hidden border-2 border-white/30 cursor-move touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {imgSize.w > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: 'center',
                }}
              >
                <img
                  src={imageSrc}
                  alt=""
                  className="max-w-none"
                  style={{
                    width: imgSize.w > imgSize.h ? 'auto' : '240px',
                    height: imgSize.h >= imgSize.w ? 'auto' : '240px',
                    minWidth: '240px',
                    minHeight: '240px',
                  }}
                  draggable={false}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center"
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
              className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center"
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
