import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import logo from '@/assets/meliusme-logo-new.png';

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const features = ['Nutrition insights', 'Premium themes', 'Macro tracking', 'Data export'];

export function ProUpgradeModal({ open, onClose }: ProUpgradeModalProps) {
  const { setPro, animationsEnabled } = useApp();
  const noMotion = !animationsEnabled;

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
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-10"
          style={{ touchAction: 'none' }}
          onClick={onClose}
          onTouchMove={(e) => e.preventDefault()}
        >
          <motion.div
            initial={noMotion ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[320px] flex flex-col items-center text-center"
          >
            {/* Logo */}
            <motion.div
              initial={noMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.05, type: 'spring', damping: 14 }}
            >
              <motion.img
                src={logo}
                alt="MeliusMe"
                className="w-20 h-20 mb-3"
                animate={noMotion ? {} : { y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={noMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-extrabold text-white mb-6"
            >
              MeliusMe <span className="text-primary">Pro</span>
            </motion.h2>

            {/* Features — single clean line */}
            <motion.p
              initial={noMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 text-sm mb-8 leading-relaxed"
            >
              {features.join(' · ')}
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={noMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full"
            >
              <motion.div whileTap={noMotion ? {} : { scale: 0.96 }}>
                <Button
                  onClick={handleUpgrade}
                  className="w-full h-14 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Get Pro — $9.99
                </Button>
              </motion.div>

              <motion.p
                initial={noMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/90 text-xs mt-4 font-medium tracking-wide"
                style={{ textShadow: '0 0 10px rgba(255,255,255,0.1)' }}
              >
                Pay once, yours forever
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
