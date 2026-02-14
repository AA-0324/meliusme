import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Crown, Infinity as InfinityIcon, Zap, Shield, Palette, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const proFeatures = [
  { icon: Zap, text: 'Advanced nutrition insights' },
  { icon: Palette, text: 'Premium custom themes' },
  { icon: Shield, text: 'Protein, fiber & sugar tracking' },
  { icon: Heart, text: 'Export data to CSV' },
];

export function ProUpgradeModal({ open, onClose }: ProUpgradeModalProps) {
  const { setPro } = useApp();

  const handleUpgrade = () => {
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
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm max-h-[88vh]"
          >
            {/* Close button */}
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white/40 hover:text-white hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Hero section */}
            <div className="text-center mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', damping: 12 }}
                className="relative w-16 h-16 mx-auto mb-4"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent-foreground rounded-2xl blur-xl opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent-foreground rounded-2xl flex items-center justify-center">
                  <Crown className="w-8 h-8 text-primary-foreground drop-shadow-lg" />
                </div>
              </motion.div>
              
              <h2 className="text-2xl font-extrabold text-white mb-1">
                MeliusMe <span className="text-primary">Pro</span>
              </h2>
              <p className="text-white/60 text-sm font-medium">Lifetime upgrade</p>
            </div>

            {/* Features */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 space-y-3 mb-4">
              {proFeatures.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Pricing */}
            <div className="text-center mb-4">
              <span className="text-4xl font-extrabold text-white">$4.99</span>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 rounded-full border border-primary/30">
                  <InfinityIcon className="w-4 h-4 text-primary" />
                  <span className="text-primary font-bold text-xs uppercase tracking-wide">Lifetime Access</span>
                </div>
              </div>
              <p className="text-white/40 text-xs mt-2 font-medium">One-time • No subscriptions</p>
            </div>

            {/* CTA */}
            <Button
              onClick={handleUpgrade}
              className="w-full h-12 text-sm font-bold rounded-2xl bg-primary hover:bg-primary/90 shadow-neon text-primary-foreground border-0"
            >
              Unlock MeliusMe Pro
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
