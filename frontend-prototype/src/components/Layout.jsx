import { Link, useLocation } from 'react-router-dom';
import UserSwitcher from './UserSwitcher';
import NotificationBell from './NotificationBell';
import { useUser } from '../context/UserContext';
import { getPendingRequestsForConnector } from '../data/mockData';

export default function Layout({ children }) {
  const location = useLocation();
  const { currentUser } = useUser();
  const pendingRequests = getPendingRequestsForConnector(currentUser.id);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/my-requests', label: 'My Requests' },
    { path: '/requests', label: 'Inbox', badge: pendingRequests.length },
    { path: '/profile', label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-gray-900">
            WarmPath
          </Link>
          <nav className="flex items-center gap-4">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium relative ${
                  location.pathname === item.path
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            <NotificationBell />
            <UserSwitcher />
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
