import "./global.css";
import "./global-scrollbar-hide.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { mentalHealthScheduler } from "./utils/mentalHealthScheduler";

const queryClient = new QueryClient();

const App = () => {
  // Initialize mental health scheduler
  useEffect(() => {
    // Request notification permission when app starts
    mentalHealthScheduler.requestNotificationPermission();
    
    // Cleanup on unmount
    return () => {
      // The scheduler will continue running even if component unmounts
      // This is intentional for background notifications
    };
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <DarkModeProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/account" element={<Account />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </DarkModeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
