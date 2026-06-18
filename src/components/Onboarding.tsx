import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronRight, ArrowRight, ShieldCheck, Flame, Beef, Apple, Candy, Target, Scale, Ruler, Calendar, User2, Sparkles, Check, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';

import { validateName } from '@/lib/validation';
import { toast } from 'sonner';
import logo from '@/assets/meliusme-logo-new.png';
import {
  BodyProfile,
  feetToCm,
  cmToFeet,
  lbsToKg,
  kgToLbs,
  generateAutoGoals,
  GOAL_DISCLAIMER,
} from '@/lib/bodyGoals';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { setUserName, setUserAvatar, isPro, updateUserGoals, updateBodyProfile, settings } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showProModal, setShowProModal] = useState(false);
  const [nameError, setNameError] = useState('');
  const [consentAge, setConsentAge] = useState(false);
  const [consentTos, setConsentTos] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const allConsented = consentAge && consentTos && consentPrivacy;
  const avatarRef = useRef<HTMLInputElement>(null);

  // Basic goals state
  const [calories, setCalories] = useState(settings.goals.calories?.toString() || '2000');
  const [protein, setProtein] = useState(settings.goals.protein?.toString() || '');
  const [fiber, setFiber] = useState(settings.goals.fiber?.toString() || '');
  const [sugar, setSugar] = useState(settings.goals.sugar?.toString() || '');

  // Personalized goals state (Pro)
  const [useImperial, setUseImperial] = useState(true);
  const [age, setAge] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [goal, setGoal] = useState<'bulking' | 'cutting' | 'maintain'>('maintain');

  const autoGoals = useMemo(() => {
    if (!isPro) return null;
    const ageNum = parseInt(age);
    const hCm = useImperial ? feetToCm(parseInt(heightFeet) || 0, parseInt(heightInches) || 0) : parseInt(heightCm) || 0;
    const wKg = useImperial ? lbsToKg(parseInt(weightLbs) || 0) : parseFloat(weightKg) || 0;
    if (!ageNum || !hCm || !wKg) return null;
    const profile: BodyProfile = { age: ageNum, heightCm: hCm, weightKg: wKg, sex, goal, useImperial };
    return generateAutoGoals(profile);
  }, [isPro, age, heightFeet, heightInches, heightCm, weightLbs, weightKg, sex, goal, useImperial]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAvatarPress = () => {
    avatarRef.current?.click();
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

  const handleSaveGoals = async () => {
    if (isPro && autoGoals) {
      // Save body profile and auto-generated goals
      const hCm = useImperial ? feetToCm(parseInt(heightFeet) || 0, parseInt(heightInches) || 0) : parseInt(heightCm) || 0;
      const wKg = useImperial ? lbsToKg(parseInt(weightLbs) || 0) : parseFloat(weightKg) || 0;
      await updateBodyProfile({ age: parseInt(age), heightCm: hCm, weightKg: wKg, sex, goal, useImperial });
      await updateUserGoals({
        calories: autoGoals.calories,
        protein: autoGoals.protein,
        fiber: autoGoals.fiber,
        sugar: autoGoals.sugarLimit,
      });
      toast.success('Personalized goals set');
    } else {
      // Save basic goals
      const cal = parseInt(calories) || 2000;
      const prot = parseInt(protein) || undefined;
      const fib = parseInt(fiber) || undefined;
      const sug = parseInt(sugar) || undefined;
      await updateUserGoals({ calories: cal, protein: prot, fiber: fib, sugar: sug });
      toast.success('Goals saved');
    }
    setStep(3);
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

  const goalFields = [
    { key: 'calories', label: 'Calories', icon: Flame, value: calories, setter: setCalories, placeholder: '2000', color: 'from-orange-500/20 to-red-500/20 border-orange-500/30', iconColor: 'text-orange-400', required: true },
    { key: 'protein', label: 'Protein (g)', icon: Beef, value: protein, setter: setProtein, placeholder: '50', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30', iconColor: 'text-blue-400' },
    { key: 'fiber', label: 'Fiber (g)', icon: Apple, value: fiber, setter: setFiber, placeholder: '25', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30', iconColor: 'text-green-400' },
    { key: 'sugar', label: 'Sugar (g)', icon: Candy, value: sugar, setter: setSugar, placeholder: '50', color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30', iconColor: 'text-pink-400' },
  ];

  const goalOptions = [
    { value: 'cutting' as const, label: 'Cutting', desc: 'Lose fat' },
    { value: 'maintain' as const, label: 'Maintain', desc: 'Stay steady' },
    { value: 'bulking' as const, label: 'Bulking', desc: 'Build muscle' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-background flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div key="welcome" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="flex-1 flex flex-col items-center justify-center px-8 relative">
              {/* Large background logo */}
              <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 150 }}
                className="absolute">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-[-40px] bg-primary/30 rounded-full blur-3xl"
                />
                <img src={logo} alt="" className="relative w-56 h-56 opacity-20" />
              </motion.div>
              {/* Foreground content */}
              <div className="relative z-10 flex flex-col items-center">
                <motion.h1 initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-3xl font-extrabold text-center mb-1">Welcome to MeliusMe</motion.h1>
                <motion.p initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
                  className="text-muted-foreground text-center mb-5">Track better. Live better.</motion.p>
                <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="w-full max-w-xs">
                  <motion.div whileTap={{ scale: 0.95 }} transition={{ type: 'spring', damping: 15 }}>
                    <Button onClick={() => setStep(1)} className="w-full h-14 rounded-2xl font-bold text-base shadow-neon gradient-primary cta-glow">
                      Get Started <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Profile */}
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
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleAvatarPress} className="relative group mb-3">
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

          {/* Step 2: Nutrition Goals */}
          {step === 2 && (
            <motion.div key="goals" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-8 pt-16 pb-4" style={{ overscrollBehavior: 'contain' }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h1 className="text-2xl font-extrabold">
                      {isPro ? 'Personalized Goals' : 'Set Your Goals'}
                    </h1>
                  </div>
                  <p className="text-muted-foreground text-sm mb-6">
                    {isPro ? 'Enter your details for auto-calculated targets' : 'Set daily nutrition targets to track against'}
                  </p>
                </motion.div>

                {isPro ? (
                  /* Pro: Personalized goals with body profile */
                  <div className="space-y-4">
                    {/* Unit toggle */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                      <span className="text-sm font-semibold">Imperial units (lbs, ft)</span>
                      <Switch checked={useImperial} onCheckedChange={(v) => setUseImperial(v)} />
                    </motion.div>

                    {/* Sex */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                      className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sex <span className="text-destructive">*</span></label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['male', 'female'] as const).map((s) => (
                          <motion.button key={s} whileTap={{ scale: 0.95 }}
                            onClick={() => setSex(s)}
                            className={`h-12 rounded-xl font-semibold text-sm transition-all ${sex === s ? 'bg-primary text-primary-foreground shadow-neon' : 'bg-secondary/50 text-muted-foreground'}`}>
                            {s === 'male' ? 'Male' : 'Female'}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Age */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Age <span className="text-destructive">*</span>
                      </label>
                      <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25"
                        className="h-12 rounded-xl bg-secondary/50 border-0 text-lg" />
                    </motion.div>

                    {/* Height */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                      className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5" /> Height <span className="text-destructive">*</span>
                      </label>
                      {useImperial ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="number" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} placeholder="ft"
                            className="h-12 rounded-xl bg-secondary/50 border-0 text-lg" />
                          <Input type="number" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} placeholder="in"
                            className="h-12 rounded-xl bg-secondary/50 border-0 text-lg" />
                        </div>
                      ) : (
                        <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="cm"
                          className="h-12 rounded-xl bg-secondary/50 border-0 text-lg" />
                      )}
                    </motion.div>

                    {/* Weight */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                      className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5" /> Weight <span className="text-destructive">*</span>
                      </label>
                      <Input type="number"
                        value={useImperial ? weightLbs : weightKg}
                        onChange={(e) => useImperial ? setWeightLbs(e.target.value) : setWeightKg(e.target.value)}
                        placeholder={useImperial ? 'lbs' : 'kg'}
                        className="h-12 rounded-xl bg-secondary/50 border-0 text-lg" />
                    </motion.div>

                    {/* Goal */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                      className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Goal <span className="text-destructive">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {goalOptions.map((g) => (
                          <motion.button key={g.value} whileTap={{ scale: 0.95 }}
                            onClick={() => setGoal(g.value)}
                            className={`p-3 rounded-xl text-center transition-all ${goal === g.value ? 'bg-primary text-primary-foreground shadow-neon' : 'bg-secondary/50 text-muted-foreground'}`}>
                            <p className="font-bold text-sm">{g.label}</p>
                            <p className="text-[10px] opacity-70">{g.desc}</p>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Auto-generated preview */}
                    {autoGoals && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-primary">Your Calculated Goals</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Calories', value: autoGoals.calories },
                            { label: 'Protein', value: `${autoGoals.protein}g` },
                            { label: 'Fiber', value: `${autoGoals.fiber}g` },
                            { label: 'Sugar limit', value: `${autoGoals.sugarLimit}g` },
                          ].map((s) => (
                            <div key={s.label} className="p-2.5 rounded-lg bg-background/50">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">{s.label}</p>
                              <p className="text-lg font-extrabold">{s.value}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{GOAL_DISCLAIMER}</p>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  /* Non-Pro: Basic goal inputs */
                  <div className="space-y-3">
                    {goalFields.map((field, i) => (
                      <motion.div key={field.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.06, type: 'spring', damping: 18 }}
                        className={`p-4 rounded-2xl bg-gradient-to-br ${field.color} border`}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <field.icon className={`w-5 h-5 ${field.iconColor}`} />
                          <span className="font-bold text-sm">{field.label}</span>
                          {field.required && <span className="text-destructive text-xs">*</span>}
                        </div>
                        <Input
                          type="number"
                          value={field.value}
                          onChange={(e) => field.setter(e.target.value)}
                          placeholder={field.placeholder}
                          className="h-12 rounded-xl bg-background/40 border-0 text-lg font-bold text-center"
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom action */}
              <div className="px-8 pb-10 pt-3">
                <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', damping: 15 }}>
                  <Button
                    onClick={handleSaveGoals}
                    disabled={isPro ? !autoGoals : !calories.trim()}
                    className="w-full h-14 rounded-2xl font-bold shadow-neon gradient-primary cta-glow text-base">
                    {isPro ? 'Apply Goals' : 'Save Goals'} <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </motion.div>
                <button onClick={() => setStep(3)} className="w-full text-center text-sm text-muted-foreground/60 font-medium mt-3 py-1">
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Pro Upsell */}
          {step === 3 && (
            <motion.div key="pro" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="flex-1 flex flex-col items-center justify-center px-8 relative">
              {/* Large background logo */}
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 14 }}
                className="absolute">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-[-40px] bg-primary/20 rounded-full blur-2xl"
                />
                <img src={logo} alt="" className="relative w-56 h-56 opacity-15" />
              </motion.div>
              {/* Foreground content */}
              <div className="relative z-10 flex flex-col items-center">
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="text-2xl font-extrabold text-center mb-1">Unlock your full potential</motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="text-muted-foreground text-center mb-6">Get personalized goals, advanced tracking, and more</motion.p>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="w-full max-w-xs space-y-3">
                  <motion.div whileTap={{ scale: 0.95 }} transition={{ type: 'spring', damping: 15 }}>
                    <Button onClick={() => setShowProModal(true)}
                      className="w-full h-14 rounded-2xl font-bold text-base bg-primary hover:bg-primary/90 text-primary-foreground">
                      <img src={logo} alt="" className="w-5 h-5 mr-2" />
                      Try MeliusMe Pro — $9.99
                    </Button>
                  </motion.div>
                  <Button variant="ghost" onClick={handleFinish} className="w-full h-12 rounded-xl text-muted-foreground font-semibold">
                    Maybe later
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProUpgradeModal open={showProModal} onClose={handleProModalClose} />
    </>
  );
}
