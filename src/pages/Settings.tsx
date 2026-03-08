import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Code2, 
  CreditCard, 
  ChevronLeft,
  AlertTriangle,
  RefreshCw,
  Bell,
  BellOff,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { staggerContainer, fadeUp } from '@/lib/motion';
import logo from '@/assets/meliusme-logo-new.png';

const APP_VERSION = '1.0.0';

export default function Settings() {
  const { 
    settings, isPro, setDevMode, resetDailyData,
    notificationsEnabled, toggleNotifications,
    setUse24Hour, animationsEnabled, setAnimationsEnabled,
  } = useApp();
  const navigate = useNavigate();
  const [showProModal, setShowProModal] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const handleResetDaily = () => {
    resetDailyData();
    setShowFinalConfirm(false);
    toast.success("Today's nutrition reset");
  };

  const handleManageSubscription = () => {
    toast.info('Subscription management is not available yet');
  };

  const handleRestorePurchase = async () => {
    toast.info('Checking for previous purchases...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.error('No previous purchase detected');
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      toast.info('Push notifications are not available yet');
      return;
    }
    await toggleNotifications();
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <motion.div whileTap={{ scale: 0.85 }}>
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="rounded-xl">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </motion.div>
          <div>
            <motion.h1 initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl font-bold tracking-tight">
              Settings
            </motion.h1>
            <p className="text-muted-foreground text-sm mt-0.5">App configuration</p>
          </div>
        </div>
      </div>

      <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="px-6 space-y-4">
        {/* Animations toggle (#13) */}
        <motion.div variants={fadeUp}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Accessibility</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {animationsEnabled ? (
                <Eye className="w-5 h-5 text-primary" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <span className="font-semibold">Animations</span>
                <p className="text-xs text-muted-foreground">Disable for reduced motion</p>
              </div>
            </div>
            <Switch
              checked={animationsEnabled}
              onCheckedChange={setAnimationsEnabled}
            />
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={fadeUp}
          className="bg-card rounded-2xl p-5 border border-border/50">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Notifications</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <Bell className="w-5 h-5 text-primary" />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <span className="font-semibold">Push Notifications</span>
                <p className="text-xs text-muted-foreground">Meal & water reminders</p>
              </div>
            </div>
            <Switch 
              checked={notificationsEnabled} 
              onCheckedChange={handleToggleNotifications} 
            />
          </div>
        </motion.div>

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
                <img src={logo} alt="" className="w-5 h-5" />
                <span>Upgrade to MeliusMe Pro</span>
              </Button>
            </motion.div>
          )}
          
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button onClick={handleManageSubscription} variant="outline" className="w-full h-12 rounded-xl justify-start gap-3 font-semibold">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span>Manage Subscription</span>
            </Button>
          </motion.div>
          
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
          <p className="text-xs text-muted-foreground/60">© 2026 Melius. All rights reserved.</p>
        </motion.div>
      </motion.div>

      <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}
