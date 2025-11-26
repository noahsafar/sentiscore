import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import EntryCard from '@/components/EntryCard';
import { useAppContext } from '@/store/AppContext';
import { Entry } from '@/types';
import { MagnifyingGlassIcon, FaceFrownIcon } from '@heroicons/react/24/outline';

export default function Search() {
  const router = useRouter();
  const { q: initialQuery } = router.query;
  const [searchQuery, setSearchQuery] = useState((initialQuery as string) || '');
  const [results, setResults] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery as string);
    }
  }, [initialQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setSearched(true);

      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const { data } = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`, undefined, { shallow: true });
    performSearch(searchQuery);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Search Journal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find entries by keywords, dates, or mood patterns
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your journal entries..."
              className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Search Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : searched ? (
          <>
            {results.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-4">
                  {results.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      showFullTranscript={false}
                      onEdit={() => router.push(`/entries/${entry.id}/edit`)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FaceFrownIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No results found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Start searching
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter keywords to find relevant journal entries
            </p>
          </div>
        )}

        {/* Search Tips */}
        <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Search Tips
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>• Use keywords like "stress", "happy", "work", or "family"</li>
            <li>• Search for emotions: "anxious", "excited", "tired", "grateful"</li>
            <li>• Look for activities: "meeting", "exercise", "meditation"</li>
            <li>• Combine terms: "work stress" or "good day family"</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}