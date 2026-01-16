import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Crown, Infinity as InfinityIcon, Zap, Shield, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const proFeatures = [
  { icon: Zap, text: 'Advanced nutrition insights & charts' },
  { icon: Palette, text: 'Beautiful custom app themes' },
  { icon: Shield, text: 'Track protein, fiber & sugar goals' },
  { icon: Sparkles, text: 'Export all data to CSV' },
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
          className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-xl flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-8 right-6 text-white/40 hover:text-white hover:bg-white/10 rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Hero section */}
            <div className="relative text-center py-8">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', damping: 12 }}
                className="relative w-24 h-24 mx-auto mb-6"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-3xl blur-xl opacity-60" />
                {/* Icon background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-3xl flex items-center justify-center">
                  <Crown className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
                {/* Sparkle */}
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-7 h-7 text-amber-300 drop-shadow-lg" />
                </motion.div>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-extrabold text-white mb-2"
              >
                Melius <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Pro</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-white/60 text-base font-medium"
              >
                Transform your health journey forever
              </motion.p>
            </div>

            {/* Features */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 space-y-4"
            >
              {proFeatures.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                    <feature.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-8 mb-6"
            >
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-6xl font-extrabold text-white">$4.99</span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30">
                  <InfinityIcon className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-bold text-xs uppercase tracking-wide">
                    Lifetime Access
                  </span>
                </div>
              </div>
              <p className="text-white/40 text-sm mt-3 font-medium">
                One-time payment • Zero subscriptions • Yours forever
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Button
                onClick={handleUpgrade}
                className="w-full h-16 text-lg font-bold rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-500 hover:via-orange-600 hover:to-rose-600 shadow-2xl shadow-orange-500/40 text-white border-0"
              >
                Unlock Pro Forever
              </Button>
              <p className="text-center text-white/30 text-xs mt-5">
                Join 50,000+ users who invested in their health
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
