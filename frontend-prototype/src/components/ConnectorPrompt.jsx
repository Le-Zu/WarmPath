import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { getNetworkIntents, categories, getConnectionsForUser, getUserById } from '../data/mockData';

export default function ConnectorPrompt() {
  const { currentUser } = useUser();
  const networkIntents = getNetworkIntents(currentUser.id);
  const [dismissed, setDismissed] = useState(false);
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState(null);

  // Don't show if no network intents or dismissed
  if (networkIntents.length === 0 || dismissed) return null;

  const intent = networkIntents[0];
  const requester = getUserById(intent.userId);
  const category = categories.find(c => c.id === intent.category);

  const handleSuggest = () => {
    setSelectedIntent(intent);
    setShowSuggestForm(true);
  };

  if (showSuggestForm) {
    return (
      <ConnectorSuggestForm
        intent={intent}
        requester={requester}
        currentUser={currentUser}
        onClose={() => setShowSuggestForm(false)}
      />
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{category?.icon}</span>
          <div>
            <p className="font-medium text-gray-900">
              Someone in your network needs help
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>{requester.name}</strong> is looking for help with <strong>{category?.label.toLowerCase()}</strong>
              {intent.description && `: "${intent.description}"`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSuggest}
          className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg font-medium hover:bg-amber-700"
        >
          I know someone who can help
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="px-3 py-1.5 text-gray-600 text-sm font-medium hover:text-gray-900"
        >
          Not right now
        </button>
      </div>
    </div>
  );
}

function ConnectorSuggestForm({ intent, requester, currentUser, onClose }) {
  const [person1, setPerson1] = useState('');
  const [person2, setPerson2] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Get people the current user knows
  const connections = getConnectionsForUser(currentUser.id);
  const knownPeople = connections.map(c => {
    const otherId = c.userA === currentUser.id ? c.userB : c.userA;
    return getUserById(otherId);
  }).filter(u => u && u.id !== requester.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would create an intro
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-medium text-gray-900">Thanks for connecting people!</p>
        <p className="text-sm text-gray-600 mt-1">Your suggestion has been sent.</p>
        <button
          onClick={onClose}
          className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Suggest a connection for {requester.name.split(' ')[0]}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Who should they meet?
          </label>
          <select
            value={person1}
            onChange={(e) => setPerson1(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select someone you know...</option>
            {knownPeople.map(person => (
              <option key={person.id} value={person.id}>
                {person.name} ({person.major})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Why should they meet? (one sentence)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., They both worked on similar research..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 text-sm font-medium hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
          >
            Send Suggestion
          </button>
        </div>
      </form>
    </div>
  );
}
