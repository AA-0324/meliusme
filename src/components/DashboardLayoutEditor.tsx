import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { DashboardWidget, getDashboardLayout, saveDashboardLayout, resetDashboardLayout } from '@/lib/proFeatures';

interface DashboardLayoutEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (widgets: DashboardWidget[]) => void;
}

export function DashboardLayoutEditor({ open, onClose, onSave }: DashboardLayoutEditorProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  useEffect(() => {
    if (open) {
      getDashboardLayout().then(setWidgets);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const previous = { htmlOverflow: html.style.overflow, bodyOverflow: body.style.overflow };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
    };
  }, [open]);

  const toggleVisibility = (id: string) => {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setWidgets(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= widgets.length - 1) return;
    setWidgets(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    const reordered = widgets.map((w, i) => ({ ...w, order: i }));
    await saveDashboardLayout(reordered);
    onSave(reordered);
    onClose();
  };

  const handleReset = async () => {
    await resetDashboardLayout();
    const layout = await getDashboardLayout();
    setWidgets(layout);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-background/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-md h-[82dvh] sm:h-auto sm:max-h-[min(82dvh,640px)] flex flex-col border border-border safe-bottom overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Customize Layout</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Reorder and toggle widgets
            </p>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain mb-3 space-y-2 -mr-1 pr-1 pb-2 touch-pan-y">
              {widgets.map((widget, index) => (
                <div
                  key={widget.id}
                  className="flex items-center gap-2 bg-secondary/30 rounded-xl p-3 border border-border/50"
                >
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-0.5 rounded hover:bg-secondary transition-colors disabled:opacity-20"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === widgets.length - 1}
                      className="p-0.5 rounded hover:bg-secondary transition-colors disabled:opacity-20"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>

                  <span className={`flex-1 font-medium text-sm ${!widget.visible ? 'text-muted-foreground line-through' : ''}`}>
                    {widget.name}
                  </span>

                  <button
                    onClick={() => toggleVisibility(widget.id)}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  >
                    {widget.visible ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" onClick={handleReset} className="flex-1 rounded-xl gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
              <Button onClick={handleSave} className="flex-1 rounded-xl">
                Save Layout
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
