import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PurposeMappingProps {
  userData: any;
  onComplete: (data: any) => void;
}

interface PurposePathway {
  id: string;
  title: string;
  description: string;
  icon: string;
  matchScore: number;
  suggestedActions: string[];
  relatedOpportunities: string[];
}

export function PurposeMapping({ userData, onComplete }: PurposeMappingProps) {
  const [purposePathways, setPurposePathways] = useState<PurposePathway[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Simulate AI analysis of user responses
    analyzeUserResponses();
  }, []);

  const analyzeUserResponses = async () => {
    setIsAnalyzing(true);
    
    // Simulate API call to analyze user responses and generate purpose pathways
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const responses = userData?.voiceDiscovery?.responses || {};
    
    // Generate purpose pathways based on responses (simplified logic)
    const pathways: PurposePathway[] = [
      {
        id: 'social-entrepreneur',
        title: 'Social Entrepreneur',
        description: 'Create sustainable solutions to social problems through innovative business models.',
        icon: '🌍',
        matchScore: 92,
        suggestedActions: [
          'Join the Social Enterprise Network',
          'Apply for impact accelerator programs',
          'Connect with local nonprofit organizations',
          'Explore B-Corp certification process'
        ],
        relatedOpportunities: [
          'Ashoka Fellowship Program',
          'Echoing Green Fellowship',
          'Acumen Academy Courses',
          'Impact Investment Networks'
        ]
      },
      {
        id: 'tech-for-good',
        title: 'Technology for Good',
        description: 'Leverage technology skills to solve pressing social and environmental challenges.',
        icon: '💻',
        matchScore: 87,
        suggestedActions: [
          'Contribute to open-source projects',
          'Join hackathons for social good',
          'Build solutions for nonprofits',
          'Explore AI ethics initiatives'
        ],
        relatedOpportunities: [
          'Code for America Brigade',
          'TechSoup Volunteer Programs',
          'AI for Good Foundation',
          'Google.org Fellowship'
        ]
      },
      {
        id: 'community-organizer',
        title: 'Community Organizer',
        description: 'Mobilize people and resources to create positive change at the grassroots level.',
        icon: '👥',
        matchScore: 81,
        suggestedActions: [
          'Start a local advocacy group',
          'Organize community events',
          'Partner with existing organizations',
          'Learn about policy advocacy'
        ],
        relatedOpportunities: [
          'AmeriCorps VISTA',
          'Community Organizing Fellowship',
          'Local Government Positions',
          'Nonprofit Leadership Programs'
        ]
      },
      {
        id: 'educator-advocate',
        title: 'Educator & Advocate',
        description: 'Empower others through education and raise awareness about important causes.',
        icon: '📚',
        matchScore: 76,
        suggestedActions: [
          'Create educational content',
          'Speak at local events',
          'Mentor young changemakers',
          'Develop curriculum materials'
        ],
        relatedOpportunities: [
          'Teach for America',
          'Education Nonprofits',
          'TEDx Speaking',
          'Online Course Creation'
        ]
      }
    ];
    
    setPurposePathways(pathways.sort((a, b) => b.matchScore - a.matchScore));
    setIsAnalyzing(false);
  };

  const handlePathwaySelect = (pathwayId: string) => {
    setSelectedPathway(pathwayId);
    setShowDetails(true);
  };

  const handleComplete = () => {
    const selectedPathwayData = purposePathways.find(p => p.id === selectedPathway);
    
    onComplete({
      purpose: selectedPathwayData,
      purposeMapping: {
        selectedPathway: selectedPathwayData,
        allPathways: purposePathways,
        analysisComplete: true,
        confidence: selectedPathwayData?.matchScore || 0
      }
    });
  };

  if (isAnalyzing) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <motion.div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #8b5cf6, #a78bfa)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '2rem',
            fontSize: '3rem'
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1.5, repeat: Infinity }
          }}
        >
          🧠
        </motion.div>
        
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: '300',
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #ffffff, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Analyzing Your Purpose
        </h2>
        
        <p style={{
          fontSize: '1.1rem',
          opacity: 0.8,
          maxWidth: '500px',
          lineHeight: '1.6'
        }}>
          Our AI is processing your responses to map potential purpose pathways that align with your passions, skills, and values...
        </p>
        
        <motion.div
          style={{
            marginTop: '2rem',
            fontSize: '0.9rem',
            opacity: 0.6
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Powered by HyperDAG ANFIS AI
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <motion.div
        style={{ textAlign: 'center', marginBottom: '3rem' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: '300',
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #ffffff, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Your Purpose Pathways
        </h2>
        <p style={{
          fontSize: '1.1rem',
          opacity: 0.8,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Based on your responses, here are personalized pathways to meaningful impact
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showDetails ? (
          <motion.div
            key="pathways-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              width: '100%',
              maxWidth: '900px'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {purposePathways.map((pathway, index) => (
              <motion.div
                key={pathway.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: selectedPathway === pathway.id 
                    ? '2px solid rgba(139, 92, 246, 0.8)' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02,
                  border: '2px solid rgba(139, 92, 246, 0.5)'
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePathwaySelect(pathway.id)}
              >
                {/* Match score indicator */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'linear-gradient(45deg, #8b5cf6, #a78bfa)',
                  borderRadius: '1rem',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  {pathway.matchScore}% match
                </div>
                
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  {pathway.icon}
                </div>
                
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: 'white'
                }}>
                  {pathway.title}
                </h3>
                
                <p style={{
                  fontSize: '1rem',
                  opacity: 0.8,
                  lineHeight: '1.5',
                  marginBottom: '1.5rem'
                }}>
                  {pathway.description}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '0.9rem',
                    opacity: 0.7
                  }}>
                    {pathway.suggestedActions.length} suggested actions
                  </span>
                  
                  <motion.div
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem'
                    }}
                    whileHover={{ background: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    Explore →
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="pathway-details"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              padding: '2rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              width: '100%',
              maxWidth: '700px'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
          >
            {(() => {
              const pathway = purposePathways.find(p => p.id === selectedPathway);
              if (!pathway) return null;
              
              return (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '2rem'
                  }}>
                    <span style={{ fontSize: '3rem', marginRight: '1rem' }}>
                      {pathway.icon}
                    </span>
                    <div>
                      <h3 style={{
                        fontSize: '2rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        {pathway.title}
                      </h3>
                      <div style={{
                        background: 'linear-gradient(45deg, #8b5cf6, #a78bfa)',
                        borderRadius: '1rem',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        {pathway.matchScore}% match
                      </div>
                    </div>
                  </div>
                  
                  <p style={{
                    fontSize: '1.1rem',
                    opacity: 0.9,
                    lineHeight: '1.6',
                    marginBottom: '2rem'
                  }}>
                    {pathway.description}
                  </p>
                  
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}>
                      Suggested Next Steps
                    </h4>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      display: 'grid',
                      gap: '0.75rem'
                    }}>
                      {pathway.suggestedActions.map((action, index) => (
                        <li
                          key={index}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}
                        >
                          <span style={{
                            background: 'linear-gradient(45deg, #8b5cf6, #a78bfa)',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {index + 1}
                          </span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}>
                      Related Opportunities
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}>
                      {pathway.relatedOpportunities.map((opportunity, index) => (
                        <span
                          key={index}
                          style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            border: '1px solid rgba(139, 92, 246, 0.4)',
                            borderRadius: '1rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem'
                          }}
                        >
                          {opportunity}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <motion.button
                      onClick={() => setShowDetails(false)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                      whileHover={{ background: 'rgba(255, 255, 255, 0.05)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ← Back to Pathways
                    </motion.button>
                    
                    <motion.button
                      onClick={handleComplete}
                      style={{
                        background: 'linear-gradient(45deg, #8b5cf6, #a78bfa)',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 2rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)'
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Choose This Path
                    </motion.button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}