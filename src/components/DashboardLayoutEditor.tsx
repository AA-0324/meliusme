import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
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

  const toggleVisibility = (id: string) => {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    );
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
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-3xl p-6 max-w-sm w-full max-h-[80vh] flex flex-col border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Customize Layout</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Drag to reorder, toggle to show/hide widgets
            </p>

            <div className="flex-1 overflow-y-auto mb-4">
              <Reorder.Group axis="y" values={widgets} onReorder={setWidgets} className="space-y-2">
                {widgets.map((widget) => (
                  <Reorder.Item
                    key={widget.id}
                    value={widget}
                    className="flex items-center gap-3 bg-secondary/30 rounded-xl p-3 cursor-grab active:cursor-grabbing border border-border/50"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className={`flex-1 font-medium text-sm ${!widget.visible ? 'text-muted-foreground' : ''}`}>
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
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>

            <div className="flex gap-2">
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
