import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './onboarding.css';

type OnboardingPhase = 'void' | 'voice' | 'purpose' | 'complete';

interface OnboardingFlowProps {
  onComplete: (userData: any) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [phase, setPhase] = useState<OnboardingPhase>('void');
  const [userData, setUserData] = useState({
    name: '',
    interests: [],
    skills: [],
    values: [],
    purpose: null
  });

  const handlePhaseComplete = (phaseData: any) => {
    const newUserData = { ...userData, ...phaseData };
    setUserData(newUserData);
    
    switch (phase) {
      case 'void':
        setTimeout(() => setPhase('voice'), 500);
        break;
      case 'voice':
        setTimeout(() => setPhase('purpose'), 500);
        break;
      case 'purpose':
        setTimeout(() => setPhase('complete'), 500);
        onComplete(newUserData);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'void' && (
          <VoidExperience key="void" onComplete={handlePhaseComplete} />
        )}
        {phase === 'voice' && (
          <VoiceDiscovery key="voice" onComplete={handlePhaseComplete} />
        )}
        {phase === 'purpose' && (
          <PurposeMapping key="purpose" userData={userData} onComplete={handlePhaseComplete} />
        )}
        {phase === 'complete' && (
          <CompletionView key="complete" userData={userData} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Void Experience - The magical black screen opening
function VoidExperience({ onComplete }: { onComplete: (data: any) => void }) {
  const [showMessage, setShowMessage] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowMessage(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center min-h-screen bg-black"
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-4 h-4 bg-blue-400 rounded-full mx-auto mb-8"
        />
        
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-xl text-gray-300">
              The future of work is changing...
            </p>
            <p className="text-2xl text-white">
              What if you could shape it?
            </p>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              onClick={() => onComplete({ started: true })}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-semibold hover:scale-105 transition-transform"
            >
              Discover Your Purpose ✨
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Voice Discovery - The conversational phase
function VoiceDiscovery({ onComplete }: { onComplete: (data: any) => void }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startVoiceDiscovery = () => {
    // Voice logic here - for now, simulate
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      onComplete({ 
        interests: ['helping others', 'technology'],
        skills: ['communication', 'problem-solving'],
        values: ['making a difference', 'innovation']
      });
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900"
    >
      <div className="text-center max-w-2xl px-6">
        <h2 className="text-3xl font-bold mb-8">Let's discover your unique calling</h2>
        
        {!isListening && !transcript && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={startVoiceDiscovery}
            className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl hover:scale-110 transition-transform mx-auto"
          >
            🎤
          </motion.button>
        )}

        {isListening && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-32 h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto"
          >
            <span className="text-2xl">👂</span>
          </motion.div>
        )}

        <p className="text-lg text-gray-300 mt-8">
          {isListening ? 'I\'m listening... tell me what makes you feel alive' : 'Click to start our conversation'}
        </p>
      </div>
    </motion.div>
  );
}

// Purpose Mapping - The revelation phase  
function PurposeMapping({ userData, onComplete }: { userData: any, onComplete: (data: any) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-800 to-blue-900"
    >
      <div className="text-center max-w-4xl px-6">
        <h2 className="text-4xl font-bold mb-12">Your Purpose Revealed</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-red-500/20 rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold mb-2">❤️ What You Love</h3>
            <p>Helping others, Technology</p>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-blue-500/20 rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold mb-2">💪 What You're Good At</h3>
            <p>Communication, Problem-solving</p>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-green-500/20 rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold mb-2">🌍 What World Needs</h3>
            <p>Better technology for good</p>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="bg-yellow-500/20 rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold mb-2">💰 What You Can Be Paid For</h3>
            <p>Purpose-driven development</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-8 mb-8"
        >
          <h3 className="text-2xl font-bold mb-4">Your Calling</h3>
          <p className="text-xl">
            "Building technology solutions that empower people to discover and pursue their purpose"
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          onClick={() => onComplete({ purpose: 'tech-for-good', ready: true })}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-full text-xl font-semibold hover:scale-105 transition-transform"
        >
          Show Me My Opportunities 🚀
        </motion.button>
      </div>
    </motion.div>
  );
}

// Completion View
function CompletionView({ userData }: { userData: any }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-blue-900"
    >
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-8">Welcome to PurposeHub! 🎉</h2>
        <p className="text-xl mb-8">Your journey to purpose-driven success starts now.</p>
      </div>
    </motion.div>
  );
}