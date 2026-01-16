import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Crown, Infinity as InfinityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const proFeatures = [
  'Track protein, fiber & sugar goals',
  'Advanced nutrition charts & insights',
  'Beautiful custom app themes',
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
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden"
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-6 right-6 text-white/60 hover:text-white hover:bg-white/10 rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Hero section */}
            <div className="relative text-center pt-8 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                className="relative w-20 h-20 mx-auto mb-5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-3xl rotate-6 opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-3xl flex items-center justify-center">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </motion.div>
              </motion.div>
              
              <h2 className="text-3xl font-extrabold text-white mb-2">
                Melius Pro
              </h2>
              <p className="text-white/70 text-base font-medium">
                Your health journey, supercharged
              </p>
            </div>

            {/* Features */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-5 mx-1 space-y-3">
              {proFeatures.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-6 mb-4"
            >
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-extrabold text-white">$4.99</span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <InfinityIcon className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-bold text-sm uppercase tracking-wide">
                  Lifetime Access
                </span>
              </div>
              <p className="text-white/50 text-xs mt-1">
                One-time payment • No subscriptions ever
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="px-1 pb-2"
            >
              <Button
                onClick={handleUpgrade}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-500 hover:via-orange-600 hover:to-rose-600 shadow-2xl shadow-orange-500/30 text-white border-0"
              >
                Unlock Pro Forever
              </Button>
              <p className="text-center text-white/40 text-xs mt-4">
                Join 10,000+ users who've transformed their health
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}