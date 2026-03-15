import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getRevenueCatInstance, checkProEntitlement } from '@/lib/revenuecat';
import { toast } from 'sonner';

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProUpgradeModal({ open, onClose }: ProUpgradeModalProps) {
  const { setPro, animationsEnabled } = useApp();
  const noMotion = !animationsEnabled;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paywallContainerRef = useRef<HTMLDivElement>(null);
  const paywallActiveRef = useRef(false);

  const presentPaywall = useCallback(async () => {
    if (!paywallContainerRef.current || paywallActiveRef.current) return;

    setIsLoading(true);
    setError(null);
    paywallActiveRef.current = true;

    try {
      const rc = getRevenueCatInstance();
      const purchaseResult = await rc.presentPaywall({
        htmlTarget: paywallContainerRef.current,
      });

      console.log('[ProUpgrade] Paywall result:', purchaseResult);

      // Check if user now has pro entitlement
      const hasPro = await checkProEntitlement();
      if (hasPro) {
        setPro(true);
        toast.success('Welcome to MeliusMe Pro!');
        onClose();
      }
    } catch (e: unknown) {
      console.error('[ProUpgrade] Paywall error:', e);
      const message = (e as Error)?.message || 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
      paywallActiveRef.current = false;
    }
  }, [setPro, onClose]);

  useEffect(() => {
    if (open) {
      // Small delay to ensure container is mounted
      const timer = setTimeout(() => {
        presentPaywall();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      paywallActiveRef.current = false;
      setIsLoading(true);
      setError(null);
    }
  }, [open, presentPaywall]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center overflow-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[210] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Loading state */}
          {isLoading && !error && (
            <motion.div
              initial={noMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center z-[201] pointer-events-none"
            >
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </motion.div>
          )}

          {/* Error state */}
          {error && (
            <motion.div
              initial={noMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center px-6"
            >
              <p className="text-white/70 text-sm mb-4">Unable to load paywall</p>
              <p className="text-white/40 text-xs mb-6">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  presentPaywall();
                }}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* RevenueCat Paywall Container */}
          <div
            ref={paywallContainerRef}
            className="w-full max-w-[968px] mx-auto h-full"
            style={{ minHeight: '400px' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
