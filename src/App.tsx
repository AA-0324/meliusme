import { useEffect, useRef, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { BottomNav } from "@/components/BottomNav";
import { ProfileButton } from "@/components/ProfileButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SplashScreen } from "@/components/SplashScreen";
import { MealLoggedToast } from "@/components/MealLoggedToast";
import Home from "./pages/Home";
import Log from "./pages/Log";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Challenges from "./pages/Challenges";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ForceHomeOnLoad = () => {
  const navigate = useNavigate();
  const didRun = useRef(false);
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    navigate('/', { replace: true });
  }, [navigate]);
  return null;
};

const GlobalBottomToast = () => {
  const { bottomToast, hideBottomToast } = useApp();
  return <MealLoggedToast show={bottomToast.open} message={bottomToast.message} variant={bottomToast.variant} onHide={hideBottomToast} />;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <SplashScreen show={showSplash} onComplete={() => setShowSplash(false)} />
          <GlobalBottomToast />
          <BrowserRouter>
            <ForceHomeOnLoad />
            <ScrollToTop />
            <div className="min-h-screen bg-background overflow-x-hidden">
              {/* Global Profile Button */}
              <div className="fixed top-4 right-4 z-40 safe-top">
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
          </BrowserRouter>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
