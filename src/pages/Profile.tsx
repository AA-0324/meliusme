import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionConfig } from 'framer-motion';
import { Moon, Sun, Sparkles, Download, Settings, Target, Check, Lock, Palette, User, Scale, AlertTriangle, Camera, Crown, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { BodyProfileEditor } from '@/components/BodyProfileEditor';
import { ImageCropper } from '@/components/ImageCropper';
import { exportMealsToCSV } from '@/lib/db';
import { getGreeting, formatMemberSince } from '@/lib/userProfile';
import { validateName } from '@/lib/validation';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { staggerContainer, fadeUp, idleBreathe, idleFloat, prefersReducedMotion } from '@/lib/motion';
import logo from '@/assets/meliusme-logo-new.png';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const themes = [
  { id: 'default', name: 'Forest', color: 'hsl(152, 76%, 36%)' },
  { id: 'ocean', name: 'Ocean', color: 'hsl(199, 89%, 48%)' },
  { id: 'sunset', name: 'Sunset', color: 'hsl(15, 90%, 55%)' },
  { id: 'berry', name: 'Berry', color: 'hsl(280, 65%, 55%)' },
  { id: 'midnight', name: 'Midnight', color: 'hsl(230, 70%, 55%)' },
];

const proLocked = 'relative opacity-75';

export default function Profile() {
  const { settings, isPro, setDarkMode, updateUserGoals, setWaterGoal, setTheme, userProfile, setUserName, setUserAvatar, bodyProfile, animationsEnabled } = useApp();
  const navigate = useNavigate();
  const [showProModal, setShowProModal] = useState(false);
  const [showBodyProfile, setShowBodyProfile] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(settings.goals.calories.toString());
  const [proteinGoal, setProteinGoal] = useState(settings.goals.protein?.toString() || '');
  const [fiberGoal, setFiberGoal] = useState(settings.goals.fiber?.toString() || '');
  const [sugarGoal, setSugarGoal] = useState(settings.goals.sugar?.toString() || '');
  const [waterGoalInput, setWaterGoalInput] = useState(settings.waterGoal.toString());
  const [nameInput, setNameInput] = useState(userProfile?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showGoalConfirm, setShowGoalConfirm] = useState(false);
  const [showBodyGoalWarning, setShowBodyGoalWarning] = useState(false);
  const [personalizedGoalsEnabled, setPersonalizedGoalsEnabled] = useState(settings.personalizedGoals ?? false);
  const [showDisablePersonalized, setShowDisablePersonalized] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const prevSugarRef = useRef(settings.goals.sugar?.toString() || '');

  useEffect(() => {
    setCalorieGoal(settings.goals.calories.toString());
    setProteinGoal((settings.goals.protein ?? 50).toString());
    setFiberGoal((settings.goals.fiber ?? 25).toString());
    setSugarGoal((settings.goals.sugar ?? 50).toString());
    setWaterGoalInput(settings.waterGoal.toString());
    prevSugarRef.current = settings.goals.sugar?.toString() || '';
  }, [settings.goals.calories, settings.goals.protein, settings.goals.fiber, settings.goals.sugar, settings.waterGoal]);

  const goalsChanged = useMemo(() => {
    return (
      calorieGoal !== settings.goals.calories.toString() ||
      proteinGoal !== (settings.goals.protein?.toString() || '') ||
      fiberGoal !== (settings.goals.fiber?.toString() || '') ||
      sugarGoal !== (settings.goals.sugar?.toString() || '') ||
      waterGoalInput !== settings.waterGoal.toString()
    );
  }, [calorieGoal, proteinGoal, fiberGoal, sugarGoal, waterGoalInput, settings]);

  const hasBulkingConflict = useMemo(() => {
    if (bodyProfile?.goal !== 'bulking') return false;
    const newCal = parseInt(calorieGoal, 10) || 2000;
    return newCal < settings.goals.calories;
  }, [bodyProfile?.goal, calorieGoal, settings.goals.calories]);

  // Check if user has body profile set and personalized goals enabled
  const hasBodyGoalsSet = useMemo(() => {
    return personalizedGoalsEnabled && bodyProfile?.goal;
  }, [personalizedGoalsEnabled, bodyProfile]);

  const goalsBlank = !calorieGoal || !proteinGoal || !fiberGoal || !sugarGoal || !waterGoalInput;

  const doSaveGoals = useCallback(() => {
    if (goalsBlank) { toast.error('All goal fields are required.'); return; }

    const newSugar = parseInt(sugarGoal, 10);
    const oldSugar = settings.goals.sugar;
    const newProtein = parseInt(proteinGoal, 10);
    const oldProtein = settings.goals.protein;
    const newFiber = parseInt(fiberGoal, 10);
    const oldFiber = settings.goals.fiber;

    // Show macro feedback BEFORE "Goals saved"
    if (oldProtein !== undefined && newProtein < oldProtein) {
      toast.warning('Lowering your protein goal may slow muscle recovery.');
    }
    if (oldFiber !== undefined && newFiber < oldFiber) {
      toast.warning('Lowering your fiber goal may affect digestion.');
    }
    if (oldSugar !== undefined) {
      if (newSugar < oldSugar) {
        toast.success('Great job lowering your sugar limit!');
      } else if (newSugar > oldSugar) {
        toast.warning('Increasing your sugar limit may affect your health goals.');
      }
    }

    updateUserGoals({
      calories: parseInt(calorieGoal, 10) || 2000,
      protein: newProtein,
      fiber: newFiber,
      sugar: newSugar,
    });
    setWaterGoal(parseInt(waterGoalInput, 10) || 8);

    // Delay "Goals saved" so feedback toasts are visible first
    setTimeout(() => toast.success('Goals saved!'), 800);
  }, [calorieGoal, proteinGoal, fiberGoal, sugarGoal, waterGoalInput, goalsBlank, settings.goals.sugar, settings.goals.protein, settings.goals.fiber, updateUserGoals, setWaterGoal]);

  const handleSaveGoals = () => {
    if (hasBulkingConflict) { setShowGoalConfirm(true); return; }
    // If user has body profile goals, warn them
    if (hasBodyGoalsSet) { setShowBodyGoalWarning(true); return; }
    doSaveGoals();
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed === (userProfile?.name || '')) {
      setIsEditingName(false);
      return;
    }
    const validation = validateName(trimmed);
    if (!validation.valid) { toast.error(validation.error); return; }
    await setUserName(trimmed);
    setIsEditingName(false);
    toast.success('Profile updated!');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setUserAvatar(croppedDataUrl);
    setCropSrc(null);
    toast.success('Profile picture updated!');
  };

  const handleExport = async () => {
    if (!isPro) { setShowProModal(true); return; }
    try {
      const csv = await exportMealsToCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meliusme-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  const handleThemeChange = (themeId: string) => {
    if (!isPro) { setShowProModal(true); return; }
    setTheme(themeId);
  };

  const handleTogglePersonalizedGoals = async (checked: boolean) => {
    if (!isPro) { setShowProModal(true); return; }
    if (!checked && personalizedGoalsEnabled) { setShowDisablePersonalized(true); return; }
    setPersonalizedGoalsEnabled(checked);
    const { saveSettings: saveSett } = await import('@/lib/db');
    await saveSett({ personalizedGoals: checked });
    // If turning on and no body profile set, auto-open editor
    if (checked && !bodyProfile?.goal) {
      setTimeout(() => setShowBodyProfile(true), 300);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1 initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl font-bold tracking-tight">
              {getGreeting(userProfile?.name)}
            </motion.h1>
            {userProfile?.createdAt && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                className="text-muted-foreground text-sm mt-0.5">{formatMemberSince(userProfile.createdAt)}</motion.p>
            )}
          </div>
          <motion.div 
            whileTap={{ scale: 0.9 }} 
            transition={{ type: 'spring', damping: 15 }}
            {...(animationsEnabled ? { animate: { rotate: [0, 360], transition: { duration: 12, repeat: Infinity, ease: 'linear' as const } } } : {})}
          >
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="rounded-xl">
              <Settings className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="px-6 space-y-4">
        {/* User Profile */}
        <motion.div variants={fadeUp}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Your Profile</h2>
          <div className="flex items-center gap-4">
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => avatarInputRef.current?.click()} 
              className="relative group flex-shrink-0 cursor-pointer" 
              title="Change profile picture"
              {...(animationsEnabled ? { whileHover: { scale: 1.08, transition: { type: 'spring', damping: 10 } } } : {})}
            >
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center"
                  animate={animationsEnabled ? { scale: [1, 1.15, 1], rotate: [0, 3, -3, 0] } : undefined}
                  transition={animationsEnabled ? { duration: 2, repeat: Infinity, ease: 'easeInOut' as const } : undefined}
                >
                  <User className="w-8 h-8 text-primary" />
                </motion.div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </motion.button>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Enter your name"
                    className="h-10 rounded-xl bg-secondary border-0" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} />
                  <Button onClick={handleSaveName} size="sm" className="rounded-xl">Save</Button>
                </div>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setIsEditingName(true)} className="text-left w-full group">
                  <p className="font-bold text-lg group-hover:text-primary transition-colors">{userProfile?.name || 'Set your name'}</p>
                  <p className="text-sm text-muted-foreground">Tap to edit</p>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Upgrade to Pro */}
        {!isPro && (
          <motion.div variants={fadeUp}>
            <motion.button 
              onClick={() => setShowProModal(true)}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-2xl p-5 text-left relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-primary/5 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  <img src={logo} alt="" className="w-11 h-11" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold">Upgrade to Pro</h2>
                  <p className="text-primary font-bold text-sm">$9.99 - One-time - Lifetime</p>
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* Personalized Goals */}
        <motion.div variants={fadeUp}
          className={`bg-card rounded-2xl p-4 border border-border/50 ${!isPro ? proLocked : ''}`}>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => {
                if (!personalizedGoalsEnabled && isPro) {
                  // Auto-enable and open
                  handleTogglePersonalizedGoals(true);
                  return;
                }
                if (!isPro) { setShowProModal(true); return; }
                setShowBodyProfile(true);
              }} 
              variant="ghost"
              className={`flex-1 h-auto p-0 justify-start gap-3 font-semibold hover:bg-transparent ${!personalizedGoalsEnabled ? 'opacity-60' : ''}`}
            >
              <Scale className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="text-left">
                <span className="block text-sm font-semibold">Personalized Goals</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {bodyProfile?.goal ? `${bodyProfile.goal.charAt(0).toUpperCase() + bodyProfile.goal.slice(1)}` : 'Set up'}
                  {bodyProfile?.weightKg ? ` • ${Math.round(bodyProfile.weightKg)}kg` : ''}
                </span>
              </div>
            </Button>
            <Switch 
              checked={personalizedGoalsEnabled} 
              onCheckedChange={handleTogglePersonalizedGoals}
              disabled={!isPro}
            />
          </div>
        </motion.div>

        {/* Meal Templates (locked for non-Pro) */}
        {!isPro && (
          <motion.div variants={fadeUp}
            onClick={() => setShowProModal(true)}
            className="bg-card rounded-2xl p-4 border border-border/50 cursor-pointer active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3 opacity-50">
              <BookmarkPlus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="text-left flex-1">
                <span className="block text-sm font-semibold">Meal Templates</span>
                <span className="text-xs text-muted-foreground font-normal">Save and reuse your favorite meals</span>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeUp}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Appearance</h2>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {settings.darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <span className="font-semibold">Dark Mode</span>
            </div>
            <Switch checked={settings.darkMode} onCheckedChange={setDarkMode} />
          </div>
          <div className={`pt-3 border-t border-border/50 ${!isPro ? 'rounded-xl p-3 ' + proLocked : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Theme</span>
            </div>
            <div className="flex gap-2">
              {themes.map((theme) => (
                <motion.button key={theme.id} whileTap={{ scale: 0.85 }}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    settings.theme === theme.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : 'hover:scale-110'
                  } ${!isPro && theme.id !== 'default' ? 'opacity-50' : ''}`}
                  style={{ backgroundColor: theme.color }} title={theme.name}>
                  {settings.theme === theme.id && <Check className="w-5 h-5 text-white" />}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Goals */}
        <motion.div variants={fadeUp}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Daily Goals</h2>
          </div>

          {bodyProfile?.goal === 'bulking' && goalsChanged && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-3 mb-4 bg-warning/10 border border-warning/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning font-medium">You have bulking goals set. Changing these may conflict with your body profile targets.</p>
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calorie-goal" className="text-sm font-semibold">Calorie Goal</Label>
              <Input id="calorie-goal" type="number" inputMode="numeric" value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)} className="h-11 rounded-xl bg-secondary border-0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein-goal" className="text-sm font-semibold">Protein Goal (g)</Label>
              <Input id="protein-goal" type="number" inputMode="numeric" value={proteinGoal}
                onChange={(e) => setProteinGoal(e.target.value)} className="h-11 rounded-xl bg-secondary border-0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiber-goal" className="text-sm font-semibold">Fiber Goal (g)</Label>
              <Input id="fiber-goal" type="number" inputMode="numeric" value={fiberGoal}
                onChange={(e) => setFiberGoal(e.target.value)} className="h-11 rounded-xl bg-secondary border-0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sugar-goal" className="text-sm font-semibold">Sugar Limit (g)</Label>
              <Input id="sugar-goal" type="number" inputMode="numeric" value={sugarGoal}
                onChange={(e) => setSugarGoal(e.target.value)} className="h-11 rounded-xl bg-secondary border-0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="water-goal" className="text-sm font-semibold">Water Goal (glasses)</Label>
              <Input id="water-goal" type="number" inputMode="numeric" value={waterGoalInput}
                onChange={(e) => setWaterGoalInput(e.target.value)} className="h-11 rounded-xl bg-secondary border-0" />
            </div>

            <motion.div whileTap={{ scale: 0.97 }}>
              <Button onClick={handleSaveGoals} disabled={!goalsChanged || goalsBlank} className="w-full h-11 rounded-xl font-bold">
                Save Goals
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Export */}
        <motion.div variants={fadeUp}>
          <motion.div whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            className={`bg-card rounded-2xl p-4 border border-border/50 cursor-pointer active:scale-[0.98] transition-transform ${!isPro ? '' : ''}`}>
            <div className={`flex items-center gap-3 ${!isPro ? 'opacity-50' : ''}`}>
              <Download className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="text-left flex-1">
                <span className="block text-sm font-semibold">Export Data (CSV)</span>
                <span className="text-xs text-muted-foreground font-normal">Download your meal history</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Goal conflict confirmation (bulking) */}
      <AlertDialog open={showGoalConfirm} onOpenChange={setShowGoalConfirm}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Conflicting with Bulking Goals
            </AlertDialogTitle>
            <AlertDialogDescription>
              You're reducing your calorie goal while your body profile is set to bulking. This may slow your progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowGoalConfirm(false); doSaveGoals(); }}>Save Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warning when changing goals with body profile set (#16) */}
      <AlertDialog open={showBodyGoalWarning} onOpenChange={setShowBodyGoalWarning}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Override Personalized Goals?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have personalized body goals set. Manually changing your daily goals will override the values calculated from your body profile. Your body profile settings will remain, but goals won't match.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowBodyGoalWarning(false); doSaveGoals(); }}>
              Update Goals
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable personalized goals confirmation */}
      <AlertDialog open={showDisablePersonalized} onOpenChange={setShowDisablePersonalized}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Disable Personalized Goals?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your current goals will remain, but won't update automatically based on your body profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setPersonalizedGoalsEnabled(false);
              const { saveSettings: saveSett } = await import('@/lib/db');
              await saveSett({ personalizedGoals: false });
              setShowDisablePersonalized(false);
              toast.success('Personalized goals disabled');
            }}>
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} />
      <BodyProfileEditor open={showBodyProfile} onClose={() => setShowBodyProfile(false)} />
    </div>
  );
}
