import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Sparkles, Download, Settings, Target, Check, Lock, Droplets, Palette, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { exportMealsToCSV } from '@/lib/db';
import { getGreeting, formatMemberSince } from '@/lib/userProfile';
import { validateName } from '@/lib/validation';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
  const { settings, isPro, setDarkMode, updateUserGoals, setWaterGoal, setTheme, userProfile, setUserName } = useApp();
  const navigate = useNavigate();
  const [showProModal, setShowProModal] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(settings.goals.calories.toString());
  const [proteinGoal, setProteinGoal] = useState(settings.goals.protein?.toString() || '');
  const [fiberGoal, setFiberGoal] = useState(settings.goals.fiber?.toString() || '');
  const [sugarGoal, setSugarGoal] = useState(settings.goals.sugar?.toString() || '');
  const [waterGoalInput, setWaterGoalInput] = useState(settings.waterGoal.toString());
  const [nameInput, setNameInput] = useState(userProfile?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  const handleSaveGoals = () => {
    updateUserGoals({
      calories: parseInt(calorieGoal, 10) || 2000,
      protein: isPro && proteinGoal ? parseInt(proteinGoal, 10) : undefined,
      fiber: isPro && fiberGoal ? parseInt(fiberGoal, 10) : undefined,
      sugar: isPro && sugarGoal ? parseInt(sugarGoal, 10) : undefined,
    });
    setWaterGoal(parseInt(waterGoalInput, 10) || 8);
    toast.success('Goals saved!');
  };

  const handleSaveName = () => {
    const validation = validateName(nameInput);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    setUserName(nameInput.trim());
    setIsEditingName(false);
    toast.success('Profile updated!');
  };

  const handleExport = async () => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }

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
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    setTheme(themeId);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold tracking-tight"
            >
              {getGreeting(userProfile?.name)}
            </motion.h1>
            {userProfile?.createdAt && (
              <p className="text-muted-foreground text-sm mt-0.5">
                {formatMemberSince(userProfile.createdAt)}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="rounded-xl"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-6 space-y-4">
        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-5 border border-border/50"
        >
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Your Profile</h2>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                    className="h-10 rounded-xl bg-secondary border-0"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <Button onClick={handleSaveName} size="sm" className="rounded-xl">
                    Save
                  </Button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="text-left w-full group"
                >
                  <p className="font-bold text-lg group-hover:text-primary transition-colors">
                    {userProfile?.name || 'Set your name'}
                  </p>
                  <p className="text-sm text-muted-foreground">Tap to edit</p>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Pro Status */}
        {!isPro && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={() => setShowProModal(true)}
              className="w-full bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-5 text-left shadow-xl shadow-orange-500/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Upgrade to Pro</h2>
                  <p className="text-white/80 text-sm">One-time • $4.99 forever</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {proFeatures.slice(0, 3).map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-white/90 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </button>
          </motion.div>
        )}

        {isPro && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-primary/10 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">MeliusMe Pro</h2>
                <p className="text-muted-foreground text-sm">All features unlocked</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-5 border border-border/50"
        >
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Appearance</h2>
          
          {/* Dark Mode */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {settings.darkMode ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <span className="font-semibold">Dark Mode</span>
            </div>
            <Switch checked={settings.darkMode} onCheckedChange={setDarkMode} />
          </div>

          {/* Theme Selection */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Theme</span>
              {!isPro && <ProBadge />}
            </div>
            <div className="flex gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    settings.theme === theme.id
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-card'
                      : 'hover:scale-110'
                  } ${!isPro && theme.id !== 'default' ? 'opacity-50' : ''}`}
                  style={{ backgroundColor: theme.color }}
                  title={theme.name}
                >
                  {settings.theme === theme.id && (
                    <Check className="w-5 h-5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 border border-border/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Daily Goals</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calorie-goal" className="text-sm font-semibold">Calorie Goal</Label>
              <Input
                id="calorie-goal"
                type="number"
                inputMode="numeric"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                className="h-11 rounded-xl bg-secondary border-0"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-500" />
                <Label htmlFor="water-goal" className="text-sm font-semibold">Water Goal (glasses)</Label>
              </div>
              <Input
                id="water-goal"
                type="number"
                inputMode="numeric"
                value={waterGoalInput}
                onChange={(e) => setWaterGoalInput(e.target.value)}
                placeholder="e.g., 8"
                className="h-11 rounded-xl bg-secondary border-0"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="protein-goal" className="text-sm font-semibold">Protein Goal (g)</Label>
                {!isPro && <ProBadge />}
              </div>
              {isPro ? (
                <Input
                  id="protein-goal"
                  type="number"
                  inputMode="numeric"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  placeholder="e.g., 50"
                  className="h-11 rounded-xl bg-secondary border-0"
                />
              ) : (
                <button
                  onClick={() => setShowProModal(true)}
                  className="w-full h-11 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Unlock with Pro</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="fiber-goal" className="text-sm font-semibold">Fiber Goal (g)</Label>
                {!isPro && <ProBadge />}
              </div>
              {isPro ? (
                <Input
                  id="fiber-goal"
                  type="number"
                  inputMode="numeric"
                  value={fiberGoal}
                  onChange={(e) => setFiberGoal(e.target.value)}
                  placeholder="e.g., 25"
                  className="h-11 rounded-xl bg-secondary border-0"
                />
              ) : (
                <button
                  onClick={() => setShowProModal(true)}
                  className="w-full h-11 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Unlock with Pro</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="sugar-goal" className="text-sm font-semibold">Sugar Limit (g)</Label>
                {!isPro && <ProBadge />}
              </div>
              {isPro ? (
                <Input
                  id="sugar-goal"
                  type="number"
                  inputMode="numeric"
                  value={sugarGoal}
                  onChange={(e) => setSugarGoal(e.target.value)}
                  placeholder="e.g., 50"
                  className="h-11 rounded-xl bg-secondary border-0"
                />
              ) : (
                <button
                  onClick={() => setShowProModal(true)}
                  className="w-full h-11 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Unlock with Pro</span>
                </button>
              )}
            </div>

            <Button onClick={handleSaveGoals} className="w-full h-11 rounded-xl font-bold">
              Save Goals
            </Button>
          </div>
        </motion.div>

        {/* Export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            onClick={handleExport}
            variant="outline"
            className="w-full h-12 rounded-xl justify-between font-semibold"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5" />
              <span>Export Data (CSV)</span>
            </div>
            {!isPro && <ProBadge />}
          </Button>
        </motion.div>
      </div>

      <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}