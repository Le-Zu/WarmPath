export default function PathCard({ currentUser, connector, target, onRequestIntro }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Path visualization */}
      <div className="flex items-center justify-between mb-4">
        {/* You */}
        <div className="flex flex-col items-center w-24">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
            You
          </div>
          <span className="text-xs text-gray-500 mt-1 text-center">{currentUser.major}</span>
        </div>

        {/* Arrow 1 */}
        <div className="flex-1 flex flex-col items-center px-2">
          <div className="w-full border-t-2 border-gray-300 relative">
            <div className="absolute right-0 -top-1.5 w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-gray-300"></div>
          </div>
          <span className="text-xs text-gray-400 mt-1">{connector.context}</span>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center w-24">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
            {connector.user.name.split(' ')[0][0]}{connector.user.name.split(' ').pop()[0]}
          </div>
          <span className="text-sm font-medium text-gray-900 mt-1 text-center">
            {connector.user.name.split(' ')[0]}
          </span>
          <span className="text-xs text-gray-500 text-center">{connector.user.major}</span>
        </div>

        {/* Arrow 2 */}
        <div className="flex-1 flex flex-col items-center px-2">
          <div className="w-full border-t-2 border-gray-300 relative">
            <div className="absolute right-0 -top-1.5 w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-gray-300"></div>
          </div>
          <span className="text-xs text-gray-400 mt-1">{target.context}</span>
        </div>

        {/* Target */}
        <div className="flex flex-col items-center w-24">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
            {target.user.name.split(' ')[0][0]}{target.user.name.split(' ').pop()[0]}
          </div>
          <span className="text-sm font-medium text-gray-900 mt-1 text-center">
            {target.user.name.split(' ')[0]}
          </span>
          <span className="text-xs text-gray-500 text-center">{target.user.major}</span>
        </div>
      </div>

      {/* Warmth indicators */}
      <div className="flex gap-4 text-xs mb-4">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          <span className="text-gray-600">You & {connector.user.name.split(' ')[0]}: {connector.warmth}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          <span className="text-gray-600">{connector.user.name.split(' ')[0]} & {target.user.name.split(' ')[0]}: {target.warmth}</span>
        </div>
      </div>

      {/* Connector availability */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {connector.openToIntros ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm text-gray-600">Open to making intros</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              <span className="text-sm text-gray-500">Not available for intros</span>
            </>
          )}
        </div>

        <button
          onClick={onRequestIntro}
          disabled={!connector.openToIntros}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            connector.openToIntros
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Request Intro
        </button>
      </div>
    </div>
  );
}
