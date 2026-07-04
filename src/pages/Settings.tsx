import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Code2, 
  ChevronLeft,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  BookmarkPlus,
  Trash2,
  Flame,
  Beef,
  Apple,
  Candy,
  Shield,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { staggerContainer, fadeUp } from '@/lib/motion';
import { getMealTemplates, deleteMealTemplate, MealTemplate } from '@/lib/proFeatures';
import { restorePurchases, checkProEntitlement } from '@/lib/revenuecat';
import logo from '@/assets/meliusme-logo-new.png';

const APP_VERSION = '0.11.2-alpha';

export default function Settings() {
  const {
    settings, isPro, setPro, setDevMode, resetDailyData,
    setUse24Hour, animationLevel, setAnimationLevel,
  } = useApp();
  const navigate = useNavigate();
  const [showProModal, setShowProModal] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);

  useEffect(() => {
    if (isPro) {
      getMealTemplates().then(setTemplates);
    }
  }, [isPro]);

  const handleDeleteTemplate = async (id: string) => {
    await deleteMealTemplate(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const handleResetDaily = () => {
    resetDailyData();
    setShowFinalConfirm(false);
    toast.success("Today's nutrition reset");
  };


  const handleRestorePurchase = async () => {
    toast.info('Checking for previous purchases...');
    try {
      const result = await restorePurchases();
      if (result.success) {
        setPro(true);
        toast.success('Pro restored successfully!');
      } else {
        // Double-check entitlement
        const hasPro = await checkProEntitlement();
        if (hasPro) {
          setPro(true);
          toast.success('Pro restored successfully!');
        } else {
          toast.error('No previous purchase detected');
        }
      }
    } catch {
      toast.error('Failed to restore. Please try again.');
    }
  };

  const macroIcon = (type: string) => {
    switch (type) {
      case 'breakfast': case 'lunch': case 'dinner': case 'snack': return Flame;
      default: return Flame;
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <motion.div whileTap={{ scale: 0.85 }}>
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="rounded-xl">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-bold tracking-tight">
            Settings
          </motion.h1>
        </div>
      </div>

      <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="px-6 space-y-4">
        {/* Animations slider */}
        <motion.div variants={fadeUp}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Accessibility</h2>
          <div className="flex items-start gap-3 mb-4">
            {animationLevel === 'off' ? (
              <EyeOff className="w-5 h-5 text-muted-foreground mt-0.5" />
            ) : (
              <Eye className="w-5 h-5 text-primary mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">Animations</span>
                <span className="text-xs font-semibold text-primary capitalize">{animationLevel}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {animationLevel === 'full' && 'All motion and effects enabled.'}
                {animationLevel === 'reduced' && 'Essential transitions only. Decorative effects are disabled.'}
                {animationLevel === 'off' && 'All motion disabled.'}
              </p>
            </div>
          </div>
          <Slider
            min={0}
            max={2}
            step={1}
            value={[animationLevel === 'off' ? 0 : animationLevel === 'reduced' ? 1 : 2]}
            onValueChange={(v) => {
              const level = v[0] === 0 ? 'off' : v[0] === 1 ? 'reduced' : 'full';
              setAnimationLevel(level);
            }}
            aria-label="Animation level"
          />
          <div className="flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground mt-2 px-0.5">
            <span>Off</span>
            <span>Reduced</span>
            <span>Full</span>
          </div>
        </motion.div>

        {/* Meal Templates */}
        {isPro && (
          <motion.div variants={fadeUp}
            className="bg-card rounded-2xl p-5 border border-border/50">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Meal Templates</h2>
            {templates.length > 0 ? (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center gap-3 bg-secondary/30 rounded-xl p-3 border border-border/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{template.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="capitalize">{template.mealType}</span>
                        <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{template.calories}</span>
                        {template.protein !== undefined && <span className="flex items-center gap-1"><Beef className="w-3 h-3" />{template.protein}g</span>}
                        {template.fiber !== undefined && <span className="flex items-center gap-1"><Apple className="w-3 h-3" />{template.fiber}g</span>}
                        {template.sugar !== undefined && <span className="flex items-center gap-1"><Candy className="w-3 h-3" />{template.sugar}g</span>}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-2 hover:bg-destructive/20 rounded-lg transition-colors flex-shrink-0">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-border bg-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove "{template.name}" from your saved templates.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 gap-2">
                <BookmarkPlus className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No templates saved yet</p>
                <p className="text-xs text-muted-foreground/60">Save a meal as a template from the meal detail view</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Data Management */}
        <motion.div variants={fadeUp}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Data Management</h2>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button variant="outline" className="w-full h-12 rounded-xl justify-start gap-3 font-semibold">
                  <RotateCcw className="w-5 h-5 text-warning" />
                  <span>Reset Today's Nutrition</span>
                </Button>
              </motion.div>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Reset today's nutrition?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove today's logged meals and reset today's water count.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => setShowFinalConfirm(true)}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
            <AlertDialogContent className="border-border bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All of today's meals and water data will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetDaily} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>

        {/* Time */}
        <motion.div variants={fadeUp}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Time Display</h2>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">Use 24-hour time</span>
              <p className="text-xs text-muted-foreground">Turn off for 12-hour (AM/PM)</p>
            </div>
            <Switch checked={settings.use24Hour} onCheckedChange={setUse24Hour} />
          </div>
        </motion.div>

        {/* Account */}
        <motion.div variants={fadeUp}
          className="bg-card rounded-2xl p-5 border border-border/50 space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Account</h2>
          
          {!isPro && (
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button onClick={() => setShowProModal(true)}
                className="w-full h-12 rounded-xl justify-start gap-3 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
                <img src={logo} alt="" className="w-7 h-7" />
                <span>Upgrade to MeliusMe Pro</span>
              </Button>
            </motion.div>
          )}
          
          
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button onClick={handleRestorePurchase} variant="outline" className="w-full h-12 rounded-xl justify-start gap-3 font-semibold">
              <RefreshCw className="w-5 h-5 text-primary" />
              <span>Restore Pro</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Pro status when Pro */}
        {isPro && (
          <motion.div variants={fadeUp}
            className="bg-primary/10 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/20 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={logo} alt="" className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold">MeliusMe Pro</h2>
                <p className="text-muted-foreground text-sm">All features unlocked</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Developer */}
        <motion.div variants={fadeUp}
          className="bg-card rounded-2xl p-5 border border-dashed border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="font-semibold">Developer Mode</span>
                <p className="text-xs text-muted-foreground">DEV ONLY - Unlocks Pro</p>
              </div>
            </div>
            <Switch checked={settings.devMode} onCheckedChange={setDevMode} />
          </div>
        </motion.div>

        {/* Legal */}
        <motion.div variants={fadeUp} className="space-y-3">
          <Button
            asChild
            variant="outline"
            className="w-full h-12 rounded-xl justify-start gap-3 font-semibold"
          >
            <a
              href="https://aa-0324.github.io/meliusme/privacy-policy.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Shield className="w-5 h-5 text-primary" />
              <span className="flex-1 text-left">Privacy Policy</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full h-12 rounded-xl justify-start gap-3 font-semibold"
          >
            <a
              href="https://aa-0324.github.io/meliusme/terms-of-service.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="w-5 h-5 text-primary" />
              <span className="flex-1 text-left">Terms of Service</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </Button>
        </motion.div>

        {/* App Info */}
        <motion.div variants={fadeUp} className="text-center py-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <SettingsIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Version {APP_VERSION}</span>
          </div>
        </motion.div>

        {/* Warning */}
        <motion.div variants={fadeUp}
          className="bg-warning/10 border border-warning/20 rounded-2xl p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning">Local Storage Warning</p>
              <p className="text-xs text-muted-foreground mt-1">
                All your data is stored locally on this device. If you delete the app or clear browser data, 
                your profile, meals, and settings cannot be recovered.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div variants={fadeUp} className="text-center py-6">
          <p className="text-xs text-muted-foreground/60">&copy; 2026 Melius. All rights reserved.</p>
        </motion.div>
      </motion.div>

      <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}
