import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crown, Infinity as InfinityIcon, Zap, Shield, Palette, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import logo from '@/assets/meliusme-logo-new.png';

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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center overflow-hidden"
          style={{ touchAction: 'none' }}
          onClick={onClose}
          onTouchMove={(e) => e.preventDefault()}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[320px] mx-4 flex flex-col items-center"
          >
            {/* Close button */}
            <div className="w-full flex justify-end mb-2">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white/50" />
              </motion.button>
            </div>

            {/* Hero Logo - compact */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 14, stiffness: 180 }}
              className="relative mb-3"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-[-16px] bg-gradient-to-br from-amber-500/30 to-orange-500/20 rounded-full blur-2xl"
              />
              <div className="relative w-16 h-16 flex items-center justify-center">
                <img src={logo} alt="MeliusMe" className="w-14 h-14 drop-shadow-[0_0_15px_hsl(43_96%_56%/0.5)]" />
              </div>
            </motion.div>

            {/* Title - compact */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-center mb-3"
            >
              <h2 className="text-xl font-extrabold text-white mb-0.5">
                MeliusMe <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">Pro</span>
              </h2>
              <p className="text-white/40 text-xs font-medium">Unlock your full potential</p>
            </motion.div>

            {/* Features - compact */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full bg-white/[0.04] rounded-xl p-3 mb-3 border border-white/[0.06]"
            >
              <div className="space-y-2">
                {proFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/15">
                      <feature.icon className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-white/80 text-xs font-medium flex-1">{feature.text}</span>
                    <Check className="w-3.5 h-3.5 text-amber-400/70 flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Pricing - ONE TIME emphasis */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-3 w-full"
            >
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-3xl font-black text-white tracking-tight">$9.99</span>
              </div>

              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.45, type: 'spring', damping: 14 }}
                className="inline-flex flex-col items-center gap-1.5"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 10px hsl(43 96% 56% / 0.25)',
                      '0 0 20px hsl(43 96% 56% / 0.45)',
                      '0 0 10px hsl(43 96% 56% / 0.25)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 rounded-full border border-amber-500/30"
                >
                  <InfinityIcon className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-extrabold text-xs uppercase tracking-widest">One-Time Purchase</span>
                </motion.div>
                <div className="flex items-center gap-2.5 text-white/25 text-[10px] font-semibold">
                  <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5" /> No subscription</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5" /> No hidden fees</span>
                </div>
              </motion.div>

              <p className="text-white/20 text-[10px] mt-2 font-medium">
                Pay once, own it forever. No recurring charges.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="w-full"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 15px hsl(43 96% 56% / 0.2)',
                    '0 0 30px hsl(43 96% 56% / 0.4)',
                    '0 0 15px hsl(43 96% 56% / 0.2)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-xl"
              >
                <Button
                  onClick={handleUpgrade}
                  className="w-full h-12 text-sm font-extrabold rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white border-0 shadow-xl"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Unlock MeliusMe Pro
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
