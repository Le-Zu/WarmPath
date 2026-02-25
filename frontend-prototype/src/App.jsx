import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Paths from './pages/Paths';
import Requests from './pages/Requests';
import MyRequests from './pages/MyRequests';
import Profile from './pages/Profile';
import IntroOutcome from './pages/IntroOutcome';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/paths" element={<Paths />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/intro/:id" element={<IntroOutcome />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
