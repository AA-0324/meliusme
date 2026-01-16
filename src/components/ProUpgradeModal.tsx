import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const proFeatures = [
  'Track protein, fiber & sugar goals',
  'Advanced nutrition charts',
  'Weekly averages & insights',
  'Export all data to CSV',
  'Custom meal tags',
];

export function ProUpgradeModal({ open, onClose }: ProUpgradeModalProps) {
  const { setPro } = useApp();

  const handleUpgrade = () => {
    // In a real app, this would trigger payment
    // For demo, we just set pro status
    setPro(true);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-warning to-warning/70 p-8 text-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 text-warning-foreground/80 hover:text-warning-foreground hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Melius Pro</h2>
              <p className="text-white/80 mt-1">Unlock all features</p>
            </div>

            {/* Features */}
            <div className="p-6 space-y-4">
              {proFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="p-6 pt-0">
              <Button
                onClick={handleUpgrade}
                className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70"
              >
                Upgrade for $4.99
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                One-time purchase • Lifetime access
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
