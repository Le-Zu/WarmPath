import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import pages and components
import HomePage from "./pages/HomePage"; // Page
import LoginTest from "./pages/logintest"; // component
//import ProtectRoute from './components/ProtectedRoute.jsx'; // component

export default function App() {
   return (
      // AuthProvider should wrap the Router so all routes have access to user state
      <BrowserRouter>
         <Routes>
            {/* The Home Page */}
            <Route index element={<HomePage />} />

            {/* The Login Test Page --Accessible to anyone (for now)*/}
            <Route path="/logintest" element={<LoginTest />} />

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
