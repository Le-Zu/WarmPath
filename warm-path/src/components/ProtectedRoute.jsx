import {Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';


// If there is no loggeed-in user, send them to the login page
// The 'replace' prop prevents them from using the back button to return to the protected page

const ProtectedRoute = ({ children }) => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return children;
};