import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext.jsx';
import AppLayout    from './components/AppLayout.jsx';
import HomePage     from './pages/HomePage.jsx';
import Home         from './pages/Home.jsx';
import Paths        from './pages/Paths.jsx';
import Requests     from './pages/Requests.jsx';
import MyRequests   from './pages/MyRequests.jsx';
import Profile      from './pages/Profile.jsx';
import './index.css';

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route element={<AppLayout />}>
            <Route path="/home"        element={<Home />} />
            <Route path="/paths"       element={<Paths />} />
            <Route path="/requests"    element={<Requests />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/profile"     element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
