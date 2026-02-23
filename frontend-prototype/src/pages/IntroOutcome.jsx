import { useParams, Link, Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { introRequests, getUserById, generateContextPreRead } from '../data/mockData';
import ContactExchange from '../components/ContactExchange';

export default function IntroOutcome() {
  const { id } = useParams();
  const { currentUser } = useUser();
  const request = introRequests.find(r => r.id === parseInt(id));

  if (!request || request.status !== 'approved') {
    return <Navigate to="/" replace />;
  }

  // Check if current user is part of this intro (requester or target)
  const isInvolved = currentUser.id === request.requesterId || currentUser.id === request.targetId;

  const requester = getUserById(request.requesterId);
  const target = getUserById(request.targetId);
  const connector = getUserById(request.connectorId);
  const contextPreRead = generateContextPreRead(requester, target);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Introduction Made!</h1>
        <p className="text-gray-600">
          {connector.name.split(' ')[0]} has connected {requester.name.split(' ')[0]} and {target.name.split(' ')[0]}
        </p>
      </div>

      {/* Intro message */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-2">Introduction Message</h2>
        <p className="text-gray-700">{request.message}</p>
      </div>

      {/* Context pre-reads */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
              {contextPreRead.person1.name.split(' ')[0][0]}{contextPreRead.person1.name.split(' ').pop()[0]}
            </div>
            <h3 className="font-semibold text-gray-900">{contextPreRead.person1.name}</h3>
          </div>
          <ul className="space-y-2">
            {contextPreRead.person1.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
              {contextPreRead.person2.name.split(' ')[0][0]}{contextPreRead.person2.name.split(' ').pop()[0]}
            </div>
            <h3 className="font-semibold text-gray-900">{contextPreRead.person2.name}</h3>
          </div>
          <ul className="space-y-2">
            {contextPreRead.person2.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Contact Exchange / Next steps */}
      {isInvolved ? (
        <div className="mb-6">
          <ContactExchange request={request} />
        </div>
      ) : (
        <div className="bg-blue-50 rounded-lg p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Introduction Sent</h2>
          <p className="text-sm text-gray-600">
            Both {requester.name.split(' ')[0]} and {target.name.split(' ')[0]} have been notified and can now connect directly.
          </p>
        </div>
      )}

      <div className="text-center">
        <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
