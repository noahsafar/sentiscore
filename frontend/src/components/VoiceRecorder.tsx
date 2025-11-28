import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAppContext, appActions } from '@/store/AppContext';
import { formatDuration } from '@/utils/helpers';

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  // Speech recognition setup (English only)
  const recognitionRef = useRef<any>(null);
  const interimTranscriptRef = useRef<string>('');

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

      // Store volume data
      volumeDataRef.current.push(averageVolume);
      if (volumeDataRef.current.length > 100) {
        volumeDataRef.current.shift();
      }

      animationFrameRef.current = requestAnimationFrame(extractVoiceFeatures);
    }
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    if (disabled) return;

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
      toast.error('Audio recording is not supported in this browser.');
      return;
    }

    // Request microphone access
    const stream = await getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    });

    streamRef.current = stream;

    // Validate that we actually got audio tracks
    if (stream.getAudioTracks().length === 0) {
      toast.error('No audio tracks found in microphone stream.');
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      return;
    }

    console.log('🎤 Microphone access granted, recording audio...');

    // Setup audio recording and voice analysis
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Higher resolution for better pitch detection
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

        // Note: Speaking rate and pauses will be calculated by AI after transcription
        const energy = avgVolume / 255;

        return {
          averagePitch: Math.round(averagePitch),
          pitchVariation: Math.round(pitchVariation),
          volumeVariation: Math.round(volumeVariation),
          speakingRate: 0, // Will be calculated by AI
          pauses: 0, // Will be calculated by AI after transcription
          energy: Math.round(energy * 100) / 100
        };
      };

      const voiceFeatures = calculateVoiceFeatures();
      console.log('🎤 Voice features extracted:', voiceFeatures);

      // Get the real transcript from speech recognition
      const realTranscript = interimTranscriptRef.current.trim();
      console.log('🎤 Real transcript from speech recognition:', realTranscript);

      // Send audio blob and real transcript to parent
      console.log('🎤 Sending audio and real transcript to parent...');
      onRecordingComplete(audioBlob, realTranscript, voiceFeatures);

      // Reset state AFTER sending to parent
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setAudioLevel(0);

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
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

    // Initialize speech recognition (English only)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US'; // Force English
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          interimTranscriptRef.current += finalTranscript;
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied. Please allow microphone access.');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    }

    // Start recording
    mediaRecorder.start(100);
    setIsRecording(true);
    dispatch(appActions.setRecordingState('recording'));
    extractVoiceFeatures();

    const message = hasEntryToday
      ? 'Recording replacement entry... Speak now!'
      : 'Recording your thoughts... Speak now!';

    toast.success(message, { duration: 3000 });
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setAudioLevel(0);
      audioChunksRef.current = [];

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        streamRef.current = null;
      }

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      // Clear transcript
      interimTranscriptRef.current = '';

      dispatch(appActions.setRecordingState('idle'));
      toast.error('Recording cancelled');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
        disabled={disabled}
        className={`relative w-24 h-24 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
          disabled
            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            : isRecording
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 animate-pulse'
              : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl'
        }`}
      >
        <div className="flex items-center justify-center h-full">
          {isRecording ? (
            isPaused ? (
              <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            ) : (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
              </div>
            )
          ) : (
            <MicrophoneIcon className="h-10 w-10 text-white" />
          )}
        </div>
      </button>

      <div className="mt-4 text-center">
        <h3 className={`text-base font-semibold mb-1 ${
          isRecording ? 'text-red-600' : 'text-gray-900 dark:text-white'
        }`}>
          {isRecording
            ? isPaused
              ? 'Paused - Tap to Resume'
              : 'Recording... Tap to Pause'
            : hasEntryToday
              ? 'Record Another Entry'
              : 'Tap to Record'
          }
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isRecording
            ? 'Speak naturally into your device'
            : 'Share how you\'re feeling today'
          }
        </p>
      </div>

      {/* Timer */}
      {(isRecording || duration > 0) && (
        <div className="mt-2 text-center">
          <div className="text-2xl font-mono text-gray-900 dark:text-white">
            {formatDuration(duration)}
          </div>
        </div>
      )}

      {/* Stop Button */}
      {isRecording && (
        <div className="mt-4">
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium transition-colors"
          >
            <div className="flex items-center space-x-2">
              <StopIcon className="h-4 w-4" />
              <span>Stop</span>
            </div>
          </button>
        </div>
      )}

      {/* Cancel Button */}
      {isRecording && (
        <div className="mt-2">
          <button
            onClick={cancelRecording}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Cancel recording
          </button>
        </div>
      )}
    </div>
  );
}