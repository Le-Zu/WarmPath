import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getRequestsByRequester, getUserById } from '../data/mockData';

export default function MyRequests() {
  const { currentUser } = useUser();
  const [filter, setFilter] = useState('all');
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    setRequests(getRequestsByRequester(currentUser.id));
  }, [currentUser.id]);

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Not approved
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filterTabs = [
    { id: 'all', label: 'All', count: requests.length },
    { id: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
    { id: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'approved').length },
    { id: 'declined', label: 'Declined', count: requests.filter(r => r.status === 'declined').length },
  ];

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No intro requests yet</h2>
        <p className="text-gray-600 mb-6">
          When you request introductions through your network, they'll appear here.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Find Paths
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Intro Requests</h1>
      <p className="text-gray-600 mb-6">
        Track the status of introductions you've requested.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                filter === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request cards */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No {filter} requests
          </div>
        ) : (
          filteredRequests.map(request => {
            const connector = getUserById(request.connectorId);
            const target = getUserById(request.targetId);

            return (
              <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-5">
                {/* Path visualization */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      You
                    </div>
                    <span className="text-xs text-gray-600 mt-1">You</span>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                      {connector.name.split(' ')[0][0]}{connector.name.split(' ').pop()[0]}
                    </div>
                    <span className="text-xs text-gray-600 mt-1">{connector.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                      {target.name.split(' ')[0][0]}{target.name.split(' ').pop()[0]}
                    </div>
                    <span className="text-xs text-gray-600 mt-1">{target.name.split(' ')[0]}</span>
                  </div>
                </div>

                {/* Status and date */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(request.status)}
                    <span className="text-sm text-gray-500">
                      {formatDate(request.updatedAt || request.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Message preview */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {request.message}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  {request.status === 'approved' && (
                    <Link
                      to={`/intro/${request.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      View Introduction
                    </Link>
                  )}
                  {request.status === 'pending' && (
                    <span className="text-sm text-gray-500">
                      Waiting for {connector.name.split(' ')[0]} to respond...
                    </span>
                  )}
                  {request.status === 'declined' && (
                    <span className="text-sm text-gray-500">
                      This intro wasn't approved this time. Try another path?
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
