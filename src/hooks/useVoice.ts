import { useState, useCallback, useRef, useEffect } from 'react';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const onResultRef = useRef<((text: string) => void) | null>(null);
  const shouldRestartRef = useRef(false);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const createRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let newFinalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript + ' ';
        } else {
          interimTranscript = transcript;
        }
      }

      if (newFinalTranscript) {
        finalTranscriptRef.current += newFinalTranscript;
      }

      // Send the accumulated final transcript + current interim to the callback
      const fullText = (finalTranscriptRef.current + interimTranscript).trim();
      if (onResultRef.current && fullText) {
        onResultRef.current(fullText);
      }
    };

    recognition.onend = () => {
      // Auto-restart if we should still be listening (browser stops after silence)
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.warn('Could not restart recognition:', e);
          setIsListening(false);
          shouldRestartRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'aborted') return; // Intentional stop
      if (event.error === 'no-speech') {
        // No speech detected; if we should keep listening, it'll auto-restart via onend
        return;
      }
      // For other errors, stop listening
      shouldRestartRef.current = false;
      setIsListening(false);
    };

    return recognition;
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthesisRef.current) return;
    
    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to pick a good English voice
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female'))
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  }, []);

  const listen = useCallback((onResult: (text: string) => void, initialText: string = '') => {
    // Store the callback
    onResultRef.current = onResult;
    // Keep whatever the user already typed or spoke so it doesn't get erased
    finalTranscriptRef.current = initialText ? initialText + (initialText.endsWith(' ') ? '' : ' ') : '';
    shouldRestartRef.current = true;

    // Clean up any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const recognition = createRecognition();
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setIsListening(false);
    }
  }, [createRecognition]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    finalTranscriptRef.current = '';
    onResultRef.current = null;
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    speak,
    listen,
    stopListening,
    stopSpeaking
  };
}
