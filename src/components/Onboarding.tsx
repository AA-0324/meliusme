import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronRight, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { validateName } from '@/lib/validation';
import { toast } from 'sonner';
import logo from '@/assets/meliusme-logo-new.png';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { setUserName, setUserAvatar } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showProModal, setShowProModal] = useState(false);
  const [nameError, setNameError] = useState('');
  const avatarRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSetupProfile = async () => {
    const validation = validateName(name);
    if (!validation.valid) { 
      setNameError(validation.error || 'Invalid name');
      toast.error(validation.error); 
      return; 
    }
    setNameError('');
    await setUserName(name.trim());
    if (avatar) await setUserAvatar(avatar);
    setStep(2);
  };

  const handleFinish = () => {
    localStorage.setItem('meliusme-onboarded', 'true');
    onComplete();
  };

  const handleProModalClose = () => {
    setShowProModal(false);
    handleFinish();
  };

  const slideVariants = {
    enter: { opacity: 0, x: 80 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -80 },
  };

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-background flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="welcome" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="flex-1 flex flex-col items-center justify-center px-8">
              <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} 
                transition={{ type: 'spring', damping: 12, stiffness: 150 }}
                className="relative mb-8">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-[-20px] bg-primary/30 rounded-full blur-3xl"
                />
                <img src={logo} alt="MeliusMe" className="relative w-24 h-24 drop-shadow-[0_0_20px_hsl(var(--primary)/0.6)]" />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                className="text-3xl font-extrabold text-center mb-2">Welcome to MeliusMe</motion.h1>
              <motion.p initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
                className="text-muted-foreground text-center mb-10">Track better. Live better.</motion.p>
              <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="w-full max-w-xs">
                <motion.div whileTap={{ scale: 0.95 }} transition={{ type: 'spring', damping: 15 }}>
                  <Button onClick={() => setStep(1)} className="w-full h-14 rounded-2xl font-bold text-base shadow-neon gradient-primary cta-glow">
                    Get Started <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="profile" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="flex-1 flex flex-col px-8 pt-20">
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-extrabold mb-2">Set up your profile</motion.h1>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="text-muted-foreground mb-6">Let's personalize your experience</motion.p>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="flex flex-col items-center mb-6">
                <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => avatarRef.current?.click()} className="relative group mb-3">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-neon" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </motion.button>
                <p className="text-xs text-muted-foreground">Tap to add a photo (optional)</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="space-y-2 mb-3">
                <label className="text-sm font-semibold">
                  Your name <span className="text-destructive">*</span>
                </label>
                <Input 
                  value={name} 
                  onChange={(e) => { setName(e.target.value); setNameError(''); }}
                  placeholder="Enter your name"
                  className={`h-12 rounded-xl bg-secondary border-0 text-lg ${nameError ? 'animate-shake ring-2 ring-destructive/50' : ''}`}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSetupProfile()}
                />
                {nameError && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive font-medium">{nameError}</motion.p>
                )}
              </motion.div>

              {/* Privacy disclaimer */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-6">
                <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your name is stored locally on this device only and is never collected or shared. It is used solely to personalize your experience.
                </p>
              </motion.div>

              <div className="mt-auto pb-10">
                <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', damping: 15 }}>
                  <Button onClick={handleSetupProfile} disabled={!name.trim()} className="w-full h-14 rounded-2xl font-bold shadow-neon gradient-primary cta-glow text-base">
                    Continue <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </motion.div>
                <p className="text-center text-xs text-muted-foreground/50 mt-3">A name is required to continue</p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="pro" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="flex-1 flex flex-col items-center justify-center px-8">
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 14 }}
                className="relative mb-6">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-[-20px] bg-amber-500/20 rounded-full blur-2xl"
                />
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <img src={logo} alt="MeliusMe" className="w-16 h-16 drop-shadow-[0_0_15px_hsl(43_96%_50%/0.5)]" />
                </div>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-2xl font-extrabold text-center mb-2">Unlock your full potential</motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-muted-foreground text-center mb-8">Get personalized goals, advanced tracking, and more</motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="w-full max-w-xs space-y-3">
                <motion.div whileTap={{ scale: 0.95 }} transition={{ type: 'spring', damping: 15 }}>
                  <Button onClick={() => setShowProModal(true)}
                    className="w-full h-14 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 shadow-[0_0_25px_-5px_hsl(43_96%_50%/0.6)]">
                    <img src={logo} alt="" className="w-5 h-5 mr-2" />
                    Try MeliusMe Pro — $9.99
                  </Button>
                </motion.div>
                <Button variant="ghost" onClick={handleFinish} className="w-full h-12 rounded-xl text-muted-foreground font-semibold">
                  Maybe later
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProUpgradeModal open={showProModal} onClose={handleProModalClose} />
    </>
  );
}
