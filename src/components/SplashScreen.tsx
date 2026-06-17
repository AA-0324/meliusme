import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/meliusme-logo-new.png';

interface SplashScreenProps {
  show: boolean;
  onComplete: () => void;
}

export function SplashScreen({ show, onComplete }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onAnimationComplete={(definition) => {
            if (definition === 'exit') onComplete();
          }}
          className="fixed inset-0 z-[200] bg-background flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-col items-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.2,
                type: 'spring',
                damping: 12,
                stiffness: 200,
              }}
              className="relative mb-6"
            >
              {/* Glow */}
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-[-20px] bg-primary/30 rounded-full blur-3xl"
              />
              {/* Logo Image */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                <img src={logo} alt="MeliusMe logo" className="w-40 h-40 object-contain drop-shadow-[0_0_30px_hsl(var(--primary)/0.6)]" />
              </div>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 w-32 h-1 bg-secondary rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ 
                  duration: 0.8,
                  delay: 0.9,
                  ease: 'easeInOut',
                }}
                onAnimationComplete={() => {
                  setTimeout(onComplete, 200);
                }}
                className="h-full w-full bg-primary rounded-full"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
