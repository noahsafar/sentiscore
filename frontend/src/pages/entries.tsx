import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import EntryCard from '@/components/EntryCard';
import { useAppContext, appActions } from '@/store/AppContext';
import { Entry } from '@/types';
import { CalendarIcon, MagnifyingGlassIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

export default function Entries() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Use AppContext entries as source of truth
  const entries = state.entries || [];

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/entries');
      const { data } = await response.json();
      const fetchedEntries = data.entries || [];

      // Update global AppContext with fresh data
      dispatch(appActions.setEntries(fetchedEntries));
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.transcript.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate ? new Date(entry.date).toDateString() === new Date(filterDate).toDateString() : true;
    return matchesSearch && matchesDate;
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Journal Entries
            </h1>
            <button
              onClick={() => router.push('/check-in')}
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              <MicrophoneIcon className="h-4 w-4 mr-2" />
              New Entry
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No entries found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterDate
                ? 'Try adjusting your search or filter criteria'
                : 'Start by recording your first entry'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={(entry) => router.push(`/entries/${entry.id}/edit`)}
                onDelete={async (entryId) => {
                  if (confirm('Are you sure you want to delete this entry?')) {
                    await fetch(`http://localhost:8000/api/entries/${entryId}`, { method: 'DELETE' });
                    await loadEntries();
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}