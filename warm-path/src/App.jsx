import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import pages and components
import HomePage from "./pages/HomePage"; // Page
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingFlow from "./pages/OnboardingFlow";
import SettingsPage from "./pages/SettingsPage";
//import ProtectRoute from './components/ProtectedRoute.jsx'; // component

export default function App() {
   return (
      // AuthProvider should wrap the Router so all routes have access to user state
      <BrowserRouter>
         <Routes>
            {/* The Home Page */}
            <Route index element={<HomePage />} />

            {/* The Login Page */}
            <Route path="/logintest" element={<LoginPage />} />

            <Route path="/register" element={<RegisterPage />} />

            <Route path="/onboarding" element={<OnboardingFlow />} />

            <Route path="/settings" element={<SettingsPage />} />

            {/* WIP Dashboard for later */}
            {/* <Route path="/dashboard" element={
               <ProtectRoute>
                  <Dashboard />
               </ProtectRoute>
            } />
         */}
         </Routes>
      </BrowserRouter>
   );
}
