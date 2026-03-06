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
          className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-5 overflow-hidden"
          style={{ touchAction: 'none' }}
          onClick={onClose}
          onTouchMove={(e) => e.preventDefault()}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] flex flex-col items-center"
          >
            {/* Close button */}
            <div className="w-full flex justify-end mb-3">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white/50" />
              </motion.button>
            </div>

            {/* Hero Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', damping: 12, stiffness: 150 }}
              className="relative mb-5"
            >
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-[-24px] bg-gradient-to-br from-amber-500/40 to-orange-500/30 rounded-full blur-2xl"
              />
              <div className="relative w-20 h-20 flex items-center justify-center">
                <img src={logo} alt="MeliusMe" className="w-16 h-16 drop-shadow-[0_0_20px_hsl(43_96%_56%/0.6)]" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-center mb-5"
            >
              <h2 className="text-2xl font-extrabold text-white mb-1.5">
                MeliusMe <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">Pro</span>
              </h2>
              <p className="text-white/50 text-sm font-medium">Unlock your full potential</p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full bg-white/[0.04] backdrop-blur-sm rounded-2xl p-4 mb-5 border border-white/[0.06]"
            >
              <div className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.06, type: 'spring', damping: 20 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/25 to-orange-500/15 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                      <feature.icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-white/85 text-sm font-medium flex-1">{feature.text}</span>
                    <Check className="w-4 h-4 text-amber-400/80 flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Pricing - ONE TIME emphasis */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-5 w-full"
            >
              <div className="flex items-baseline justify-center gap-1.5 mb-3">
                <span className="text-4xl font-black text-white tracking-tight">$9.99</span>
              </div>

              {/* ONE TIME badge - very prominent */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', damping: 12 }}
                className="inline-flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 12px hsl(43 96% 56% / 0.3)',
                      '0 0 24px hsl(43 96% 56% / 0.5)',
                      '0 0 12px hsl(43 96% 56% / 0.3)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 rounded-full border border-amber-500/40"
                >
                  <InfinityIcon className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 font-extrabold text-sm uppercase tracking-widest">One-Time Purchase</span>
                </motion.div>
                <div className="flex items-center gap-3 text-white/30 text-xs font-semibold">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> No subscription</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> No hidden fees</span>
                </div>
              </motion.div>

              <p className="text-white/25 text-[11px] mt-3 font-medium">
                Pay once, own it forever. No recurring charges. Ever.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="w-full"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px hsl(43 96% 56% / 0.25)',
                    '0 0 40px hsl(43 96% 56% / 0.45)',
                    '0 0 20px hsl(43 96% 56% / 0.25)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-2xl"
              >
                <Button
                  onClick={handleUpgrade}
                  className="w-full h-14 text-base font-extrabold rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white border-0 shadow-xl"
                >
                  <Crown className="w-5 h-5 mr-2" />
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
