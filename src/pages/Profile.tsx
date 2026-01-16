import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Sparkles, Download, Code2, Target, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { exportMealsToCSV } from '@/lib/db';
import { toast } from 'sonner';

const proFeatures = [
  'Track protein, fiber & sugar goals',
  'Advanced nutrition charts',
  'Weekly averages & insights',
  'Export all data to CSV',
  'Custom meal tags',
];

export default function Profile() {
  const { settings, isPro, setDarkMode, setDevMode, setPro, updateUserGoals } = useApp();
  const [showProModal, setShowProModal] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(settings.goals.calories.toString());
  const [proteinGoal, setProteinGoal] = useState(settings.goals.protein?.toString() || '');
  const [fiberGoal, setFiberGoal] = useState(settings.goals.fiber?.toString() || '');
  const [sugarGoal, setSugarGoal] = useState(settings.goals.sugar?.toString() || '');

  const handleSaveGoals = () => {
    updateUserGoals({
      calories: parseInt(calorieGoal, 10) || 2000,
      protein: isPro && proteinGoal ? parseInt(proteinGoal, 10) : undefined,
      fiber: isPro && fiberGoal ? parseInt(fiberGoal, 10) : undefined,
      sugar: isPro && sugarGoal ? parseInt(sugarGoal, 10) : undefined,
    });
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
          className="text-3xl font-bold"
        >
          Profile
        </motion.h1>
        <p className="text-muted-foreground mt-1">Settings & preferences</p>
      </div>

      <div className="px-6 space-y-6">
        {/* Pro Status */}
        {!isPro && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={() => setShowProModal(true)}
              className="w-full bg-gradient-to-r from-warning to-warning/80 rounded-3xl p-6 text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Upgrade to Pro</h2>
                  <p className="text-white/80 text-sm">Unlock all features • $4.99</p>
                </div>
              </div>
              <div className="space-y-2">
                {proFeatures.slice(0, 3).map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-white/90 text-sm">
                    <Check className="w-4 h-4" />
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
            className="bg-primary/10 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Melius Pro</h2>
                <p className="text-muted-foreground text-sm">All features unlocked</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl p-6 border border-border"
        >
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.darkMode ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-warning" />
              )}
              <span>Dark Mode</span>
            </div>
            <Switch checked={settings.darkMode} onCheckedChange={setDarkMode} />
          </div>
        </motion.div>

        {/* Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-3xl p-6 border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Daily Goals</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calorie-goal">Calorie Goal</Label>
              <Input
                id="calorie-goal"
                type="number"
                inputMode="numeric"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="protein-goal">Protein Goal (g)</Label>
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
                  className="h-12 rounded-xl"
                />
              ) : (
                <button
                  onClick={() => setShowProModal(true)}
                  className="w-full h-12 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Unlock with Pro</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="fiber-goal">Fiber Goal (g)</Label>
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
                  className="h-12 rounded-xl"
                />
              ) : (
                <button
                  onClick={() => setShowProModal(true)}
                  className="w-full h-12 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Unlock with Pro</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="sugar-goal">Sugar Limit (g)</Label>
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
                  className="h-12 rounded-xl"
                />
              ) : (
                <button
                  onClick={() => setShowProModal(true)}
                  className="w-full h-12 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Unlock with Pro</span>
                </button>
              )}
            </div>

            <Button onClick={handleSaveGoals} className="w-full h-12 rounded-xl">
              Save Goals
            </Button>
          </div>
        </motion.div>

        {/* Export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleExport}
            variant="outline"
            className="w-full h-14 rounded-xl justify-between"
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
          transition={{ delay: 0.5 }}
          className="bg-card rounded-3xl p-6 border border-border border-dashed"
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
