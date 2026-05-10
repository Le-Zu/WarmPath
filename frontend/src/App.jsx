import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from "@/layout/AppLayout";
import LandingLayout from "@/layout/LandingLayout";
import { ToastProvider } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import ColdStartOverlay from "@/components/ColdStartOverlay";
import '@/index.css';

// FAQ is reachable both logged-in (with AppLayout nav) and logged-out (no nav).
function FAQLayoutSwitcher() {
  const { currentUser } = useAuth();
  return currentUser ? <AppLayout /> : <Outlet />;
}

// Public pages
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import OnboardingFlow from "@/pages/OnboardingFlow";
import FAQ from "@/pages/FAQ";

// App pages (authenticated)
import Home from "@/pages/Home";
import Paths from "@/pages/Paths";
import Requests from "@/pages/Requests";
import MyRequests from "@/pages/MyRequests";
import Profile from "@/pages/Profile";
import SettingsPage from "@/pages/SettingsPage";
import Conversations from "@/pages/Conversations";
import ChatPage from "@/pages/ChatPage";

export default function App() {
  return (
      <ToastProvider>
      <ColdStartOverlay />
      <BrowserRouter>
        <Routes>
          {/* Landing layout — public nav */}
          <Route path="/" element={<HomePage />} />

          {/* Auth pages — no layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />

          {/* FAQ — public, but rendered with AppLayout when logged in */}
          <Route element={<FAQLayoutSwitcher />}>
            <Route path="/faq" element={<FAQ />} />
          </Route>

          {/* App layout — requires auth */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/paths" element={<Paths />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/chat/:id" element={<ChatPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
  );
}
