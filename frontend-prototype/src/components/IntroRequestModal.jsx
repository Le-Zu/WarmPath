import { useState } from 'react';
import { generateIntroMessage, addIntroRequest, addNotification } from '../data/mockData';

export default function IntroRequestModal({ currentUser, connector, target, intent, onClose }) {
  const generatedMessage = generateIntroMessage(currentUser, connector.user, target.user, {
    description: intent.description || `looking for help with ${intent.category}`
  });

  const [message, setMessage] = useState(generatedMessage);
  const [status, setStatus] = useState('editing'); // editing | sending | sent

  const handleSend = () => {
    setStatus('sending');

    // Simulate sending
    setTimeout(() => {
      const newRequest = addIntroRequest({
        intentId: null,
        requesterId: currentUser.id,
        connectorId: connector.user.id,
        targetId: target.user.id,
        message: message,
        status: 'pending'
      });

      // Create notification for the connector
      addNotification({
        userId: connector.user.id,
        type: 'intro_request',
        message: `${currentUser.name.replace(' (Jordan)', '')} is asking you to introduce them to ${target.user.name}`,
        relatedRequestId: newRequest.id
      });

      setStatus('sent');
    }, 500);
  };

  if (status === 'sent') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-lg w-full mx-4 p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-gray-600 mb-6">
            Your intro request has been sent to {connector.user.name.split(' ')[0]}.
            They'll review it and connect you with {target.user.name.split(' ')[0]} if they think it's a good fit.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If they don't respond, the request will quietly expire. No awkwardness, no pressure.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Request Introduction</h2>
          <p className="text-sm text-gray-600">
            via {connector.user.name} → {target.user.name}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your message to {connector.user.name.split(' ')[0]}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              We've drafted a message for you. Feel free to edit it.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={5}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">
              <strong>Note:</strong> This message goes only to {connector.user.name.split(' ')[0]}.
              They'll decide whether to make the introduction. {target.user.name.split(' ')[0]} won't
              see your request unless {connector.user.name.split(' ')[0]} approves it.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={status === 'sending' || !message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'sending' ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
