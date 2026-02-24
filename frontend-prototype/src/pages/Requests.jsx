import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  getPendingRequestsForConnector,
  getUserById,
  updateIntroRequestStatusWithTimestamp,
  introRequests,
  addNotification
} from '../data/mockData';

export default function Requests() {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [requests, setRequests] = useState(() => getPendingRequestsForConnector(currentUser.id));
  const [editingId, setEditingId] = useState(null);
  const [editedMessage, setEditedMessage] = useState('');

  const handleApprove = (request) => {
    const target = getUserById(request.targetId);
    updateIntroRequestStatusWithTimestamp(request.id, 'approved');
    setRequests(requests.filter(r => r.id !== request.id));

    // Create notification for the requester
    addNotification({
      userId: request.requesterId,
      type: 'intro_approved',
      message: `${currentUser.name.replace(' (Jordan)', '')} approved your intro request to ${target.name}!`,
      relatedRequestId: request.id
    });

    // Navigate to intro outcome
    navigate(`/intro/${request.id}`);
  };

  const handleDecline = (request) => {
    const target = getUserById(request.targetId);
    updateIntroRequestStatusWithTimestamp(request.id, 'declined');
    setRequests(requests.filter(r => r.id !== request.id));

    // Create notification for the requester
    addNotification({
      userId: request.requesterId,
      type: 'intro_declined',
      message: `Your intro request to ${target.name} wasn't approved this time.`,
      relatedRequestId: request.id
    });
  };

  const handleStartEdit = (request) => {
    setEditingId(request.id);
    setEditedMessage(request.message);
  };

  const handleSaveEdit = (request) => {
    // Update the message in the request
    const index = introRequests.findIndex(r => r.id === request.id);
    if (index !== -1) {
      introRequests[index].message = editedMessage;
    }
    setEditingId(null);
    handleApprove({ ...request, message: editedMessage });
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No pending requests</h2>
        <p className="text-gray-600">
          When someone in your network asks for an introduction through you, it'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Intro Requests</h1>
      <p className="text-gray-600 mb-6">
        People are asking you to make introductions. Review and decide.
      </p>

      <div className="space-y-4">
        {requests.map(request => {
          const requester = getUserById(request.requesterId);
          const target = getUserById(request.targetId);
          const isEditing = editingId === request.id;

          return (
            <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-5">
              {/* Path visualization */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {requester.name.split(' ')[0][0]}{requester.name.split(' ').pop()[0]}
                  </div>
                  <span className="text-xs text-gray-600 mt-1">{requester.name.split(' ')[0]}</span>
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                    You
                  </div>
                  <span className="text-xs text-gray-600 mt-1">You</span>
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                    {target.name.split(' ')[0][0]}{target.name.split(' ').pop()[0]}
                  </div>
                  <span className="text-xs text-gray-600 mt-1">{target.name.split(' ')[0]}</span>
                </div>
              </div>

              {/* Request details */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">
                  {requester.name} ({requester.year}, {requester.major}) wants to meet {target.name}
                </p>
              </div>

              {/* Message */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                {isEditing ? (
                  <textarea
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-gray-700">{request.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(request)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      Save & Approve
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleDecline(request)}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleStartEdit(request)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Edit & Approve
                    </button>
                    <button
                      onClick={() => handleApprove(request)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
