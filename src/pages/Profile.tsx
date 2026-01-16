import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Sparkles, Download, Code2, Target, Check, Lock, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { exportMealsToCSV, resetProStatus } from '@/lib/db';
import { toast } from 'sonner';

const proFeatures = [
  'Track protein, fiber & sugar goals',
  'Advanced nutrition charts',
  'Weekly averages & insights',
  'Export all data to CSV',
  'Custom meal tags',
];

export default function Profile() {
  const { settings, isPro, setDarkMode, setDevMode, setPro, updateUserGoals, setWaterGoal } = useApp();
  const [showProModal, setShowProModal] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(settings.goals.calories.toString());
  const [proteinGoal, setProteinGoal] = useState(settings.goals.protein?.toString() || '');
  const [fiberGoal, setFiberGoal] = useState(settings.goals.fiber?.toString() || '');
  const [sugarGoal, setSugarGoal] = useState(settings.goals.sugar?.toString() || '');
  const [waterGoalInput, setWaterGoalInput] = useState(settings.waterGoal.toString());

  // Reset to free plan on mount (per user request)
  useEffect(() => {
    resetProStatus();
    setPro(false);
    setDevMode(false);
  }, []);

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
      a.download = `melius-export-${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 safe-top">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold tracking-tight"
        >
          Profile
        </motion.h1>
        <p className="text-muted-foreground text-sm mt-0.5">Settings & preferences</p>
      </div>

      <div className="px-6 space-y-4">
        {/* Pro Status */}
        {!isPro && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={() => setShowProModal(true)}
              className="w-full bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-5 text-left shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Upgrade to Pro</h2>
                  <p className="text-white/80 text-sm">Unlock all features • $4.99</p>
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
                <h2 className="text-lg font-bold">Melius Pro</h2>
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
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.darkMode ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <span className="font-medium">Dark Mode</span>
            </div>
            <Switch checked={settings.darkMode} onCheckedChange={setDarkMode} />
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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Daily Goals</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calorie-goal" className="text-sm font-medium">Calorie Goal</Label>
              <Input
                id="calorie-goal"
                type="number"
                inputMode="numeric"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-500" />
                <Label htmlFor="water-goal" className="text-sm font-medium">Water Goal (glasses)</Label>
              </div>
              <Input
                id="water-goal"
                type="number"
                inputMode="numeric"
                value={waterGoalInput}
                onChange={(e) => setWaterGoalInput(e.target.value)}
                placeholder="e.g., 8"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="protein-goal" className="text-sm font-medium">Protein Goal (g)</Label>
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
                  className="h-11 rounded-xl"
                />
              ) : (
                <button
                  onClick={() => setShowProModal(true)}
                  className="w-full h-11 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Unlock with Pro</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="fiber-goal" className="text-sm font-medium">Fiber Goal (g)</Label>
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
                  className="h-11 rounded-xl"
                />
              ) : (
                <button
                  onClick={() => setShowProModal(true)}
                  className="w-full h-11 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Unlock with Pro</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="sugar-goal" className="text-sm font-medium">Sugar Limit (g)</Label>
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
                  className="h-11 rounded-xl"
                />
              ) : (
                <button
                  onClick={() => setShowProModal(true)}
                  className="w-full h-11 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Unlock with Pro</span>
                </button>
              )}
            </div>

            <Button onClick={handleSaveGoals} className="w-full h-11 rounded-xl font-semibold">
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
            className="w-full h-12 rounded-xl justify-between"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5" />
              <span>Export Data (CSV)</span>
            </div>
            {!isPro && <ProBadge />}
          </Button>
        </motion.div>

        {/* Developer Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-5 border border-dashed border-border/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="font-medium">Developer Mode</span>
                <p className="text-xs text-muted-foreground">DEV ONLY - Unlocks Pro</p>
              </div>
            </div>
            <Switch checked={settings.devMode} onCheckedChange={setDevMode} />
          </div>
        </motion.div>
      </div>

      <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}
