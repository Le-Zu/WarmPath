import { useUser } from '../context/UserContext';
import { userDetails, getDirectConnectionsCount } from '../data/mockData';

export default function Profile() {
  const { currentUser } = useUser();
  const details = userDetails[currentUser.id];
  const connectionCount = getDirectConnectionsCount(currentUser.id);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
            {currentUser.name.split(' ')[0][0]}{currentUser.name.split(' ').slice(-1)[0][0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentUser.name.replace(' (Jordan)', '')}
            </h1>
            <p className="text-gray-600">
              {currentUser.year} · {currentUser.major}
            </p>
            {details?.contactEmail && (
              <p className="text-sm text-gray-500 mt-1">{details.contactEmail}</p>
            )}
          </div>
        </div>
      </div>

      {/* Network summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Network</h2>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{connectionCount}</p>
            <p className="text-sm text-gray-600">direct connections</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Your connections can help introduce you to people in their network.
        </p>
      </div>

      {/* Experiences */}
      {details?.experiences && details.experiences.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Experiences</h2>
          <ul className="space-y-3">
            {details.experiences.map((experience, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{experience}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interests */}
      {details?.interests && details.interests.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {details.interests.map((interest, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Note about profile */}
      <p className="text-center text-sm text-gray-500 mt-6">
        This is how others see you when you're suggested as a potential connection.
      </p>
    </div>
  );
}
