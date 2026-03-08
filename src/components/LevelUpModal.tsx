import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Gift, X } from 'lucide-react';
import { TempProUnlock } from '@/lib/streaks';
import { Button } from '@/components/ui/button';

interface LevelUpModalProps {
  open: boolean;
  level: number;
  reward: TempProUnlock | null;
  onClose: () => void;
}

export function LevelUpModal({ open, level, reward, onClose }: LevelUpModalProps) {
  const durationHours = reward ? Math.round((reward.expiresAt - reward.unlockedAt) / (1000 * 60 * 60)) : 0;
  const durationLabel = durationHours >= 48 ? `${Math.round(durationHours / 24)} days` : `${durationHours} hours`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 14, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-3xl border border-border overflow-hidden relative"
          >
            {/* Close button */}
            <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative px-6 pt-10 pb-8 text-center">
              {/* Level badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
                className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <Zap className="w-10 h-10 text-primary-foreground" />
                </motion.div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-extrabold mb-1"
              >
                Level {level}!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-muted-foreground mb-6"
              >
                Keep up the great work!
              </motion.p>

              {/* Reward card */}
              {reward && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', damping: 15 }}
                  className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 text-left"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Pro Feature Unlocked</p>
                    </div>
                  </div>

                  <p className="font-bold text-base mb-1">{reward.featureName}</p>
                  <p className="text-sm text-muted-foreground mb-3">{reward.featureDescription}</p>

                  <div className="flex items-center gap-1.5 text-amber-500">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Available for {durationLabel}</span>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6"
              >
                <Button onClick={onClose} className="w-full rounded-2xl h-12 font-bold gradient-primary">
                  Continue
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
