import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { getRevenueCatInstance, validateOffering } from '@/lib/revenuecat';
import { toast } from 'sonner';

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const ENTITLEMENT_ID = 'MeliusMe Pro';

// Theme classes that the app applies to <html> and that can leak into the paywall
const THEME_CLASSES = ['dark', 'theme-ocean', 'theme-sunset', 'theme-berry', 'theme-midnight', 'theme-cyber'];

export function ProUpgradeModal({ open, onClose }: ProUpgradeModalProps) {
  const { setPro } = useApp();
  const [error, setError] = useState<string | null>(null);
  const paywallContainerRef = useRef<HTMLDivElement>(null);
  const paywallActiveRef = useRef(false);
  const savedClassesRef = useRef<string[]>([]);

  // Strip app theme classes from <html> while paywall is open so they don't cascade
  useEffect(() => {
    const root = document.documentElement;
    if (open) {
      // Save and remove theme classes
      savedClassesRef.current = THEME_CLASSES.filter(cls => root.classList.contains(cls));
      savedClassesRef.current.forEach(cls => root.classList.remove(cls));
    } else {
      // Restore theme classes
      savedClassesRef.current.forEach(cls => root.classList.add(cls));
      savedClassesRef.current = [];
    }
    return () => {
      // Cleanup on unmount
      savedClassesRef.current.forEach(cls => root.classList.add(cls));
      savedClassesRef.current = [];
    };
  }, [open]);

  const presentPaywall = useCallback(async () => {
    if (!paywallContainerRef.current || paywallActiveRef.current) return;

    setError(null);
    paywallActiveRef.current = true;

    try {
      const validationError = await validateOffering();
      if (validationError) {
        setError(validationError);
        paywallActiveRef.current = false;
        return;
      }

      const rc = getRevenueCatInstance();
      const result = await rc.presentPaywall({
        htmlTarget: paywallContainerRef.current!,
        onBack: (closePaywall) => {
          closePaywall();
          onClose();
        },
      });

      console.log('[ProUpgrade] Paywall result:', result);

      const hasPro = ENTITLEMENT_ID in result.customerInfo.entitlements.active;
      if (hasPro) {
        setPro(true);
        toast.success('Welcome to MeliusMe Pro!');
        onClose();
      }
    } catch (e: unknown) {
      console.error('[ProUpgrade] Paywall error:', e);
      const message = (e as Error)?.message || 'Something went wrong';
      if (!message.includes('cancel') && !message.includes('close')) {
        setError(message);
      }
    } finally {
      paywallActiveRef.current = false;
    }
  }, [setPro, onClose]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        presentPaywall();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      paywallActiveRef.current = false;
      setError(null);
    }
  }, [open, presentPaywall]);

  useEffect(() => {
    if (!open && paywallContainerRef.current) {
      paywallContainerRef.current.innerHTML = '';
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{
        // Reset all inherited styles so app theme CSS doesn't cascade into paywall
        colorScheme: 'light',
      }}
    >
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-[201]">
          <div className="text-center px-6">
            <p className="text-gray-500 text-sm mb-4">Unable to load paywall</p>
            <p className="text-gray-400 text-xs mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null);
                presentPaywall();
              }}
              className="px-6 py-2 rounded-xl bg-[#1ebc73] text-white text-sm font-semibold hover:bg-[#19a564] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* RevenueCat Paywall Container - fully isolated from app styles */}
      <div
        ref={paywallContainerRef}
        className="w-full h-full"
        style={{ all: 'initial', width: '100%', height: '100%' }}
      />
    </div>
  );
}
