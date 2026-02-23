import { useState } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { findPaths, categories } from '../data/mockData';
import PathCard from '../components/PathCard';
import IntroRequestModal from '../components/IntroRequestModal';

export default function Paths() {
  const location = useLocation();
  const { currentUser } = useUser();
  const [selectedPath, setSelectedPath] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Redirect if no intent was selected
  if (!location.state?.category) {
    return <Navigate to="/" replace />;
  }

  const { category, description } = location.state;
  const categoryInfo = categories.find(c => c.id === category);
  const paths = findPaths(currentUser.id, category);

  const handleRequestIntro = (path) => {
    setSelectedPath(path);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPath(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Change search
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Paths for: {categoryInfo?.icon} {categoryInfo?.label}
        </h1>
        {description && (
          <p className="text-gray-600 mt-1">"{description}"</p>
        )}
      </div>

      {/* Paths list */}
      {paths.length > 0 ? (
        <div className="space-y-4">
          {paths.map((path, index) => (
            <PathCard
              key={index}
              currentUser={currentUser}
              connector={path.connector}
              target={path.target}
              onRequestIntro={() => handleRequestIntro(path)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">
            No paths found for this category right now.
          </p>
          <p className="text-sm text-gray-500">
            Try a different category or check back later as your network grows.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
          >
            Try another search
          </Link>
        </div>
      )}

      {/* Intro Request Modal */}
      {showModal && selectedPath && (
        <IntroRequestModal
          currentUser={currentUser}
          connector={selectedPath.connector}
          target={selectedPath.target}
          intent={{ category, description }}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
