import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { BottomNav } from "@/components/BottomNav";
import { ProfileButton } from "@/components/ProfileButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import { RouteHead } from "@/components/RouteHead";
import { SplashScreen } from "@/components/SplashScreen";
import { Onboarding } from "@/components/Onboarding";
import { MealLoggedToast } from "@/components/MealLoggedToast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LevelUpModal } from "@/components/LevelUpModal";
import { getEncrypted } from "@/lib/encryptedStorage";
import Home from "./pages/Home";

const Log = lazy(() => import("./pages/Log"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Challenges = lazy(() => import("./pages/Challenges"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const ForceHomeOnLoad = () => {
  // Preserve deep links (needed for Median push/routing). Only reset to '/'
  // when the initial path is unknown or clearly invalid.
  const navigate = useNavigate();
  const didRun = useRef(false);
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    const validPaths = ['/', '/log', '/dashboard', '/profile', '/settings', '/challenges'];
    if (!validPaths.includes(window.location.pathname)) {
      navigate('/', { replace: true });
    }
  }, [navigate]);
  return null;
};

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
  const { motionEnabled } = useApp();
  return (
    <MotionConfig reducedMotion={motionEnabled ? 'never' : 'always'}>
      {children}
    </MotionConfig>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSplashComplete = async () => {
    setShowSplash(false);
    const onboarded = await getEncrypted('meliusme-onboarded');
    if (!onboarded) {
      setShowOnboarding(true);
    }
  };

  return (
    <ErrorBoundary name="App">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppProvider>
            <AnimationWrapper>
              <Toaster />
              <Sonner />
              <SplashScreen show={showSplash} onComplete={handleSplashComplete} />
              {showOnboarding && (
                <ErrorBoundary name="Onboarding" inline>
                  <Onboarding onComplete={() => setShowOnboarding(false)} />
                </ErrorBoundary>
              )}
              <GlobalBottomToast />
              <GlobalLevelUpModal />
              <BrowserRouter>
                <ForceHomeOnLoad />
                <ScrollToTop />
                <RouteHead />
                <div className="min-h-screen bg-background overflow-x-hidden">
                  <div className="fixed top-4 right-4 z-40 safe-top" data-nav-profile>
                    <ProfileButton />
                  </div>
                  <ErrorBoundary name="Routes">
                    <Suspense fallback={<div className="min-h-screen" />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/log" element={<Log />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/challenges" element={<Challenges />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                  <BottomNav />
                </div>
              </BrowserRouter>
            </AnimationWrapper>
          </AppProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
