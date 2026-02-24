import { useState } from 'react';
import { useUser } from '../context/UserContext';
import {
  userDetails,
  getUserById,
  markContactShared,
  addNotification
} from '../data/mockData';

export default function ContactExchange({ request }) {
  const { currentUser } = useUser();
  const [isShared, setIsShared] = useState(request.contactShared);
  const [showContacts, setShowContacts] = useState(false);

  const requester = getUserById(request.requesterId);
  const target = getUserById(request.targetId);
  const requesterDetails = userDetails[request.requesterId];
  const targetDetails = userDetails[request.targetId];

  // Determine if current user is the requester or target
  const isRequester = currentUser.id === request.requesterId;
  const isTarget = currentUser.id === request.targetId;
  const otherPerson = isRequester ? target : requester;
  const otherPersonDetails = isRequester ? targetDetails : requesterDetails;

  const handleShareContact = () => {
    // Mark the contact as shared in the request
    markContactShared(request.id);
    setIsShared(true);
    setShowContacts(true);

    // Create notification for the other party
    addNotification({
      userId: otherPerson.id,
      type: 'contact_shared',
      message: `${currentUser.name.replace(' (Jordan)', '')} shared their contact info with you`,
      relatedRequestId: request.id
    });
  };

  if (!isRequester && !isTarget) {
    return null;
  }

  return (
    <div className="bg-blue-50 rounded-lg p-5">
      <h2 className="font-semibold text-gray-900 mb-2">Connect with {otherPerson.name.split(' ')[0]}</h2>

      {!showContacts ? (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Ready to connect? Share your contact info to get in touch directly.
          </p>
          <button
            onClick={handleShareContact}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Share Contact Info
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                {currentUser.name.split(' ')[0][0]}{currentUser.name.split(' ').slice(-1)[0][0]}
              </div>
              <div>
                <p className="font-medium text-gray-900">Your contact info</p>
                <p className="text-sm text-gray-600">{userDetails[currentUser.id]?.contactEmail}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                {otherPerson.name.split(' ')[0][0]}{otherPerson.name.split(' ').slice(-1)[0][0]}
              </div>
              <div>
                <p className="font-medium text-gray-900">{otherPerson.name}'s contact info</p>
                <p className="text-sm text-gray-600">{otherPersonDetails?.contactEmail}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            {otherPerson.name.split(' ')[0]} has been notified that you shared your contact info.
          </p>
        </div>
      )}
    </div>
  );
}
