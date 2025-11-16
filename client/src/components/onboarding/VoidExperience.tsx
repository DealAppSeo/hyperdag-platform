import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VoidExperienceProps {
  onComplete: (data: any) => void;
}

export function VoidExperience({ onComplete }: VoidExperienceProps) {
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [intention, setIntention] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  useEffect(() => {
    // Check if voice is available
    const hasVoice = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsVoiceEnabled(hasVoice);
  }, []);

  useEffect(() => {
    const breathingCycle = () => {
      const phases = [
        { phase: 'inhale', duration: 4000 },
        { phase: 'hold', duration: 2000 },
        { phase: 'exhale', duration: 6000 },
        { phase: 'pause', duration: 1000 }
      ];
      
      let currentPhaseIndex = 0;
      let currentCycle = 0;
      
      const nextPhase = () => {
        const { phase, duration } = phases[currentPhaseIndex];
        setBreathingPhase(phase as any);
        
        if (phase === 'pause') {
          currentCycle++;
          setCycleCount(currentCycle);
          
          if (currentCycle >= 3) {
            setIsReady(true);
            return;
          }
        }
        
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        setTimeout(nextPhase, duration);
      };
      
      nextPhase();
    };
    
    const timer = setTimeout(breathingCycle, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Breathe in slowly...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Release everything...';
      case 'pause': return 'Rest in the void...';
      default: return '';
    }
  };

  const getCircleScale = () => {
    switch (breathingPhase) {
      case 'inhale': return 1.4;
      case 'hold': return 1.4;
      case 'exhale': return 0.8;
      case 'pause': return 1.0;
      default: return 1.0;
    }
  };

  const handleIntentionSubmit = () => {
    onComplete({ 
      voidExperience: {
        completedBreathing: true,
        cyclesCompleted: cycleCount,
        intention: intention.trim()
      }
    });
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      position: 'relative'
    }}>
      {/* Background void effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at center, rgba(15, 15, 35, 0.3) 0%, rgba(0, 0, 0, 0.9) 70%)',
        zIndex: -1
      }} />

      {/* Breathing circle */}
      <motion.div
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.3), rgba(167, 139, 250, 0.1))',
          border: '2px solid rgba(139, 92, 246, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '3rem',
          backdropFilter: 'blur(10px)'
        }}
        animate={{
          scale: getCircleScale(),
          opacity: breathingPhase === 'pause' ? 0.5 : 1
        }}
        transition={{
          duration: breathingPhase === 'inhale' ? 4 : 
                   breathingPhase === 'hold' ? 0.1 :
                   breathingPhase === 'exhale' ? 6 : 1,
          ease: 'easeInOut'
        }}
      >
        <div style={{
          fontSize: '1.2rem',
          fontWeight: '300',
          opacity: 0.9
        }}>
          {!isReady ? getBreathingInstruction() : 'Ready'}
        </div>
      </motion.div>

      {/* Title and description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ marginBottom: '2rem', maxWidth: '600px' }}
      >
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '300',
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #ffffff, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Enter the Void
        </h1>
        <p style={{
          fontSize: '1.1rem',
          opacity: 0.8,
          lineHeight: '1.6',
          fontWeight: '300'
        }}>
          Before we discover your purpose, let go of expectations. 
          Breathe with the circle and find your center.
        </p>
      </motion.div>

      {/* Cycle counter */}
      {!isReady && (
        <motion.div
          style={{
            fontSize: '0.9rem',
            opacity: 0.6,
            marginBottom: '2rem'
          }}
          animate={{ opacity: cycleCount > 0 ? 0.6 : 0 }}
        >
          Breathing cycle {cycleCount} of 3
        </motion.div>
      )}

      {/* Intention input */}
      {isReady && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            maxWidth: '500px',
            width: '100%'
          }}
        >
          <div style={{
            marginBottom: '2rem',
            fontSize: '1.1rem',
            opacity: 0.9
          }}>
            What intention do you bring to this journey?
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Share what's in your heart... (optional)"
              style={{
                width: '100%',
                minHeight: '120px',
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1rem',
                lineHeight: '1.6',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            
            {isVoiceEnabled && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '0.5rem',
                border: '1px dashed rgba(139, 92, 246, 0.3)',
                fontSize: '0.9rem',
                textAlign: 'center',
                opacity: 0.8
              }}>
                🎤 Click the voice button to speak your intention
              </div>
            )}
          </div>
          
          <motion.button
            onClick={handleIntentionSubmit}
            style={{
              marginTop: '2rem',
              background: 'linear-gradient(45deg, #8b5cf6, #a78bfa)',
              border: 'none',
              color: 'white',
              padding: '1rem 2.5rem',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
            }}
            whileTap={{ scale: 0.95 }}
          >
            Begin Discovery
          </motion.button>
        </motion.div>
      )}

      {/* Ambient particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: -1
      }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              background: 'rgba(167, 139, 250, 0.4)',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>
    </div>
  );
}