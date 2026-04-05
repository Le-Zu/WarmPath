import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { UserProvider } from "./contexts/UserContext.jsx";
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from "./components/AppLayout.jsx";
import LandingLayout from "./components/LandingLayout.jsx";
import './index.css';

// Public pages
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import OnboardingFlow from "./pages/OnboardingFlow.jsx";

// App pages (authenticated)
import Home from "./pages/Home.jsx";
import Paths from "./pages/Paths.jsx";
import Requests from "./pages/Requests.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import Profile from "./pages/Profile.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing layout — public nav */}
          <Route element={<LandingLayout />}>
            <Route path="/" element={<HomePage />} />
          </Route>

          {/* Auth pages — no layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />

          {/* App layout — requires auth */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/paths" element={<Paths />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </UserProvider>
    </AuthProvider>
  );
}
