import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoidExperience } from './VoidExperience';
import { VoiceDiscovery } from './VoiceDiscovery';
import { PurposeMapping } from './PurposeMapping';

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
    setUserData(prev => ({ ...prev, ...phaseData }));
    
    switch (phase) {
      case 'void':
        setPhase('voice');
        break;
      case 'voice':
        setPhase('purpose');
        break;
      case 'purpose':
        setPhase('complete');
        onComplete({ ...userData, ...phaseData });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'void' && (
          <VoidExperience 
            key="void"
            onComplete={handlePhaseComplete}
          />
        )}
        {phase === 'voice' && (
          <VoiceDiscovery 
            key="voice"
            onComplete={handlePhaseComplete}
          />
        )}
        {phase === 'purpose' && (
          <PurposeMapping 
            key="purpose"
            userData={userData}
            onComplete={handlePhaseComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}