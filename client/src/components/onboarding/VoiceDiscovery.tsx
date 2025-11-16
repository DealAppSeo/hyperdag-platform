import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '../../hooks/useVoice';

interface VoiceDiscoveryProps {
  onComplete: (data: any) => void;
}

interface DiscoveryPrompt {
  id: string;
  question: string;
  voicePrompt: string;
  followUp?: string;
}

const discoveryPrompts: DiscoveryPrompt[] = [
  {
    id: 'passion',
    question: 'What are you passionate about?',
    voicePrompt: 'Tell me about the things that truly excite you. What could you talk about for hours?',
    followUp: 'What specifically draws you to this?'
  },
  {
    id: 'problems',
    question: 'What problems in the world concern you most?',
    voicePrompt: 'When you look at the world around you, what issues make your heart heavy? What would you change if you could?',
    followUp: 'How do you think this problem affects people?'
  },
  {
    id: 'skills',
    question: 'What are you naturally good at?',
    voicePrompt: 'What comes easily to you? What do friends and family often ask for your help with?',
    followUp: 'Can you give me a specific example?'
  },
  {
    id: 'impact',
    question: 'How do you want to make a difference?',
    voicePrompt: 'Imagine you could solve one problem or help one group of people. What would that look like?',
    followUp: 'What would success mean to you?'
  }
];

export function VoiceDiscovery({ onComplete }: VoiceDiscoveryProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isListening, setIsListening] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  
  const { 
    startListening, 
    stopListening, 
    transcript, 
    isSupported,
    isListening: voiceIsListening,
    speak,
    error
  } = useVoice();

  // Update current response when transcript changes
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setCurrentResponse(transcript);
      setIsListening(false);
    }
  }, [transcript]);

  const currentPrompt = discoveryPrompts[currentPromptIndex];

  useEffect(() => {
    // Auto-speak the current prompt when component mounts or prompt changes
    if (isSupported && currentPrompt) {
      const timer = setTimeout(() => {
        speak(currentPrompt.voicePrompt);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPromptIndex, speak, isSupported, currentPrompt]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      setCurrentResponse('');
      startListening();
      setIsListening(true);
    }
  };

  const handleTextSubmit = () => {
    if (currentResponse.trim()) {
      const newResponses = {
        ...responses,
        [currentPrompt.id]: currentResponse.trim()
      };
      setResponses(newResponses);
      
      if (!showFollowUp && currentPrompt.followUp) {
        setShowFollowUp(true);
        speak(currentPrompt.followUp);
        setCurrentResponse('');
      } else {
        moveToNextPrompt(newResponses);
      }
    }
  };

  const moveToNextPrompt = (updatedResponses: Record<string, string>) => {
    if (currentPromptIndex < discoveryPrompts.length - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1);
      setCurrentResponse('');
      setShowFollowUp(false);
    } else {
      // All prompts completed
      onComplete({
        interests: Object.values(updatedResponses).filter(r => r.trim()),
        skills: [],
        values: [],
        voiceDiscovery: {
          responses: updatedResponses,
          completedPrompts: discoveryPrompts.length,
          usedVoice: Object.keys(updatedResponses).some(key => updatedResponses[key])
        }
      });
    }
  };

  const skipPrompt = () => {
    moveToNextPrompt(responses);
  };

  const progress = ((currentPromptIndex + 1) / discoveryPrompts.length) * 100;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      {/* Progress indicator */}
      <motion.div
        style={{
          width: '100%',
          maxWidth: '600px',
          marginBottom: '3rem'
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
            Discovery Progress
          </span>
          <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
            {currentPromptIndex + 1}/{discoveryPrompts.length}
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(45deg, #8b5cf6, #a78bfa)',
              borderRadius: '2px'
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Main question area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentPromptIndex}-${showFollowUp}`}
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5 }}
        >
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '300',
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #ffffff, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {showFollowUp ? 'Tell me more...' : currentPrompt.question}
          </h2>
          
          <p style={{
            fontSize: '1.1rem',
            opacity: 0.8,
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {showFollowUp ? currentPrompt.followUp : currentPrompt.voicePrompt}
          </p>
          
          {speaking && (
            <motion.div
              style={{
                marginTop: '1rem',
                fontSize: '0.9rem',
                opacity: 0.6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span>🔊</span>
              Speaking...
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Response area */}
      <motion.div
        style={{
          width: '100%',
          maxWidth: '600px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '1rem',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Voice controls */}
        {isSupported && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            <motion.button
              onClick={handleVoiceToggle}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: isListening 
                  ? 'linear-gradient(45deg, #ef4444, #f87171)' 
                  : 'linear-gradient(45deg, #8b5cf6, #a78bfa)',
                border: 'none',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 0 20px rgba(139, 92, 246, 0.3)'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={isListening ? { scale: [1, 1.1, 1] } : {}}
              transition={isListening ? { duration: 1, repeat: Infinity } : {}}
            >
              {isListening ? '⏹️' : '🎤'}
            </motion.button>
          </div>
        )}

        {isListening && (
          <motion.div
            style={{
              textAlign: 'center',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              opacity: 0.8
            }}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            Listening... speak naturally
          </motion.div>
        )}

        {/* Text input */}
        <textarea
          value={currentResponse}
          onChange={(e) => setCurrentResponse(e.target.value)}
          placeholder={isSupported ? "Speak or type your response..." : "Share your thoughts..."}
          style={{
            width: '100%',
            minHeight: '120px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.75rem',
            padding: '1rem',
            color: 'white',
            fontSize: '1rem',
            lineHeight: '1.6',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem'
        }}>
          <motion.button
            onClick={skipPrompt}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.7)',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
            whileHover={{ opacity: 1, background: 'rgba(255, 255, 255, 0.05)' }}
            whileTap={{ scale: 0.95 }}
          >
            Skip
          </motion.button>

          <motion.button
            onClick={handleTextSubmit}
            disabled={!currentResponse.trim()}
            style={{
              background: currentResponse.trim() 
                ? 'linear-gradient(45deg, #8b5cf6, #a78bfa)'
                : 'rgba(139, 92, 246, 0.3)',
              border: 'none',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              cursor: currentResponse.trim() ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
            whileHover={currentResponse.trim() ? { 
              scale: 1.05,
              boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)'
            } : {}}
            whileTap={currentResponse.trim() ? { scale: 0.95 } : {}}
          >
            {showFollowUp ? 'Continue' : 'Next Question'}
          </motion.button>
        </div>
      </motion.div>

      {/* Live transcript indicator */}
      {transcript && transcript !== currentResponse && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '0.75rem 1.5rem',
            borderRadius: '2rem',
            fontSize: '0.9rem',
            opacity: 0.9,
            maxWidth: '600px',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.9, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          🎤 {transcript}
        </motion.div>
      )}
    </div>
  );
}