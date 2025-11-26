import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAppContext, appActions } from '@/store/AppContext';
import { formatDuration } from '@/utils/helpers';
import { apiClient } from '@/utils/api';

interface VoiceRecorderProps {
  onRecordingComplete: (recording: Blob, transcript: string) => void;
  maxDuration?: number; // seconds
  disabled?: boolean;
}

export default function VoiceRecorder({
  onRecordingComplete,
  maxDuration = 300, // 5 minutes default
  disabled = false
}: VoiceRecorderProps) {
  const { state, dispatch } = useAppContext();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Update timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused, maxDuration]);

  // Monitor audio level
  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current && isRecording && !isPaused) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      setAudioLevel(average / 255);

      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    if (disabled) return;

    // Debug logging
    console.log('=== Microphone Debug Info ===');
    console.log('navigator:', typeof navigator);
    console.log('navigator.mediaDevices:', navigator.mediaDevices);
    console.log('navigator.mediaDevices?.getUserMedia:', navigator.mediaDevices?.getUserMedia);
    console.log('isSecureContext:', window.isSecureContext);
    console.log('location.protocol:', window.location.protocol);
    console.log('location.hostname:', window.location.hostname);
    console.log('User Agent:', navigator.userAgent);
    console.log('==========================');

    // Safari compatibility fix
    let getUserMedia = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    } else if ((navigator as any).getUserMedia) {
      // Older Safari
      console.log('Using legacy getUserMedia for Safari');
      getUserMedia = (navigator as any).getUserMedia.bind(navigator);
    } else if ((navigator as any).webkitGetUserMedia) {
      // Even older Safari
      console.log('Using webkitGetUserMedia for Safari');
      getUserMedia = (navigator as any).webkitGetUserMedia.bind(navigator);
    }

    if (!getUserMedia) {
      toast.error('Microphone API not supported in this browser. Try Chrome or Firefox.');
      console.error('No getUserMedia implementation found');
      return;
    }

    console.log('Starting to request microphone access...');

    try {
      // Request microphone access with simpler constraints
      const stream = await getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      // Create audio context for level monitoring
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Initialize media recorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Reset state
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        setAudioLevel(0);

        // Stop all tracks
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        streamRef.current = null;
        analyserRef.current = null;

        // Close audio context
        await audioContext.close();

        // Transcribe the audio
        dispatch(appActions.setRecordingState('processing'));
        await transcribeAudio(audioBlob);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      dispatch(appActions.setRecordingState('recording'));

      // Start monitoring audio level
      updateAudioLevel();

      toast.success('Recording started... Speak now!', {
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to start recording:', error);

      let errorMessage = 'Failed to access microphone. Please check your permissions.';

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is already in use by another application.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Microphone is not supported by your browser.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      toast.error(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      updateAudioLevel();
    }
  };

  const cancelRecording = () => {
    stopRecording();
    audioChunksRef.current = [];

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    dispatch(appActions.setRecordingState('idle'));
    toast('Recording cancelled', {
      icon: '🚫',
    });
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Use apiClient to send audio to backend for transcription
      const response = await apiClient.transcribeAudio(audioBlob);
      const transcript = response.data.text || 'Transcription not available';

      onRecordingComplete(audioBlob, transcript);
      toast.success('Transcription complete!', {
        duration: 3000,
      });
    } catch (error) {
      console.error('Transcription error:', error);

      // Always try to get the transcribed text, even if there's an error
      const manualText = prompt(
        'Automatic transcription failed. Please enter your journal entry manually:',
        ''
      );

      if (manualText) {
        onRecordingComplete(audioBlob, manualText);
      } else {
        // If user cancels, still save with a generic message
        onRecordingComplete(audioBlob, "Voice recording saved");
        toast.success('Recording saved successfully');
      }
    } finally {
      dispatch(appActions.setRecordingState('idle'));
    }
  };

  // Calculate visual representation of audio level
  const visualHeight = Math.max(20, audioLevel * 100);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={disabled || state.recordingState === 'processing'}
          className="
            w-full py-6 px-8 rounded-2xl border-2 border-dashed
            border-primary-300 dark:border-primary-600
            hover:border-primary-400 dark:hover:border-primary-500
            hover:bg-primary-50 dark:hover:bg-primary-900/20
            transition-all duration-200 group
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="
              p-4 rounded-full bg-primary-100 dark:bg-primary-900/50
              group-hover:bg-primary-200 dark:group-hover:bg-primary-900/70
              transition-colors duration-200
            ">
              <MicrophoneIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {state.recordingState === 'processing'
                  ? 'Processing...'
                  : 'Tap to start recording'
                }
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Speak freely for up to {formatDuration(maxDuration)}
              </p>
            </div>
          </div>
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {isPaused ? 'Recording Paused' : 'Recording...'}
            </h3>
            <span className="text-2xl font-mono text-primary-600 dark:text-primary-400">
              {formatDuration(duration)}
            </span>
          </div>

          {/* Audio Level Visualization */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary-400 rounded-full transition-all duration-100"
                style={{
                  height: isPaused ? '4px' : `${i < audioLevel * 20 ? visualHeight : 4}px`,
                  opacity: isPaused ? 0.3 : i < audioLevel * 20 ? 1 : 0.3,
                }}
              />
            ))}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            {!isPaused ? (
              <>
                <button
                  onClick={pauseRecording}
                  className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200 dark:hover:bg-yellow-900/70 transition-colors"
                  title="Pause"
                >
                  <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                <button
                  onClick={stopRecording}
                  className="p-4 rounded-full bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
                  title="Stop"
                >
                  <StopIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                </button>

                <button
                  onClick={cancelRecording}
                  className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Cancel"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={resumeRecording}
                  className="p-3 rounded-full bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900/70 transition-colors"
                  title="Resume"
                >
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                <button
                  onClick={cancelRecording}
                  className="p-4 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Cancel"
                >
                  <XMarkIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                </button>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round((duration / maxDuration) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(duration / maxDuration) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}