import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import VoiceRecorder from '@/components/VoiceRecorder';
import { useAppContext, appActions } from '@/store/AppContext';
import { MicrophoneIcon, FaceSmileIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { saveOrReplaceTodayEntry, findTodayEntry } from '@/utils/entryHelpers';

export default function CheckIn() {
  const { state, dispatch } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [moodScores, setMoodScores] = useState<any>(null);

  // Use AppContext entries as source of truth
  const entries = state.entries || [];
  const hasEntryToday = findTodayEntry(entries) !== null;

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/entries');
      const { data } = await response.json();
      const fetchedEntries = data.entries || [];

      // Update global AppContext with fresh data
      dispatch(appActions.setEntries(fetchedEntries));
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const handleRecordingComplete = async (recording: Blob, transcript: string) => {
    try {
      setIsProcessing(true);
      setTranscript(transcript);

      // For now, skip the analysis and go straight to saving
      // In a real implementation, you'd call the analysis API here
      const mockMoodScores = {
        stress: Math.random() * 10,
        happiness: Math.random() * 10,
        clarity: Math.random() * 10,
        energy: Math.random() * 10,
        emotionalStability: Math.random() * 10,
        overall: Math.random() * 10,
      };

      setMoodScores(mockMoodScores);

      // Use centralized function to enforce one-entry-per-day rule
      const result = await saveOrReplaceTodayEntry(
        entries,
        transcript,
        recording,
        {
          moodScores: mockMoodScores,
          insights: [], // Add insights later if needed
        }
      );

      // Update global AppContext entries list
      if (result.wasReplaced) {
        dispatch(appActions.updateEntry(result.entry));
        toast.success('Today\'s check-in has been replaced!');
      } else {
        dispatch(appActions.addEntry(result.entry));
        toast.success('Check-in saved successfully!');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCheckIn = () => {
    setTranscript('');
    setMoodScores(null);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Voice Check-in
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Take a moment to reflect on how you're feeling
          </p>
          {hasEntryToday && (
            <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-full">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Check-in complete for today</span>
            </div>
          )}
        </div>

        {!transcript ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
                <MicrophoneIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {hasEntryToday ? 'Replace Today\'s Check-in' : 'Start Recording'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click the microphone button and speak freely about your day, feelings, or thoughts
              </p>
            </div>

            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              hasEntryToday={hasEntryToday}
            />

            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              <p>💡 Tips:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Speak clearly and naturally</li>
                <li>Find a quiet environment</li>
                <li>Take your time - there's no rush</li>
                <li>Be honest about your feelings</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Transcript Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Reflection
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {transcript}
              </p>
            </div>

            {/* Mood Scores */}
            {moodScores && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Mood Analysis
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Stress</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {moodScores.stress}/10
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Happiness</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {moodScores.happiness}/10
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clarity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {moodScores.clarity}/10
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Energy</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {moodScores.energy}/10
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Stability</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {moodScores.emotionalStability}/10
                    </p>
                  </div>
                  <div className="text-center p-3 bg-primary-50 dark:bg-primary-900 rounded-lg">
                    <p className="text-sm text-primary-600 dark:text-primary-400">Overall</p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {moodScores.overall}/10
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Analyzing your recording...
                </p>
              </div>
            )}

            {/* Action Button */}
            {!isProcessing && moodScores && (
              <div className="text-center">
                <button
                  onClick={resetCheckIn}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <FaceSmileIcon className="h-5 w-5 mr-2" />
                  New Check-in
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}