import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Globe, Loader2, AlertCircle } from 'lucide-react';

export const VoiceInput = ({ onTranscriptionChange, initialText = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-IN'); // en-IN, te-IN, hi-IN
  const [transcript, setTranscript] = useState(initialText);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser Web Speech API is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Web Speech API is not supported on this browser. Please type your complaint.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLang;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript + ' ';
      }
      setTranscript(currentTranscript.trim());
      if (onTranscriptionChange) {
        onTranscriptionChange(currentTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access or type manually.');
      } else {
        setError(`Voice error: ${event.error}. You can still type below.`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [selectedLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition unavailable on this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleManualEdit = (e) => {
    const val = e.target.value;
    setTranscript(val);
    if (onTranscriptionChange) {
      onTranscriptionChange(val);
    }
  };

  return (
    <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-civic-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Spoken Language:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isListening}
            className="bg-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-700 focus:ring-1 focus:ring-civic-500 outline-none"
          >
            <option value="en-IN">English (India)</option>
            <option value="te-IN">తెలుగు (Telugu)</option>
            <option value="hi-IN">हिन्दी (Hindi)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={toggleListening}
          className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-900/40'
              : 'bg-civic-600 hover:bg-civic-500 text-white shadow-lg shadow-civic-900/30'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Tap to Speak ({selectedLang.split('-')[0].toUpperCase()})</span>
            </>
          )}
        </button>
      </div>

      {isListening && (
        <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-900/50">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Listening to your voice... Speak clearly into your microphone.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-xs text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-900/50">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Transcription / Complaint Description (Voice or Editable Text):
        </label>
        <textarea
          rows={4}
          value={transcript}
          onChange={handleManualEdit}
          placeholder="Describe your civic issue here in English, Telugu, or Hindi, or click 'Tap to Speak' above..."
          className="w-full bg-slate-950 text-slate-100 rounded-lg p-3 text-sm border border-slate-800 focus:border-civic-500 focus:ring-1 focus:ring-civic-500 outline-none transition"
        />
      </div>
    </div>
  );
};
