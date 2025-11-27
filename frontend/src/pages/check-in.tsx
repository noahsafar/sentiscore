import { useState } from 'react';
import Layout from '@/components/Layout';
import VoiceRecorder from '@/components/VoiceRecorder';
import { useAppContext } from '@/store/AppContext';
import { MicrophoneIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CheckIn() {
  const { state } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [moodScores, setMoodScores] = useState<any>(null);

  const handleRecordingComplete = async (recording: Blob, transcript: string) => {
    try {
      setIsProcessing(true);
      setTranscript(transcript);

      // Send audio and transcript for analysis
      const formData = new FormData();
      formData.append('audio', recording);
      formData.append('transcript', transcript);

      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { data } = await response.json();
        setMoodScores(data.moodScores);

        // Save the entry
        await fetch('http://localhost:8000/api/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript,
            moodScores: data.moodScores,
            insights: data.insights,
          }),
        });

        toast.success('Check-in saved successfully!');
      } else {
        throw new Error('Failed to analyze recording');
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
          <p className="text-gray-600 dark:text-gray-400">
            Take a moment to reflect on how you're feeling
          </p>
        </div>

        {!transcript ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
                <MicrophoneIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Start Recording
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click the microphone button and speak freely about your day, feelings, or thoughts
              </p>
            </div>

            <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

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