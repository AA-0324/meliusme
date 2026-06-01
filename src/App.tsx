import { useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { BottomNav } from "@/components/BottomNav";
import { ProfileButton } from "@/components/ProfileButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SplashScreen } from "@/components/SplashScreen";
import { Onboarding } from "@/components/Onboarding";
import { MealLoggedToast } from "@/components/MealLoggedToast";
import { LevelUpModal } from "@/components/LevelUpModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "./pages/Home";
import Log from "./pages/Log";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Challenges from "./pages/Challenges";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const GlobalBottomToast = () => {
  const { bottomToast, hideBottomToast } = useApp();
  return <MealLoggedToast show={bottomToast.open} message={bottomToast.message} variant={bottomToast.variant} onHide={hideBottomToast} />;
};

const GlobalLevelUpModal = () => {
  const { levelUpPending, dismissLevelUp } = useApp();
  if (!levelUpPending || !levelUpPending.leveledUp) return null;
  return (
    <LevelUpModal
      open={true}
      level={levelUpPending.xpData.level}
      reward={levelUpPending.reward}
      onClose={dismissLevelUp}
    />
  );
};

const AnimationWrapper = ({ children }: { children: React.ReactNode }) => {
  const { animationsEnabled } = useApp();
  return (
    <MotionConfig reducedMotion={animationsEnabled ? 'never' : 'always'}>
      {children}
    </MotionConfig>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(() => sessionStorage.getItem('meliusme-splash-seen') !== 'true');
  const [showOnboarding, setShowOnboarding] = useState(() => (
    sessionStorage.getItem('meliusme-splash-seen') === 'true' && !localStorage.getItem('meliusme-onboarded')
  ));

  const handleSplashComplete = () => {
    sessionStorage.setItem('meliusme-splash-seen', 'true');
    setShowSplash(false);
    const onboarded = localStorage.getItem('meliusme-onboarded');
    if (!onboarded) {
      setShowOnboarding(true);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <AppProvider>
            <AnimationWrapper>
              <Toaster />
              <Sonner />
              <SplashScreen show={showSplash} onComplete={handleSplashComplete} />
              {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
              <GlobalBottomToast />
              <GlobalLevelUpModal />
              <ScrollToTop />
              <div className="min-h-screen bg-background overflow-x-hidden">
                <div className="fixed top-4 right-4 z-40 safe-top" data-nav-profile>
                  <ProfileButton />
                </div>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/log" element={<Log />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/challenges" element={<Challenges />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <BottomNav />
              </div>
            </AnimationWrapper>
          </AppProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
