import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Code2, 
  Trash2, 
  CreditCard, 
  Sparkles, 
  ChevronLeft,
  AlertTriangle,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { setWaterIntake } from '@/lib/db';

const APP_VERSION = '1.0.0';

export default function Settings() {
  const { 
    settings, 
    isPro, 
    setDevMode, 
    resetDailyData,
    notificationsEnabled,
    toggleNotifications
  } = useApp();
  const navigate = useNavigate();
  const [showProModal, setShowProModal] = useState(false);

  const handleResetDaily = () => {
    const today = new Date().toISOString().split('T')[0];
    setWaterIntake(today, 0);
    resetDailyData();
    toast.success('Daily data reset successfully');
  };

  const handleDeleteAccount = () => {
    toast.info('Account deletion is not available yet');
  };

  const handleManageSubscription = () => {
    toast.info('Subscription management is not available yet');
  };

  const handleRestorePurchase = async () => {
    toast.info('Checking for previous purchases...');
    // Simulate store check delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.error('No previous purchase detected');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold tracking-tight"
            >
              Settings
            </motion.h1>
            <p className="text-muted-foreground text-sm mt-0.5">App configuration</p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4">
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-5 border border-border/50"
        >
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
              onCheckedChange={toggleNotifications} 
            />
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 border border-border/50"
        >
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Data Management</h2>
          
          <Button
            onClick={handleResetDaily}
            variant="outline"
            className="w-full h-12 rounded-xl justify-start gap-3 font-semibold"
          >
            <RotateCcw className="w-5 h-5 text-warning" />
            <span>Reset Today's Nutrition</span>
          </Button>
        </motion.div>

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-5 border border-border/50 space-y-3"
        >
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Account</h2>
          
          {!isPro && (
            <Button
              onClick={() => setShowProModal(true)}
              className="w-full h-12 rounded-xl justify-start gap-3 font-semibold bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600"
            >
              <Sparkles className="w-5 h-5" />
              <span>Upgrade to Pro</span>
            </Button>
          )}
          
          <Button
            onClick={handleManageSubscription}
            variant="outline"
            className="w-full h-12 rounded-xl justify-start gap-3 font-semibold"
          >
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <span>Manage Subscription</span>
          </Button>
          
          <Button
            onClick={handleRestorePurchase}
            variant="outline"
            className="w-full h-12 rounded-xl justify-start gap-3 font-semibold"
          >
            <RefreshCw className="w-5 h-5 text-primary" />
            <span>Restore Pro</span>
          </Button>
          
          <Button
            onClick={handleDeleteAccount}
            variant="outline"
            className="w-full h-12 rounded-xl justify-start gap-3 font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-5 h-5" />
            <span>Delete Account</span>
          </Button>
        </motion.div>

        {/* Developer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 border border-dashed border-border/50"
        >
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-center py-4"
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <SettingsIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Version {APP_VERSION}</span>
          </div>
        </motion.div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-warning/10 border border-warning/20 rounded-2xl p-4"
        >
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
      </div>

      <ProUpgradeModal open={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}
