import { useEffect, useRef, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { BottomNav } from "@/components/BottomNav";
import { SplashScreen } from "@/components/SplashScreen";
import { MealLoggedToast } from "@/components/MealLoggedToast";
import Home from "./pages/Home";
import Log from "./pages/Log";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
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

const GlobalMealLoggedToast = () => {
  const { showMealLoggedToast, setShowMealLoggedToast } = useApp();
  return (
    <MealLoggedToast
      show={showMealLoggedToast}
      onHide={() => setShowMealLoggedToast(false)}
    />
  );
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
          <GlobalMealLoggedToast />
          <BrowserRouter>
            <ForceHomeOnLoad />
            <div className="min-h-screen bg-background overflow-x-hidden">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/log" element={<Log />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
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
