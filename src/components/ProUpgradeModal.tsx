import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crown, Infinity as InfinityIcon, Zap, Shield, Palette, Heart } from 'lucide-react';
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
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="icon" onClick={onClose}
                className="text-white/40 hover:text-white hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Hero */}
            <div className="text-center mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', damping: 12 }}
                className="relative w-20 h-20 mx-auto mb-4"
              >
                <div className="absolute inset-[-10px] bg-gradient-to-br from-amber-500/40 to-orange-500/30 rounded-full blur-xl" />
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <img src={logo} alt="MeliusMe" className="w-16 h-16 drop-shadow-[0_0_15px_hsl(43_96%_50%/0.5)]" />
                </div>
              </motion.div>
              
              <h2 className="text-2xl font-extrabold text-white mb-1">
                MeliusMe <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Pro</span>
              </h2>
              <p className="text-white/60 text-sm font-medium">One purchase. Lifetime access. Forever.</p>
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
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                    <feature.icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{feature.text}</span>
                  <Check className="w-4 h-4 text-amber-400 ml-auto flex-shrink-0" />
                </motion.div>
              ))}
            </div>

            {/* Pricing */}
            <div className="text-center mb-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-extrabold text-white">$9.99</span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <motion.div 
                  animate={{ boxShadow: ['0 0 10px hsl(43 96% 50% / 0.3)', '0 0 20px hsl(43 96% 50% / 0.5)', '0 0 10px hsl(43 96% 50% / 0.3)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30">
                  <InfinityIcon className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-bold text-xs uppercase tracking-wide">Lifetime Access</span>
                </motion.div>
              </div>
              <p className="text-white/40 text-xs mt-2 font-medium">One-time payment • No subscriptions • No hidden fees</p>
            </div>

            {/* CTA */}
            <motion.div
              animate={{ boxShadow: ['0 0 15px hsl(43 96% 50% / 0.3)', '0 0 30px hsl(43 96% 50% / 0.5)', '0 0 15px hsl(43 96% 50% / 0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded-2xl"
            >
              <Button
                onClick={handleUpgrade}
                className="w-full h-12 text-sm font-bold rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white border-0"
              >
                <Crown className="w-4 h-4 mr-2" />
                Unlock MeliusMe Pro
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
