import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crown, Zap, Shield, Palette, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import logo from '@/assets/meliusme-logo-new.png';

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const proFeatures = [
  { icon: Zap, text: 'Advanced nutrition insights' },
  { icon: Palette, text: 'Premium themes' },
  { icon: Shield, text: 'Full macro tracking' },
  { icon: Heart, text: 'Data export' },
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
            className="w-full max-w-[300px] mx-4 flex flex-col items-center"
          >
            {/* Close */}
            <div className="w-full flex justify-end mb-3">
              <motion.button whileTap={{ scale: 0.85 }} onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-white/50" />
              </motion.button>
            </div>

            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 14, stiffness: 180 }}
              className="relative mb-4"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-[-16px] bg-primary/30 rounded-full blur-2xl"
              />
              <div className="relative w-14 h-14 flex items-center justify-center">
                <img src={logo} alt="MeliusMe" className="w-12 h-12" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-center mb-5"
            >
              <h2 className="text-xl font-extrabold text-white">
                MeliusMe <span className="text-primary">Pro</span>
              </h2>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full space-y-2.5 mb-6"
            >
              {proFeatures.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-white/70 text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Price + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="w-full"
            >
              <Button
                onClick={handleUpgrade}
                className="w-full h-12 text-sm font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground border-0"
              >
                <Crown className="w-4 h-4 mr-2" />
                Get Pro — $9.99
              </Button>
              <p className="text-center text-white/25 text-[10px] mt-2.5 font-medium">
                One-time purchase · Lifetime access
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
