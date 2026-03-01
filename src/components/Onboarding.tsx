import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
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
  const { setUserName, setUserAvatar, isPro } = useApp();
  const [step, setStep] = useState(0); // 0 = welcome, 1 = profile setup, 2 = pro offer
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showProModal, setShowProModal] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSetupProfile = () => {
    const validation = validateName(name);
    if (!validation.valid) { toast.error(validation.error); return; }
    setUserName(name.trim());
    if (avatar) setUserAvatar(avatar);
    setStep(2);
  };

  const handleFinish = () => {
    localStorage.setItem('meliusme-onboarded', 'true');
    onComplete();
  };

  const handleProModalClose = () => {
    setShowProModal(false);
    // After closing the pro modal, finish onboarding
    handleFinish();
  };

  const slideVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-background flex flex-col">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="welcome" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} className="flex-1 flex flex-col items-center justify-center px-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}
                className="relative mb-8">
                <div className="absolute inset-[-20px] bg-primary/30 rounded-full blur-3xl animate-pulse" />
                <img src={logo} alt="MeliusMe" className="relative w-24 h-24 drop-shadow-[0_0_20px_hsl(var(--primary)/0.6)]" />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-3xl font-extrabold text-center mb-2">Welcome to MeliusMe</motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-muted-foreground text-center mb-10">Track better. Live better.</motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full max-w-xs">
                <Button onClick={() => setStep(1)} className="w-full h-14 rounded-2xl font-bold text-base shadow-neon gradient-primary">
                  Get Started <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="profile" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} className="flex-1 flex flex-col px-8 pt-20">
              <h1 className="text-2xl font-extrabold mb-2">Set up your profile</h1>
              <p className="text-muted-foreground mb-8">Let's get to know you</p>

              <div className="flex flex-col items-center mb-8">
                <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <button onClick={() => avatarRef.current?.click()} className="relative group mb-3">
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
                </button>
                <p className="text-xs text-muted-foreground">Tap to add a photo</p>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-sm font-semibold">Your name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name"
                  className="h-12 rounded-xl bg-secondary border-0 text-lg" autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSetupProfile()} />
              </div>

              <div className="flex gap-3 mt-auto pb-10">
                <Button variant="outline" onClick={() => { handleFinish(); }} className="flex-1 h-12 rounded-xl font-semibold">
                  Skip
                </Button>
                <Button onClick={handleSetupProfile} disabled={!name.trim()} className="flex-1 h-12 rounded-xl font-bold shadow-neon gradient-primary">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="pro" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} className="flex-1 flex flex-col items-center justify-center px-8">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="relative mb-6">
                <div className="absolute inset-[-16px] bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              <h1 className="text-2xl font-extrabold text-center mb-2">Unlock your full potential</h1>
              <p className="text-muted-foreground text-center mb-8">Get personalized goals, advanced tracking, and more</p>

              <div className="w-full max-w-xs space-y-3">
                <Button onClick={() => setShowProModal(true)}
                  className="w-full h-14 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 shadow-[0_0_20px_-5px_hsl(43_96%_50%/0.6)]">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Try MeliusMe Pro — $9.99
                </Button>
                <Button variant="ghost" onClick={handleFinish} className="w-full h-12 rounded-xl text-muted-foreground font-semibold">
                  Maybe later
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProUpgradeModal open={showProModal} onClose={handleProModalClose} />
    </>
  );
}
