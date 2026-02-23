import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categories } from '../data/mockData';
import ConnectorPrompt from '../components/ConnectorPrompt';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory) return;

    // Navigate to paths with selected intent
    navigate('/paths', {
      state: {
        category: selectedCategory,
        description: description.trim()
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <ConnectorPrompt />
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          What are you looking for help with right now?
        </h1>
        <p className="text-gray-600">
          Select a category and we'll show you paths to people who can help.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedCategory === cat.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className="text-2xl mr-3">{cat.icon}</span>
              <span className="text-lg font-medium text-gray-900">{cat.label}</span>
            </button>
          ))}
        </div>

        {selectedCategory && (
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Tell us more (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Looking for advice on consulting recruiting, specifically for sophomore internships..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedCategory}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
            selectedCategory
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Find paths
        </button>
      </form>
    </div>
  );
}
