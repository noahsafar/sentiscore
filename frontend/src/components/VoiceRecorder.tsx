import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAppContext, appActions } from '@/store/AppContext';
import { formatDuration } from '@/utils/helpers';
import { apiClient } from '@/utils/api';

interface VoiceFeatures {
  averagePitch: number;
  pitchVariation: number;
  volumeVariation: number;
  speakingRate: number;
  pauses: number;
  energy: number;
}

interface VoiceRecorderProps {
  onRecordingComplete: (recording: Blob, transcript: string, voiceFeatures?: VoiceFeatures) => void;
  maxDuration?: number; // seconds
  disabled?: boolean;
  hasEntryToday?: boolean;
  onReplaceTodayEntry?: () => void;
}

export default function VoiceRecorder({
  onRecordingComplete,
  maxDuration = 300, // 5 minutes default
  disabled = false,
  hasEntryToday = false,
  onReplaceTodayEntry
}: VoiceRecorderProps) {
  const { state, dispatch } = useAppContext();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>(''); // Store latest transcript

  // Voice analysis refs
  const voiceFeaturesRef = useRef<VoiceFeatures>({
    averagePitch: 0,
    pitchVariation: 0,
    volumeVariation: 0,
    speakingRate: 0,
    pauses: 0,
    energy: 0
  });
  const pitchDataRef = useRef<number[]>([]);
  const volumeDataRef = useRef<number[]>([]);
  const lastSpeechTimeRef = useRef<number>(0);

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

  // Extract voice features from audio
  const extractVoiceFeatures = useCallback(() => {
    if (analyserRef.current && isRecording && !isPaused) {
      const analyser = analyserRef.current;

      // Get frequency data for pitch analysis
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData);

      // Get time domain data for volume analysis
      const timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);

      // Calculate average volume
      const averageVolume = frequencyData.reduce((acc, val) => acc + val, 0) / frequencyData.length;
      setAudioLevel(averageVolume / 255);

      // Extract pitch using autocorrelation (simplified)
      const sampleRate = analyser.context.sampleRate;
      const bufferLength = analyser.fftSize;

      // Find fundamental frequency (pitch)
      let fundamentalFrequency = 0;
      const correlations = new Array(bufferLength).fill(0);

      for (let lag = 0; lag < bufferLength; lag++) {
        for (let i = 0; i < bufferLength - lag; i++) {
          correlations[lag] += (timeData[i] - 128) * (timeData[i + lag] - 128);
        }
      }

      let maxCorrelation = 0;
      for (let lag = 1; lag < bufferLength / 2; lag++) {
        if (correlations[lag] > maxCorrelation) {
          maxCorrelation = correlations[lag];
          fundamentalFrequency = sampleRate / lag;
        }
      }

      // Store pitch data (filter out unrealistic values)
      if (fundamentalFrequency > 50 && fundamentalFrequency < 500) {
        pitchDataRef.current.push(fundamentalFrequency);
        // Keep only last 100 samples
        if (pitchDataRef.current.length > 100) {
          pitchDataRef.current.shift();
        }
      }

      // Store volume data
      volumeDataRef.current.push(averageVolume);
      if (volumeDataRef.current.length > 100) {
        volumeDataRef.current.shift();
      }

      // Detect pauses (low volume periods)
      const now = Date.now();
      if (averageVolume > 10) {
        lastSpeechTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(extractVoiceFeatures);
    }
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    if (disabled) return;

    // Check for speech recognition support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser. Try Chrome or Edge.');
      return;
    }

    // Safari compatibility fix
    let getUserMedia = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    } else if ((navigator as any).getUserMedia) {
      getUserMedia = (navigator as any).getUserMedia.bind(navigator);
    } else if ((navigator as any).webkitGetUserMedia) {
      getUserMedia = (navigator as any).webkitGetUserMedia.bind(navigator);
    }

    if (!getUserMedia) {
      toast.error('Microphone API not supported in this browser. Try Chrome or Firefox.');
      return;
    }

    try {
      // Request microphone access
      const stream = await getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        console.log('🎤 Speech result:', { interimText, finalText });

        // Update both React state AND persistent ref
        setInterimTranscript(interimText);
        if (finalText) {
          setFinalTranscript(prev => {
            const newTranscript = prev + finalText;
            currentTranscriptRef.current = newTranscript; // Also update ref
            console.log('📝 Updated transcript ref:', newTranscript);
            return newTranscript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied for speech recognition.');
        } else {
          toast.error(`Speech recognition error: ${event.error}`);
        }
      };

      // Setup audio recording
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

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

        // Stop recognition to finalize any pending results
        recognition.stop();

        // Small delay to allow recognition to process final results
        await new Promise(resolve => setTimeout(resolve, 200));

        // Get final transcript from ref (most reliable)
        const finalText = currentTranscriptRef.current || finalTranscript || interimTranscript;
        console.log('🎤 Recording stopped. Final transcript:', finalText);
        console.log('🎤 Final transcript length:', finalText?.length || 0);
        console.log('📊 Ref transcript:', currentTranscriptRef.current);
        console.log('📊 React final transcript:', finalTranscript);
        console.log('📊 React interim transcript:', interimTranscript);

        // Validate transcript before saving
        if (!finalText || finalText.trim().length === 0) {
          toast.error('No speech detected. Please try again.');

          // Reset state AFTER validation
          setIsRecording(false);
          setIsPaused(false);
          setDuration(0);
          setAudioLevel(0);
          setInterimTranscript('');
          setFinalTranscript('');
          currentTranscriptRef.current = ''; // Clear the ref too

          // Stop all tracks and cleanup
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          streamRef.current = null;
          analyserRef.current = null;
          await audioContext.close();

          dispatch(appActions.setRecordingState('idle'));
          return;
        }

        // Stop all tracks and cleanup
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        streamRef.current = null;
        analyserRef.current = null;
        await audioContext.close();

        // Calculate voice features from collected data
        const calculateVoiceFeatures = (): VoiceFeatures => {
          const pitchData = pitchDataRef.current;
          const volumeData = volumeDataRef.current;

          // Calculate average pitch
          const averagePitch = pitchData.length > 0
            ? pitchData.reduce((a, b) => a + b, 0) / pitchData.length
            : 0;

          // Calculate pitch variation (standard deviation)
          const pitchVariance = pitchData.length > 0
            ? pitchData.reduce((sum, p) => sum + Math.pow(p - averagePitch, 2), 0) / pitchData.length
            : 0;
          const pitchVariation = Math.sqrt(pitchVariance);

          // Calculate volume variation
          const avgVolume = volumeData.length > 0
            ? volumeData.reduce((a, b) => a + b, 0) / volumeData.length
            : 0;
          const volumeVariance = volumeData.length > 0
            ? volumeData.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumeData.length
            : 0;
          const volumeVariation = Math.sqrt(volumeVariance);

          // Estimate speaking rate based on transcript length and recording duration
          const wordsPerMinute = duration > 0 ? (finalText.trim().split(' ').length / duration) * 60 : 0;

          // Count pauses (periods of silence)
          const estimatedPauses = finalText.split(/[.!?]+/).length - 1;

          // Calculate energy (normalized)
          const energy = avgVolume / 255;

          return {
            averagePitch: Math.round(averagePitch),
            pitchVariation: Math.round(pitchVariation),
            volumeVariation: Math.round(volumeVariation),
            speakingRate: Math.round(wordsPerMinute),
            pauses: Math.max(0, estimatedPauses),
            energy: Math.round(energy * 100) / 100
          };
        };

        const voiceFeatures = calculateVoiceFeatures();
        console.log('🎤 Voice features extracted:', voiceFeatures);

        // Complete with transcript and voice features BEFORE clearing states
        console.log('📝 Sending transcript to parent:', finalText.trim());
        onRecordingComplete(audioBlob, finalText.trim(), voiceFeatures);

        // Reset state AFTER sending to parent
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        setAudioLevel(0);
        setInterimTranscript('');
        setFinalTranscript('');
        currentTranscriptRef.current = ''; // Clear the ref too

        dispatch(appActions.setRecordingState('idle'));
        toast.success('Recording saved successfully!');
      };

      // Reset voice analysis data
      voiceFeaturesRef.current = {
        averagePitch: 0,
        pitchVariation: 0,
        volumeVariation: 0,
        speakingRate: 0,
        pauses: 0,
        energy: 0
      };
      pitchDataRef.current = [];
      volumeDataRef.current = [];
      lastSpeechTimeRef.current = Date.now();

      // Start both recording and recognition
      recognition.start();
      mediaRecorder.start(100);
      setIsRecording(true);
      dispatch(appActions.setRecordingState('recording'));
      extractVoiceFeatures();

      const message = 'Recording started... Speak now!';

      toast.success(message, { duration: 3000 });
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
      extractVoiceFeatures();
    }
  };

  const cancelRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    audioChunksRef.current = [];

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Reset transcript states
    setInterimTranscript('');
    setFinalTranscript('');
    currentTranscriptRef.current = '';

    dispatch(appActions.setRecordingState('idle'));
    toast('Recording cancelled', {
      icon: '🚫',
    });
  };

  // Calculate visual representation of audio level
  const visualHeight = Math.max(20, audioLevel * 100);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!isRecording ? (
        <div className="space-y-4">
          <button
            onClick={startRecording}
            disabled={disabled || state.recordingState === 'processing'}
            className="
              w-full py-6 px-16 rounded-2xl border-2 border-dashed
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
                    : hasEntryToday
                    ? 'Replace Today\'s Entry'
                    : 'Tap to start recording'
                  }
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Speak freely for up to {formatDuration(maxDuration)}
                </p>
              </div>
            </div>
          </button>
        </div>
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

          {/* Real-time Transcript */}
          {(finalTranscript || interimTranscript) && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Live Transcript:
              </div>
              <div className="text-gray-900 dark:text-white min-h-[60px]">
                <span className="font-medium">{finalTranscript}</span>
                <span className="text-gray-500 italic">{interimTranscript}</span>
              </div>
            </div>
          )}

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