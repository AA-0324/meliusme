import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Shield, Palette, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { presentPaywall, purchasePackage, getAvailablePackages, checkProEntitlement } from '@/lib/revenuecat';
import { toast } from 'sonner';
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
  const { setPro, animationsEnabled } = useApp();
  const noMotion = !animationsEnabled;
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const paywallRef = useRef<HTMLDivElement>(null);

  const handleUpgrade = useCallback(async () => {
    setIsPurchasing(true);

    try {
      // Try RevenueCat paywall first
      if (paywallRef.current) {
        setShowPaywall(true);
        const result = await presentPaywall(paywallRef.current);

        if (result.success) {
          const hasPro = await checkProEntitlement();
          if (hasPro) {
            setPro(true);
            toast.success('Welcome to MeliusMe Pro!');
            onClose();
            return;
          }
        }
        setShowPaywall(false);
      }

      // Fallback: try direct package purchase
      const packages = await getAvailablePackages();
      if (packages.length > 0) {
        const pkg = packages[0]; // Use first available (one-time purchase)
        const result = await purchasePackage(pkg);

        if (result.success) {
          setPro(true);
          toast.success('Welcome to MeliusMe Pro!');
          onClose();
        } else if (result.cancelled) {
          // User cancelled - do nothing
        } else if (result.error) {
          toast.error(result.error);
        }
      } else {
        // No offerings configured yet - fallback to local unlock for testing
        setPro(true);
        toast.success('Pro activated (test mode)');
        onClose();
      }
    } catch (error) {
      console.error('[ProUpgrade] Purchase flow error:', error);
      // Fallback for development/testing
      setPro(true);
      toast.success('Pro activated (test mode)');
      onClose();
    } finally {
      setIsPurchasing(false);
      setShowPaywall(false);
    }
  }, [setPro, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center overflow-hidden"
          style={{ touchAction: 'none' }}
          onClick={onClose}
          onTouchMove={(e) => e.preventDefault()}
        >
          <motion.div
            initial={noMotion ? false : { scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] mx-4 bg-white/[0.04] border border-white/[0.08] rounded-3xl px-8 py-10 flex flex-col items-center justify-center"
          >
            {/* RevenueCat Paywall Container (hidden until triggered) */}
            <div
              ref={paywallRef}
              className={`w-full ${showPaywall ? 'block' : 'hidden'}`}
            />

            {/* Custom paywall UI (shown when RC paywall is not active) */}
            {!showPaywall && (
              <>
                {/* Logo */}
                <motion.div
                  initial={noMotion ? false : { scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 12, stiffness: 150 }}
                  className="relative mb-1"
                >
                  <motion.div
                    animate={noMotion ? {} : { scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-[-35px] bg-primary/25 rounded-full blur-3xl"
                  />
                  <motion.div
                    animate={noMotion ? {} : { y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative w-32 h-32 flex items-center justify-center"
                  >
                    <img src={logo} alt="MeliusMe" className="w-28 h-28" />
                  </motion.div>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={noMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="text-center mb-8 relative z-10 -mt-4"
                >
                  <h2 className="text-3xl font-extrabold text-white">
                    MeliusMe <span className="text-primary">Pro</span>
                  </h2>
                </motion.div>

                {/* Features */}
                <div className="w-full space-y-3.5 mb-10">
                  {proFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.text}
                      initial={noMotion ? false : { opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.08, type: 'spring', damping: 14 }}
                      className="flex items-center gap-4"
                    >
                      <motion.div
                        animate={noMotion ? {} : { scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, delay: 1 + index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0"
                      >
                        <feature.icon className="w-5 h-5 text-primary" />
                      </motion.div>
                      <span className="text-white/75 text-base font-medium">{feature.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Price + CTA */}
                <motion.div
                  initial={noMotion ? false : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, type: 'spring', damping: 15 }}
                  className="w-full"
                >
                  <motion.div
                    whileTap={noMotion ? {} : { scale: 0.95 }}
                    transition={{ type: 'spring', damping: 12 }}
                  >
                    <Button
                      onClick={handleUpgrade}
                      disabled={isPurchasing}
                      className="w-full h-14 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground border-0"
                    >
                      {isPurchasing ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Crown className="w-5 h-5 mr-2" />
                      )}
                      {isPurchasing ? 'Processing...' : 'Get Pro — $9.99'}
                    </Button>
                  </motion.div>
                  <motion.p 
                    initial={noMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center text-white text-sm mt-4 font-semibold tracking-wide"
                    style={{ textShadow: '0 0 14px rgba(255,255,255,0.15)' }}
                  >
                    Pay once, yours forever
                  </motion.p>
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
