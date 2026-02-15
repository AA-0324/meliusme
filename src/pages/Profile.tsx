import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Sparkles, Download, Settings, Target, Check, Lock, Droplets, Palette, User, Scale, AlertTriangle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { BodyProfileEditor } from '@/components/BodyProfileEditor';
import { exportMealsToCSV } from '@/lib/db';
import { getGreeting, formatMemberSince } from '@/lib/userProfile';
import { validateName } from '@/lib/validation';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const proFeatures = [
  'Track protein, fiber & sugar goals',
  'Advanced nutrition charts',
  'Beautiful custom themes',
  'Export all data to CSV',
  'Custom meal tags',
];

const themes = [
  { id: 'default', name: 'Forest', color: 'hsl(152, 76%, 36%)' },
  { id: 'ocean', name: 'Ocean', color: 'hsl(199, 89%, 48%)' },
  { id: 'sunset', name: 'Sunset', color: 'hsl(15, 90%, 55%)' },
  { id: 'berry', name: 'Berry', color: 'hsl(280, 65%, 55%)' },
  { id: 'midnight', name: 'Midnight', color: 'hsl(230, 70%, 55%)' },
];

export default function Profile() {
  const { settings, isPro, setDarkMode, updateUserGoals, setWaterGoal, setTheme, userProfile, setUserName, setUserAvatar, bodyProfile } = useApp();
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
  const [personalizedGoalsEnabled, setPersonalizedGoalsEnabled] = useState(settings.personalizedGoals ?? false);
  const [showDisablePersonalized, setShowDisablePersonalized] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const prevSugarRef = useRef(settings.goals.sugar?.toString() || '');

  useEffect(() => {
    setCalorieGoal(settings.goals.calories.toString());
    setProteinGoal(settings.goals.protein?.toString() || '');
    setFiberGoal(settings.goals.fiber?.toString() || '');
    setSugarGoal(settings.goals.sugar?.toString() || '');
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

  const doSaveGoals = useCallback(() => {
    const newSugar = isPro && sugarGoal ? parseInt(sugarGoal, 10) : undefined;
    const oldSugar = settings.goals.sugar;
    if (newSugar !== undefined && oldSugar !== undefined) {
      if (newSugar < oldSugar) {
        toast.success('Great job lowering your sugar limit! Your body will thank you.');
      } else if (newSugar > oldSugar) {
        toast.warning('Increasing your sugar limit may affect your health goals.');
      }
    }

    updateUserGoals({
      calories: parseInt(calorieGoal, 10) || 2000,
      protein: isPro && proteinGoal ? parseInt(proteinGoal, 10) : undefined,
      fiber: isPro && fiberGoal ? parseInt(fiberGoal, 10) : undefined,
      sugar: isPro && sugarGoal ? parseInt(sugarGoal, 10) : undefined,
    });
    setWaterGoal(parseInt(waterGoalInput, 10) || 8);
    toast.success('Goals saved!');
  }, [calorieGoal, proteinGoal, fiberGoal, sugarGoal, waterGoalInput, isPro, settings.goals.sugar, updateUserGoals, setWaterGoal]);

  const handleSaveGoals = () => {
    if (hasBulkingConflict) {
      setShowGoalConfirm(true);
      return;
    }
    doSaveGoals();
  };

  const handleSaveName = () => {
    const validation = validateName(nameInput);
    if (!validation.valid) { toast.error(validation.error); return; }
    setUserName(nameInput.trim());
    setIsEditingName(false);
    toast.success('Profile updated!');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setUserAvatar(reader.result as string); toast.success('Profile picture updated!'); };
    reader.readAsDataURL(file);
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

  const handleTogglePersonalizedGoals = (checked: boolean) => {
    if (!isPro) { setShowProModal(true); return; }
    if (!checked && personalizedGoalsEnabled) {
      setShowDisablePersonalized(true);
      return;
    }
    setPersonalizedGoalsEnabled(checked);
    // Save to settings
    const updated = { ...settings, personalizedGoals: checked };
    // We don't have a direct setter, so we use localStorage
    const stored = localStorage.getItem('meliusme-settings');
    if (stored) {
      const s = JSON.parse(stored);
      s.personalizedGoals = checked;
      localStorage.setItem('meliusme-settings', JSON.stringify(s));
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold tracking-tight">
              {getGreeting(userProfile?.name)}
            </motion.h1>
            {userProfile?.createdAt && (
              <p className="text-muted-foreground text-sm mt-0.5">{formatMemberSince(userProfile.createdAt)}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="rounded-xl">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-6 space-y-4">
        {/* User Profile with Avatar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Your Profile</h2>
          <div className="flex items-center gap-4">
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <button onClick={() => avatarInputRef.current?.click()} className="relative group flex-shrink-0 cursor-pointer" title="Change profile picture">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Enter your name"
                    className="h-10 rounded-xl bg-secondary border-0" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} />
                  <Button onClick={handleSaveName} size="sm" className="rounded-xl">Save</Button>
                </div>
              ) : (
                <button onClick={() => setIsEditingName(true)} className="text-left w-full group">
                  <p className="font-bold text-lg group-hover:text-primary transition-colors">{userProfile?.name || 'Set your name'}</p>
                  <p className="text-sm text-muted-foreground">Tap to edit</p>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Personalized Goals Toggle (Pro) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Personalized Goals</span>
                  {!isPro && <ProBadge />}
                </div>
                <p className="text-xs text-muted-foreground">Auto-generate goals from body profile</p>
              </div>
            </div>
            <Switch 
              checked={personalizedGoalsEnabled} 
              onCheckedChange={handleTogglePersonalizedGoals}
              disabled={!isPro}
            />
          </div>
        </motion.div>

        {/* Body Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Button 
            onClick={() => {
              if (!personalizedGoalsEnabled && isPro) {
                toast.info('Enable Personalized Goals above to use this feature');
                return;
              }
              if (!isPro) {
                setShowProModal(true);
                return;
              }
              setShowBodyProfile(true);
            }} 
            variant="outline" 
            className={`w-full h-14 rounded-2xl justify-start gap-3 font-semibold ${!personalizedGoalsEnabled ? 'opacity-60' : ''}`}
          >
            <Scale className="w-5 h-5 text-primary" />
            <div className="text-left flex-1">
              <span className="block">Personalized Goals</span>
              <span className="text-xs text-muted-foreground font-normal">
                {bodyProfile?.goal ? `${bodyProfile.goal.charAt(0).toUpperCase() + bodyProfile.goal.slice(1)} • ` : ''}
                {bodyProfile?.weightKg ? `${Math.round(bodyProfile.weightKg)}kg` : 'Set up your profile'}
              </span>
            </div>
          </Button>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Appearance</h2>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {settings.darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <span className="font-semibold">Dark Mode</span>
            </div>
            <Switch checked={settings.darkMode} onCheckedChange={setDarkMode} />
          </div>
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Theme</span>
              {!isPro && <ProBadge />}
            </div>
            <div className="flex gap-2">
              {themes.map((theme) => (
                <button key={theme.id} onClick={() => handleThemeChange(theme.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    settings.theme === theme.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : 'hover:scale-110'
                  } ${!isPro && theme.id !== 'default' ? 'opacity-50' : ''}`}
                  style={{ backgroundColor: theme.color }} title={theme.name}>
                  {settings.theme === theme.id && <Check className="w-5 h-5 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Goals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Daily Goals</h2>
          </div>

          {bodyProfile?.goal === 'bulking' && goalsChanged && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-warning/10 border border-warning/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning font-medium">You have bulking goals set. Changing these may conflict with your body profile targets.</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calorie-goal" className="text-sm font-semibold">Calorie Goal</Label>
              <Input id="calorie-goal" type="number" inputMode="numeric" value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)} className="h-11 rounded-xl bg-secondary border-0" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-500" />
                <Label htmlFor="water-goal" className="text-sm font-semibold">Water Goal (glasses)</Label>
              </div>
              <Input id="water-goal" type="number" inputMode="numeric" value={waterGoalInput}
                onChange={(e) => setWaterGoalInput(e.target.value)} placeholder="e.g., 8" className="h-11 rounded-xl bg-secondary border-0" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="protein-goal" className="text-sm font-semibold">Protein Goal (g)</Label>
                {!isPro && <ProBadge />}
              </div>
              {isPro ? (
                <Input id="protein-goal" type="number" inputMode="numeric" value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)} placeholder="e.g., 50" className="h-11 rounded-xl bg-secondary border-0" />
              ) : (
                <button onClick={() => setShowProModal(true)}
                  className="w-full h-11 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                  <Lock className="w-4 h-4" /><span className="text-sm font-medium">Unlock with Pro</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="fiber-goal" className="text-sm font-semibold">Fiber Goal (g)</Label>
                {!isPro && <ProBadge />}
              </div>
              {isPro ? (
                <Input id="fiber-goal" type="number" inputMode="numeric" value={fiberGoal}
                  onChange={(e) => setFiberGoal(e.target.value)} placeholder="e.g., 25" className="h-11 rounded-xl bg-secondary border-0" />
              ) : (
                <button onClick={() => setShowProModal(true)}
                  className="w-full h-11 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                  <Lock className="w-4 h-4" /><span className="text-sm font-medium">Unlock with Pro</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="sugar-goal" className="text-sm font-semibold">Sugar Limit (g)</Label>
                {!isPro && <ProBadge />}
              </div>
              {isPro ? (
                <Input id="sugar-goal" type="number" inputMode="numeric" value={sugarGoal}
                  onChange={(e) => setSugarGoal(e.target.value)} placeholder="e.g., 50" className="h-11 rounded-xl bg-secondary border-0" />
              ) : (
                <button onClick={() => setShowProModal(true)}
                  className="w-full h-11 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                  <Lock className="w-4 h-4" /><span className="text-sm font-medium">Unlock with Pro</span>
                </button>
              )}
            </div>

            <Button onClick={handleSaveGoals} disabled={!goalsChanged} className="w-full h-11 rounded-xl font-bold">
              Save Goals
            </Button>
          </div>
        </motion.div>

        {/* Export */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button onClick={handleExport} variant="outline" className="w-full h-12 rounded-xl justify-between font-semibold">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5" /><span>Export Data (CSV)</span>
            </div>
            {!isPro && <ProBadge />}
          </Button>
        </motion.div>

        {/* Pro Status - show at bottom when Pro */}
        {!isPro && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <button onClick={() => setShowProModal(true)}
              className="w-full rounded-2xl p-5 text-left transition-all group relative overflow-hidden bg-gradient-to-br from-primary/20 via-card to-accent/30 border border-primary/40 hover:border-primary/60 shadow-soft">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-neon">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-extrabold text-foreground group-hover:text-primary transition-colors">Upgrade to Pro</h2>
                    <p className="text-primary font-bold text-sm">$4.99 • Lifetime access</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {proFeatures.slice(0, 3).map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </div>

      {/* Goal conflict confirmation dialog */}
      <AlertDialog open={showGoalConfirm} onOpenChange={setShowGoalConfirm}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Conflicting with Bulking Goals
            </AlertDialogTitle>
            <AlertDialogDescription>
              You're reducing your calorie goal while your body profile is set to bulking. This may slow your progress. Are you sure you want to save these goals?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowGoalConfirm(false); doSaveGoals(); }}>
              Save Anyway
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
              This will stop auto-generating goals based on your body profile. Your current goals will remain, but won't update automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setPersonalizedGoalsEnabled(false);
              const stored = localStorage.getItem('meliusme-settings');
              if (stored) {
                const s = JSON.parse(stored);
                s.personalizedGoals = false;
                localStorage.setItem('meliusme-settings', JSON.stringify(s));
              }
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
