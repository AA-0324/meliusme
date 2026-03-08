import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Shield, Palette, Heart } from 'lucide-react';
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
            className="w-full max-w-[360px] mx-4 bg-white/[0.04] border border-white/[0.08] rounded-3xl p-7 flex flex-col items-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 14, stiffness: 180 }}
              className="relative mb-3"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-[-24px] bg-primary/30 rounded-full blur-2xl"
              />
              <div className="relative w-20 h-20 flex items-center justify-center">
                <img src={logo} alt="MeliusMe" className="w-18 h-18" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-center mb-6"
            >
              <h2 className="text-2xl font-extrabold text-white">
                MeliusMe <span className="text-primary">Pro</span>
              </h2>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full space-y-3 mb-8"
            >
              {proFeatures.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
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
                className="w-full h-13 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground border-0"
              >
                <Crown className="w-4 h-4 mr-2" />
                Get Pro — $9.99
              </Button>
              <p className="text-center text-white text-xs mt-3 font-semibold tracking-wide" style={{ textShadow: '0 0 12px rgba(255,255,255,0.15)' }}>
                Pay once, yours forever
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
