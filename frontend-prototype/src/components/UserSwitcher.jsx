import { useUser } from '../context/UserContext';

export default function UserSwitcher() {
  const { currentUser, setCurrentUser, allUsers } = useUser();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Viewing as:</span>
      <select
        value={currentUser.id}
        onChange={(e) => {
          const user = allUsers.find(u => u.id === parseInt(e.target.value));
          if (user) setCurrentUser(user);
        }}
        className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {allUsers.map(user => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </div>
  );
}
