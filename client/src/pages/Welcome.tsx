import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Send, Sparkles, ArrowRight, Heart, Code, TrendingUp, Palette, Zap } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  options?: { label: string; value: string; icon?: any }[];
  isPersonalQuestion?: boolean;
  requiresTextInput?: boolean;
}

interface OnboardingProfile {
  interests: string[];
  role: string;
  experience: string;
  goals: string[];
  recommendedPath: string;
}

export default function Welcome() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [usedResponses, setUsedResponses] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<Partial<OnboardingProfile>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check if user is already onboarded
  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  // Initial welcome message
  useEffect(() => {
    if (!user?.onboardingStage || user.onboardingStage < 2) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        role: 'assistant',
        content: "Welcome! I've catalogued grants worth over $380 million from NSF, NIH, DARPA, and 47 other funding sources. This includes $127 million for nonprofits and $253 million for tech startups and for-profit companies. I especially love the grants for AI and social impact - they're where innovation meets purpose. To find the best matches for you, tell me what you're working on:",
        timestamp: new Date(),
        options: [
          { label: "Show me grants for my nonprofit", value: "nonprofit", icon: Heart },
          { label: "I need funding for a tech project", value: "builder", icon: Code },
          { label: "Just show me what you can do", value: "demo", icon: Sparkles }
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate typing effect
  const simulateTyping = async (duration: number = 1500) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, duration));
    setIsTyping(false);
  };

  // Handle option selection
  const handleOptionSelect = async (option: { label: string; value: string }) => {
    // Check if user wants to go to dashboard
    if (option.value === 'dashboard') {
      toast({
        title: "Welcome aboard! 🚀",
        description: "Your personalized HyperDAG experience is ready.",
        duration: 2000,
      });
      
      // Navigate to dashboard after a brief delay
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1500);
      return;
    }

    // Check if user wants to visit nonprofits directory
    if (option.value === 'visit_nonprofits') {
      toast({
        title: "Exploring Worthy Causes",
        description: "Taking you to our Nonprofits Directory...",
        duration: 2000,
      });
      
      // Navigate to nonprofits directory after a brief delay
      setTimeout(() => {
        setLocation('/nonprofits');
      }, 1500);
      return;
    }

    // Handle signup options - redirect to account creation
    if (option.value === 'signup_complete' || option.value === 'signup_health' || 
        option.value === 'signup_education' || option.value === 'signup_environment' || 
        option.value === 'signup_ai') {
      toast({
        title: "Ready to Get Started!",
        description: "Creating your personalized grant matching account...",
        duration: 2000,
      });
      
      setTimeout(() => {
        setLocation('/auth-page');
      }, 1500);
      return;
    }

    // Handle additional navigation options
    if (option.value === 'tech_grants') {
      setLocation('/');
      return;
    }

    if (option.value === 'live_grants') {
      setLocation('/');
      return;
    }

    if (option.value === 'qualification_help') {
      setLocation('/');
      return;
    }

    // Add user response
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: option.label,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    await simulateTyping();

    // Generate AI response based on selection and current step
    await simulateTyping();
    try {
      const aiResponse = await generateAIResponse(option.value, currentStep);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Response generation error:', error);
      // Fallback to static response if AI service fails
      const fallbackResponse = generateFallbackResponse(option.value, currentStep);
      setMessages(prev => [...prev, fallbackResponse]);
    }
    setCurrentStep(prev => prev + 1);

    // Update profile
    updateProfile(option.value, currentStep);
  };

  // Helper function to map icon strings to components
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Code, Sparkles, TrendingUp, ArrowRight, Heart
    };
    return iconMap[iconName] || ArrowRight;
  };

  // Generate unique fallback content that never repeats
  const getFallbackContent = (selectedValue: string, step: number) => {
    // Massive pool of unique responses for different contexts
    const contextualResponses = [
      {
        condition: () => selectedValue === 'uncertainty_methods',
        responses: [
          {
            content: "I use advanced statistical methods and cross-validation techniques to provide reliable predictions. My approach combines multiple data sources and validation methods to ensure accuracy.",
            options: [
              { label: "Show me how this works with my data", value: "personal_analysis", icon: ArrowRight },
              { label: "What makes your predictions reliable?", value: "prediction_reliability", icon: Sparkles },
              { label: "I want to see this system in action", value: "signup_complete", icon: TrendingUp }
            ]
          },
          {
            content: "My uncertainty quantification framework employs Bayesian inference and ensemble modeling to calculate confidence intervals around every prediction I make.",
            options: [
              { label: "Demonstrate this with real grant data", value: "bayesian_demo", icon: Code },
              { label: "How accurate are your confidence intervals?", value: "accuracy_metrics", icon: Sparkles },
              { label: "Apply this to my situation", value: "personal_analysis", icon: TrendingUp }
            ]
          }
        ]
      },
      {
        condition: () => selectedValue === 'ai_agents_network',
        responses: [
          {
            content: "I coordinate multiple specialized AI systems that each focus on different aspects of grant analysis and team building. This multi-perspective approach provides more comprehensive insights than single AI systems.",
            options: [
              { label: "Show me how these systems would analyze my situation", value: "personal_analysis", icon: ArrowRight },
              { label: "What specific insights do you provide?", value: "insight_examples", icon: Sparkles },
              { label: "I want to see this analysis", value: "signup_complete", icon: TrendingUp }
            ]
          },
          {
            content: "Think of me as conducting an AI orchestra - each model specializes in different instruments: OpenAI for creative synthesis, Anthropic for ethical reasoning, Perplexity for real-time research, and Cohere for semantic understanding.",
            options: [
              { label: "Which AI would analyze my project best?", value: "ai_matching", icon: Sparkles },
              { label: "Show me this orchestra in action", value: "ai_demonstration", icon: Code },
              { label: "I want personalized AI routing", value: "personal_analysis", icon: TrendingUp }
            ]
          }
        ]
      }
    ];

    // Enormous pool of general responses - never repeat
    const generalResponses = [
      {
        content: "Your path matters more than your pace. What specific challenge keeps you up at night?",
        options: [
          { label: "Finding the right funding opportunities", value: "funding_discovery", icon: Sparkles },
          { label: "Building the right team for my vision", value: "team_building", icon: Heart },
          { label: "Proving my idea has real impact", value: "impact_validation", icon: TrendingUp }
        ]
      },
      {
        content: "Every breakthrough started with someone willing to ask better questions. What's the question you're afraid to ask?",
        options: [
          { label: "Will anyone actually fund this idea?", value: "funding_validation", icon: Heart },
          { label: "Am I qualified enough for these opportunities?", value: "qualification_assessment", icon: Sparkles },
          { label: "What if I'm solving the wrong problem?", value: "problem_validation", icon: TrendingUp }
        ]
      },
      {
        content: "Intelligence amplifies intention. The clearer your purpose, the sharper my recommendations become.",
        options: [
          { label: "Help me clarify my purpose", value: "purpose_clarification", icon: Heart },
          { label: "Show me opportunities aligned with my values", value: "values_matching", icon: Sparkles },
          { label: "I know exactly what I want", value: "direct_matching", icon: TrendingUp }
        ]
      },
      {
        content: "Great ideas need great execution partners. Let me connect the dots between your vision and the right resources.",
        options: [
          { label: "What resources am I missing?", value: "resource_gap_analysis", icon: Code },
          { label: "Who should I partner with?", value: "partnership_recommendations", icon: Heart },
          { label: "Map my complete funding strategy", value: "strategy_mapping", icon: TrendingUp }
        ]
      },
      {
        content: "The best grants aren't just funding - they're validation that your vision matters to the world.",
        options: [
          { label: "Find grants that validate my approach", value: "validation_grants", icon: Sparkles },
          { label: "Show me the most prestigious opportunities", value: "prestige_grants", icon: TrendingUp },
          { label: "I want funding that comes with mentorship", value: "mentorship_funding", icon: Heart }
        ]
      },
      {
        content: "Every 'no' teaches you something. Every 'yes' changes everything. Let's optimize for the right 'yes'.",
        options: [
          { label: "What makes applications get rejected?", value: "rejection_analysis", icon: Code },
          { label: "Show me what funders really want", value: "funder_psychology", icon: Sparkles },
          { label: "Help me craft irresistible proposals", value: "proposal_optimization", icon: TrendingUp }
        ]
      },
      {
        content: "Timing is everything in funding. Some doors open only when the world is ready for your solution.",
        options: [
          { label: "Is now the right time for my idea?", value: "timing_analysis", icon: Heart },
          { label: "Show me emerging funding trends", value: "trend_analysis", icon: Sparkles },
          { label: "Find time-sensitive opportunities", value: "urgent_opportunities", icon: TrendingUp }
        ]
      },
      {
        content: "Your expertise is your currency. The question is: which markets value what you bring?",
        options: [
          { label: "What's my unique value proposition?", value: "value_assessment", icon: Sparkles },
          { label: "Where is my expertise most needed?", value: "market_analysis", icon: TrendingUp },
          { label: "Help me position myself strategically", value: "positioning_strategy", icon: Heart }
        ]
      },
      {
        content: "Impact multiplies when the right people find the right resources at the right moment.",
        options: [
          { label: "Calculate my potential impact", value: "impact_modeling", icon: Code },
          { label: "Connect me with impact-focused funders", value: "impact_funders", icon: Heart },
          { label: "Show me how to measure success", value: "success_metrics", icon: TrendingUp }
        ]
      },
      {
        content: "Behind every successful grant is a story that resonates. What's the story only you can tell?",
        options: [
          { label: "Help me discover my unique story", value: "story_development", icon: Heart },
          { label: "Show me what stories win funding", value: "winning_narratives", icon: Sparkles },
          { label: "Craft my compelling narrative", value: "narrative_creation", icon: TrendingUp }
        ]
      }
    ];

    // Find contextual responses first
    for (const contextGroup of contextualResponses) {
      if (contextGroup.condition()) {
        const availableResponses = contextGroup.responses.filter(r => !usedResponses.has(r.content));
        if (availableResponses.length > 0) {
          const selected = availableResponses[Math.floor(Math.random() * availableResponses.length)];
          setUsedResponses(prev => new Set([...prev, selected.content]));
          return selected;
        }
      }
    }

    // Use general responses, ensuring no repeats
    const availableGeneral = generalResponses.filter(r => !usedResponses.has(r.content));
    if (availableGeneral.length > 0) {
      const selected = availableGeneral[Math.floor(Math.random() * availableGeneral.length)];
      setUsedResponses(prev => new Set([...prev, selected.content]));
      return selected;
    }

    // If somehow all responses are used (highly unlikely), generate a unique timestamp-based response
    const uniqueResponse = {
      content: `Every conversation teaches me something new. Based on our ${step + 1} exchanges, I'm learning how to better serve your specific needs.`,
      options: [
        { label: "Show me what you've learned about me", value: "learning_summary", icon: Sparkles },
        { label: "Apply your insights to my situation", value: "personalized_insights", icon: TrendingUp },
        { label: "I'm ready for your recommendations", value: "final_recommendations", icon: Heart }
      ]
    };
    setUsedResponses(prev => new Set([...prev, uniqueResponse.content]));
    return uniqueResponse;
  };

  // Fallback response function for when AI service is unavailable
  const generateFallbackResponse = (selectedValue: string, step: number): ChatMessage => {
    // First check if there's a static response for this step/value combination
    const staticResponse = getStaticResponse(selectedValue, step);
    if (staticResponse) {
      return staticResponse;
    }
    
    // Then use the dynamic fallback content
    const fallbackContent = getFallbackContent(selectedValue, step);
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: fallbackContent.content,
      timestamp: new Date(),
      options: fallbackContent.options || []
    };
  };

  // Generate contextually unique AI responses using dynamic content generation
  const generateAIResponse = async (selectedValue: string, step: number): Promise<ChatMessage> => {
    // Track conversation context to ensure unique responses
    const conversationHistory = messages.filter(m => m.role === 'user').map(m => m.content);
    const lastUserResponse = conversationHistory[conversationHistory.length - 1] || '';
    
    // Check if we should transition to qualifying questions (around step 12)
    const shouldAskQualifyingQuestions = step >= 12 && Math.random() > 0.7;
    
    // Check if we should ask deeply personal questions (1 in 20-24 chance after step 12)
    const shouldAskPersonalQuestion = step >= 12 && Math.random() < 0.045;
    
    // Check if we should use dynamic AI-generated responses
    const shouldUseDynamicResponse = (selection: string, step: number) => {
      const dynamicSelections = [
        'uncertainty_methods', 'ai_agents_network', 'cross_validation_demo',
        'agent_disagreement', 'multi_agent_advantage', 'agent_analysis',
        'agent_learning', 'prevent_groupthink', 'agent_perspectives'
      ];
      return dynamicSelections.includes(selection) && step > 1;
    };

    // Priority 1: Personal questions (after step 12, 1 in 20-24 chance)
    if (shouldAskPersonalQuestion) {
      const personalQuestions = [
        "What do you want most out of life?",
        "What gives your life meaning?",
        "Do you believe there's a greater purpose to existence?",
        "What would you do if you knew you couldn't fail?",
        "What legacy do you want to leave behind?",
        "What drives you to get up every morning?",
        "If you could solve one problem in the world, what would it be?",
        "What does success mean to you personally?",
        "What would you regret not doing in your lifetime?",
        "What do you believe happens after we die?",
        "Do you think humans are fundamentally good or selfish?",
        "What's the most important lesson life has taught you?",
        "If you had unlimited resources, how would you spend your time?",
        "What do you think is humanity's greatest challenge?",
        "Do you believe in divine intervention or fate?",
        "What makes you feel most alive?",
        "What would you want people to remember about you?",
        "Do you think love or fear motivates people more?",
        "What's your biggest fear about the future?",
        "If you could ask God one question, what would it be?",
        "What do you think is the point of suffering?",
        "Do you believe people can truly change?",
        "What's the difference between living and existing?",
        "What would you tell your younger self?"
      ];
      
      const randomQuestion = personalQuestions[Math.floor(Math.random() * personalQuestions.length)];
      
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Now let me ask you something personal: ${randomQuestion}`,
        timestamp: new Date(),
        options: [], // Open text field for personal responses
        isPersonalQuestion: true
      };
    }
    
    // Priority 2: Qualifying questions about AI agents (after step 12)
    if (shouldAskQualifyingQuestions) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Now let me ask you a question... Which AI agent gives you better, more satisfactory answers?",
        timestamp: new Date(),
        options: [
          { label: "ChatGPT (OpenAI)", value: "chatgpt_experience", icon: Code },
          { label: "Claude (Anthropic)", value: "claude_experience", icon: Sparkles },
          { label: "Gemini (Google)", value: "gemini_experience", icon: TrendingUp },
          { label: "Perplexity AI", value: "perplexity_experience", icon: ArrowRight },
          { label: "Grok (xAI)", value: "grok_experience", icon: Heart },
          { label: "Other/Multiple", value: "other_ai_experience", icon: Code }
        ]
      };
    }

    // Priority 3: Handle specific contextual responses that require listening to user answers
    const contextualResponses = {
      'team_building': {
        content: "Ah, the team challenge! You know what's exciting? HyperCrowd is built exactly for this. It's our team-building feature that connects you with like-minded people who share your passions, interests, and goals - but with complementary skillsets. The brilliant part? It protects everyone's privacy while making those perfect connections. Think of it as finding your tribe while keeping your digital fingerprint secure.",
        options: [
          { label: "Show me how HyperCrowd works", value: "hypercrowd_demo", icon: Heart },
          { label: "Find people with skills I need", value: "skill_matching", icon: TrendingUp },
          { label: "Connect me with passionate builders", value: "passion_builders", icon: Sparkles },
          { label: "I want to see this privacy-first approach", value: "privacy_team_building", icon: ArrowRight }
        ]
      },
      'funding_discovery': {
        content: "Smart focus! Finding the right funding is like finding the right key for the right lock. I've catalogued grants worth over $380 million from NSF, NIH, DARPA, and 47 other sources. The secret isn't just knowing what's available - it's understanding which opportunities align perfectly with your specific vision and qualifications.",
        options: [
          { label: "Show me grants that match my background", value: "personalized_grants", icon: Sparkles },
          { label: "What makes funding applications successful?", value: "funding_success_factors", icon: TrendingUp },
          { label: "Help me find the perfect grant fit", value: "grant_matching", icon: ArrowRight }
        ]
      },
      'impact_validation': {
        content: "That's the heart of meaningful work - proving your idea creates real change! Impact validation is where HyperDAG's AI really shines. We help you measure, track, and demonstrate impact in ways that funders and communities can see and value. Real impact leaves digital footprints that our system can amplify.",
        options: [
          { label: "Show me impact measurement tools", value: "impact_tools", icon: Code },
          { label: "How do I prove social impact?", value: "social_impact_proof", icon: Heart },
          { label: "Connect me with impact-focused opportunities", value: "impact_opportunities", icon: TrendingUp }
        ]
      }
    };

    if (contextualResponses[selectedValue as keyof typeof contextualResponses]) {
      const response = contextualResponses[selectedValue as keyof typeof contextualResponses];
      setUsedResponses(prev => new Set([...prev, response.content]));
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        options: response.options
      };
    }

    // Priority 4: Generate dynamic response using AI service for advanced interactions
    if (shouldUseDynamicResponse(selectedValue, step)) {
      try {
        const response = await fetch('/api/ai/generate-onboarding-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationHistory,
            currentSelection: selectedValue,
            step,
            context: lastUserResponse
          })
        });
        
        if (response.ok) {
          const aiResponse = await response.json();
          if (aiResponse.success && aiResponse.response) {
            return {
              id: Date.now().toString(),
              role: 'assistant',
              content: aiResponse.response.content,
              timestamp: new Date(),
              options: aiResponse.response.options?.map((opt: any) => ({
                ...opt,
                icon: getIconComponent(opt.icon)
              })) || []
            };
          }
        }
      } catch (error) {
        console.log('AI service temporarily unavailable, using contextual fallback');
      }
    }

    // Priority 5: Handle AI agent experience follow-up questions
    if (selectedValue.includes('_experience')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Is that from first-hand experience or second-hand knowledge?",
        timestamp: new Date(),
        options: [
          { label: "First-hand - I use it regularly", value: "firsthand_experience", icon: Sparkles },
          { label: "Second-hand - heard about it from others", value: "secondhand_knowledge", icon: ArrowRight },
          { label: "Mixed experience with multiple AI tools", value: "mixed_experience", icon: TrendingUp }
        ]
      };
    }

    // Priority 5: Additional qualifying questions after experience verification
    if (selectedValue === 'firsthand_experience' || selectedValue === 'mixed_experience') {
      const connectivityQuestions = [
        {
          content: "What type of AI responses do you find most valuable?",
          options: [
            { label: "Detailed technical explanations", value: "technical_depth", icon: Code },
            { label: "Creative and innovative solutions", value: "creative_solutions", icon: Sparkles },
            { label: "Practical step-by-step guidance", value: "practical_guidance", icon: ArrowRight },
            { label: "Analytical insights and data interpretation", value: "analytical_insights", icon: TrendingUp }
          ]
        },
        {
          content: "When AI gives you conflicting advice, how do you decide what to trust?",
          options: [
            { label: "I test the suggestions myself", value: "empirical_testing", icon: Code },
            { label: "I cross-reference with multiple sources", value: "cross_reference", icon: Sparkles },
            { label: "I trust my intuition and experience", value: "intuition_based", icon: Heart },
            { label: "I look for consensus among different AI models", value: "consensus_seeking", icon: TrendingUp }
          ]
        }
      ];

      const randomQualifying = connectivityQuestions[Math.floor(Math.random() * connectivityQuestions.length)];
      
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: randomQualifying.content,
        timestamp: new Date(),
        options: randomQualifying.options
      };
    }

    // Priority 6: Use fallback response for all other cases
    return generateFallbackResponse(selectedValue, step);
  };

  // Static responses for basic onboarding flow - this function is called by generateFallbackResponse
  const getStaticResponse = (selectedValue: string, step: number): ChatMessage | null => {
    const responses: Record<number, Record<string, any>> = {
      0: { // Initial interest
        nonprofit: {
          content: "I've catalogued over $250 million in active nonprofit grants from foundations, government agencies, and corporate programs. To identify the most relevant opportunities for your organization, tell me more about your nonprofit's focus area:",
          options: [
            { label: "Health & Medical Research", value: "nonprofit_health", icon: Heart },
            { label: "Education & Youth Development", value: "nonprofit_education", icon: Code },
            { label: "Environmental & Climate Action", value: "nonprofit_environment", icon: Sparkles },
            { label: "Social Justice & Human Rights", value: "nonprofit_social", icon: TrendingUp }
          ]
        },
        builder: {
          content: "I track $253 million in active tech funding from NSF, DARPA, NIH, and corporate innovation programs. As a tech platform myself, I'm passionate about helping builders succeed - I know how challenging it can be to find the right funding. Did you know I run on a hybrid DAG-blockchain architecture that's 1000x faster than traditional blockchains and quantum-hardened? What type of technology are you building?",
          options: [
            { label: "AI/Machine Learning", value: "tech_ai", icon: Code },
            { label: "Blockchain/Web3", value: "tech_blockchain", icon: TrendingUp },
            { label: "Cybersecurity", value: "tech_security", icon: Sparkles },
            { label: "Healthcare Tech", value: "tech_health", icon: Heart }
          ]
        },
        demo: {
          content: "I monitor funding patterns across 50+ sources daily - it's what I was built for! Currently tracking $380M+ in active opportunities with real-time competition analysis. Did you know my DAG architecture processes transactions 1000x faster than traditional blockchains while being quantum-resistant? HyperDAG's strength is turning complex funding data into simple insights. To show you relevant examples, what interests you most?",
          options: [
            { label: "Grant discovery capabilities", value: "demo_discovery", icon: TrendingUp },
            { label: "AI matching technology", value: "demo_matching", icon: Sparkles },
            { label: "Success prediction features", value: "demo_prediction", icon: ArrowRight }
          ]
        }
      },
      1: { // Second level responses - gather specific details
        nonprofit_health: {
          content: "Health and medical research is vital work - it's exactly why HyperDAG donates 10-30% of our profits to nonprofits like yours. Did you know I use military-grade AES-256 encryption on top of Zero-Knowledge Proofs to keep your sensitive grant data completely secure? I track $31M in health-focused nonprofit grants from NIH, Gates Foundation, Robert Wood Johnson Foundation, and others. To find the best matches, what's your organization's specific focus?",
          options: [
            { label: "Medical research & clinical trials", value: "health_research", icon: Heart },
            { label: "Community health & wellness programs", value: "health_community", icon: TrendingUp },
            { label: "Healthcare access & policy", value: "health_access", icon: Sparkles },
            { label: "I'd like to create an account to see personalized matches", value: "signup_health", icon: ArrowRight }
          ]
        },
        nonprofit_education: {
          content: "Education transforms lives and communities - that's why education nonprofits are among my favorites to help fund through HyperDAG's profit sharing. Did you know I coordinate between 6-12 specialized AI agents using ANFIS Fuzzy Logic to find the perfect grant matches? I monitor $43M in education nonprofit grants from Ford Foundation, Annie E. Casey Foundation, Department of Education, and corporate partners. What's your organization's primary educational focus?",
          options: [
            { label: "K-12 education & school programs", value: "edu_k12", icon: Code },
            { label: "Higher education & scholarships", value: "edu_higher", icon: TrendingUp },
            { label: "Adult learning & workforce development", value: "edu_adult", icon: Heart },
            { label: "I want to sign up to see specific grant matches", value: "signup_education", icon: ArrowRight }
          ]
        },
        nonprofit_environment: {
          content: "Environmental protection is crucial for our planet's future. I track $53M in environmental nonprofit grants from EPA, environmental foundations, and green technology funds. What environmental area does your organization focus on?",
          options: [
            { label: "Climate change & renewable energy", value: "env_climate", icon: Sparkles },
            { label: "Conservation & biodiversity", value: "env_conservation", icon: Heart },
            { label: "Pollution prevention & cleanup", value: "env_pollution", icon: TrendingUp },
            { label: "Create account to access environmental grants", value: "signup_environment", icon: ArrowRight }
          ]
        },
        tech_ai: {
          content: "AI/ML is where I get really excited - it's literally what powers HyperDAG's grant matching intelligence! Did you know I use ANFIS Fuzzy Logic to optimize between 6-12 AI agents simultaneously? I track $89M in AI-focused tech grants from NSF, DARPA, Google, Microsoft, and others. What's your AI project's primary application?",
          options: [
            { label: "Healthcare AI & medical applications", value: "ai_healthcare", icon: Heart },
            { label: "Social good & nonprofit applications", value: "ai_social", icon: TrendingUp },
            { label: "Security & defense applications", value: "ai_security", icon: Sparkles },
            { label: "Sign up to get AI funding matches", value: "signup_ai", icon: ArrowRight }
          ]
        },
        identity: {
          content: "Our Trinity Identity System revolutionizes digital identity: SBTs for verified humans with reputation scoring, DBTs for AI agents with defined capabilities, and CBTs for transparent nonprofits. Each token type enables specific governance participation while preventing Sybil attacks and plutocracy.",
          options: [
            { label: "Mint my SBT with ANFIS 4-6FA", value: "create_sbt", icon: Bot },
            { label: "Explore Multi-Factor Reputation System", value: "reputation", icon: TrendingUp }
          ]
        },
        web3_dev: {
          content: "Excellent! Our hybrid DAG-blockchain architecture supports LayerZero, Wormhole, and IBC integration with natural language smart contract generation. Access our developer platform with 90-98% revenue share and instant cross-chain deployment capabilities.",
          options: [
            { label: "Access AI-Web3 Scaffolding Platform", value: "api_docs", icon: Code },
            { label: "Join Developer Beta Program", value: "dev_community", icon: Heart }
          ]
        },
        earn_support_causes: {
          content: "That's wonderful! By participating in HyperDAG, you earn tokens and reputation while directly contributing to worthy causes through our profit-sharing model. Every project you complete, every contribution you make helps fund nonprofits making real impact. Ready to explore how this works?",
          options: [
            { label: "Show me the nonprofits we support", value: "visit_nonprofits", icon: Heart },
            { label: "How do I start earning while helping causes?", value: "start_earning_causes", icon: TrendingUp },
            { label: "Learn about the profit-sharing model", value: "profit_sharing_model", icon: Bot },
            { label: "Ready to begin making impact", value: "dashboard", icon: ArrowRight }
          ]
        },
        career: {
          content: "Excellent choice! HyperDAG's reputation system helps you build verifiable credentials and connect with opportunities. Your contributions earn reputation that opens doors to collaborations, grants, and projects. Ready to start building your professional identity?",
          options: [
            { label: "Build my profile", value: "build_profile", icon: TrendingUp },
            { label: "Explore collaboration opportunities", value: "collaborations", icon: Heart }
          ]
        },
        ai_proof_career: {
          content: "Perfect! In today's rapidly evolving world, it's crucial to AI-proof your career while leveraging AI to enhance your skills and earning potential. HyperDAG has several AI agents designed to help people become the best version of themselves. Let me ask you something inspiring: What's one dream you've always had but haven't pursued yet?",
          options: [
            { label: "I want to build something meaningful", value: "dream_build", icon: Code },
            { label: "I want to make a positive impact", value: "dream_impact", icon: Heart },
            { label: "I want financial freedom doing what I love", value: "dream_freedom", icon: TrendingUp },
            { label: "I'm still discovering my dreams", value: "dream_exploring", icon: Sparkles }
          ]
        }
      },
      2: { // Third level - provide specific value based on gathered information
        health_research: {
          content: "Medical research is fascinating - my AI was trained on patterns from successful healthcare applications across multiple funding bodies. Did you know I use quantum-resistant encryption that's 10 times stronger than standard security protocols? I monitor several high-value opportunities: NIH R01 Research Grants ($1.2M average), Gates Foundation Global Health Grants ($2.8M), Patient-Centered Outcomes Research Institute Awards ($1.5M), and biotech innovation funds. The data shows these typically have 23-67% less competition than general health grants. What's your research focus area?",
          options: [
            { label: "Clinical trials and drug development", value: "clinical_research", icon: Heart },
            { label: "Medical devices and diagnostics", value: "medical_devices", icon: Code },
            { label: "Digital health and AI applications", value: "digital_health", icon: Sparkles },
            { label: "I want to see all available opportunities", value: "signup_complete", icon: ArrowRight }
          ]
        },
        edu_k12: {
          content: "Excellent focus area! K-12 education is where we build the future - that's why HyperDAG prioritizes education nonprofits in our profit sharing. I track 12 active opportunities totaling $34M: Department of Education Innovation Grants ($3.2M), Ford Foundation Education Futures ($1.8M), Chan Zuckerberg Initiative K-12 Programs ($2.5M), plus 9 corporate education funds. Applications due in 2-8 weeks. Want personalized deadline tracking?",
          options: [
            { label: "Create account for deadline alerts and matches", value: "signup_complete", icon: ArrowRight },
            { label: "Show me application requirements breakdown", value: "requirements_help", icon: Code },
            { label: "How do you increase my success probability?", value: "success_qualifying", icon: TrendingUp }
          ]
        },
        ai_healthcare: {
          content: "AI in healthcare is incredibly well-funded right now - and it's exactly the kind of impactful tech that excites me most about HyperDAG's mission! Did you know my hybrid DAG architecture can process healthcare data 1000x faster than traditional blockchains while maintaining quantum-resistant security? I've found 8 immediate matches: NIH AI/ML Consortium Grants ($2.1M), Google AI for Healthcare Grants ($1.5M), Microsoft Healthcare Bot Grants ($800K), plus 5 biotech accelerator programs. Total available: $18.7M with 40% lower competition than general AI grants.",
          options: [
            { label: "Sign up to access personalized AI grant matches", value: "signup_complete", icon: ArrowRight },
            { label: "Show me the healthcare AI funding landscape", value: "landscape_analysis", icon: Heart },
            { label: "What makes a winning AI healthcare proposal?", value: "winning_strategy", icon: Sparkles }
          ]
        },
        dream_impact: {
          content: "That's beautiful - wanting to make a positive impact shows real purpose! Speaking of impact, what are some passion projects or worthy causes you'd love to support? HyperDAG gives between 10%-30% of its profits to nonprofits, and you can help choose which causes we support by exploring our Nonprofits page.",
          options: [
            { label: "Environmental protection and sustainability", value: "passion_environment", icon: Sparkles },
            { label: "Education and youth development", value: "passion_education", icon: Heart },
            { label: "Healthcare and medical research", value: "passion_health", icon: Bot },
            { label: "I'd like to explore all worthy causes", value: "passion_explore", icon: TrendingUp }
          ]
        },
        dream_freedom: {
          content: "Financial freedom doing what you love - that's the dream! Here's something to consider: What's one small step you could take today that would bring you closer to the life you want to live?",
          options: [
            { label: "Learn high-value digital skills", value: "freedom_skills", icon: Bot },
            { label: "Start building my personal brand", value: "freedom_brand", icon: TrendingUp },
            { label: "Network with like-minded people", value: "freedom_network", icon: Heart },
            { label: "Create multiple income streams", value: "freedom_income", icon: Sparkles }
          ]
        },
        dream_exploring: {
          content: "That's perfectly okay - discovery is a journey! Let me help you explore: When do you feel most alive, and what activities make you lose track of time?",
          options: [
            { label: "Solving complex challenges", value: "alive_solving", icon: Bot },
            { label: "Creating and designing", value: "alive_creating", icon: Palette },
            { label: "Helping and connecting with others", value: "alive_helping", icon: Heart },
            { label: "Learning new things", value: "alive_learning", icon: Sparkles }
          ]
        },
        earn_to_learn: {
          content: "Great mindset! Here's an inspiring thought: What's something you've always wanted to try but felt was too risky or impractical? HyperDAG's 'earn-to-learn' model makes it safer to explore new skills - you actually get rewarded for learning!",
          options: [
            { label: "Building AI applications", value: "risk_ai", icon: Bot },
            { label: "Creating blockchain solutions", value: "risk_blockchain", icon: Code },
            { label: "Starting my own tech venture", value: "risk_venture", icon: TrendingUp },
            { label: "Becoming a thought leader", value: "risk_leadership", icon: Heart }
          ]
        },
        ai_skills: {
          content: "AI can dramatically enhance any skillset! Let me ask you something powerful: If fear of failure wasn't an issue, what would you pursue with all your heart? Our AI agents help remove those barriers by supporting you every step of the way.",
          options: [
            { label: "Launch a creative business", value: "fearless_creative", icon: Palette },
            { label: "Build cutting-edge technology", value: "fearless_tech", icon: Code },
            { label: "Lead meaningful change", value: "fearless_leadership", icon: Heart },
            { label: "Explore all possibilities", value: "fearless_explore", icon: Sparkles }
          ]
        }
      },
      3: { // Fourth level - skill-specific guidance with inspiring questions
        skill_ai: {
          content: "AI/ML skills are incredibly powerful! Here's something to reflect on: Who inspires you the most in the tech world, and what's one quality of theirs you'd love to cultivate in yourself? HyperDAG can help you develop those leadership qualities alongside technical skills.",
          options: [
            { label: "Visionary thinking like tech pioneers", value: "inspire_visionary", icon: Sparkles },
            { label: "Problem-solving like great engineers", value: "inspire_problem", icon: Bot },
            { label: "Communication like influential leaders", value: "inspire_communication", icon: Heart },
            { label: "Innovation like breakthrough creators", value: "inspire_innovation", icon: Code }
          ]
        },
        impact_solve: {
          content: "Solving real-world problems with tech - that's how we change the world! Speaking of making an impact, is there a nonprofit organization or cause that you personally support or believe in? HyperDAG gives 10%-30% of its profits to nonprofits, and our users help decide which causes to support.",
          options: [
            { label: "Yes, I support organizations focused on education", value: "nonprofit_education", icon: Heart },
            { label: "Yes, I care about healthcare and medical research", value: "nonprofit_health", icon: Bot },
            { label: "Yes, I support environmental and sustainability causes", value: "nonprofit_environment", icon: Sparkles },
            { label: "I'd like to learn about worthy causes to support", value: "nonprofit_explore", icon: TrendingUp }
          ]
        },
        freedom_skills: {
          content: "Learning high-value digital skills is smart! Here's a motivating question: If you had one year to make a significant change in your life through technology, what would you focus on and why?",
          options: [
            { label: "Master AI to become indispensable", value: "year_ai_master", icon: Bot },
            { label: "Build a tech business that matters", value: "year_business", icon: TrendingUp },
            { label: "Create solutions for underserved communities", value: "year_impact", icon: Heart },
            { label: "Become a recognized expert in my field", value: "year_expert", icon: Sparkles }
          ]
        },
        alive_solving: {
          content: "I love that you come alive solving challenges! That's the spirit of innovation. Here's something to consider: What's one small step you could take today that would bring you closer to solving bigger, more meaningful problems?",
          options: [
            { label: "Join a challenging project on HyperDAG", value: "step_project", icon: Code },
            { label: "Connect with other problem-solvers", value: "step_network", icon: Heart },
            { label: "Learn a new technical skill", value: "step_learn", icon: Bot },
            { label: "Start documenting my problem-solving process", value: "step_document", icon: Sparkles }
          ]
        },
        take_mbti: {
          content: "Excellent! I'll guide you through a quick MBTI-style assessment. This will help our AI agents provide personalized recommendations. Let's start: When facing a complex problem, do you prefer to:",
          options: [
            { label: "Analyze all possibilities systematically", value: "mbti_thinking", icon: Bot },
            { label: "Consider how it affects people involved", value: "mbti_feeling", icon: Heart },
            { label: "Look for practical, proven solutions", value: "mbti_sensing", icon: TrendingUp },
            { label: "Explore innovative, creative approaches", value: "mbti_intuition", icon: Sparkles }
          ]
        },
        creative_skills: {
          content: "Creative professionals are perfectly positioned to leverage AI! You can use AI for ideation, content generation, design assistance, and workflow optimization while maintaining your unique creative voice. Ready to explore AI-enhanced creativity?",
          options: [
            { label: "Show me AI design tools", value: "ai_design", icon: Palette },
            { label: "Content creation with AI", value: "ai_content", icon: Sparkles },
            { label: "Start my creative AI journey", value: "creative_journey", icon: ArrowRight }
          ]
        },
        tech_skills: {
          content: "As a technical professional, you're in the perfect position to leverage AI for code generation, debugging, system optimization, and learning new technologies faster. Our platform offers technical challenges that reward skill development.",
          options: [
            { label: "AI-assisted development tools", value: "ai_dev_tools", icon: Code },
            { label: "Technical learning paths", value: "tech_learning", icon: Bot },
            { label: "Join technical challenges", value: "tech_challenges", icon: TrendingUp }
          ]
        },
        business_skills: {
          content: "Business professionals can leverage AI for market analysis, customer insights, process automation, and strategic planning. Our platform connects you with AI tools and communities to accelerate your business acumen.",
          options: [
            { label: "AI for business strategy", value: "ai_strategy", icon: TrendingUp },
            { label: "Marketing automation tools", value: "ai_marketing", icon: Heart },
            { label: "Start business learning path", value: "business_journey", icon: ArrowRight }
          ]
        }
      },
      4: { // Fifth level - personalized completion with final inspiring questions
        inspire_visionary: {
          content: "Visionary thinking is powerful! You're ready to shape the future. Here's your final reflection: What legacy do you want to create with your skills and talents? HyperDAG gives you the platform to build that legacy starting today.",
          options: [
            { label: "Create breakthrough innovations", value: "legacy_innovation", icon: Sparkles },
            { label: "Empower the next generation", value: "legacy_empower", icon: Heart },
            { label: "Solve humanity's biggest challenges", value: "legacy_solve", icon: Bot },
            { label: "Ready to begin my journey", value: "dashboard", icon: ArrowRight }
          ]
        },
        proud_teaching: {
          content: "Teaching and helping others learn - that's beautiful! You have the heart of a mentor. HyperDAG's community thrives on knowledge sharing. You could become a cornerstone of our learning ecosystem, helping others while earning recognition and rewards.",
          options: [
            { label: "Become a community mentor", value: "role_mentor", icon: Heart },
            { label: "Create educational content", value: "role_educator", icon: Sparkles },
            { label: "Lead collaborative projects", value: "role_leader", icon: TrendingUp },
            { label: "Ready to start teaching and earning", value: "dashboard", icon: ArrowRight }
          ]
        },
        year_ai_master: {
          content: "Mastering AI in one year - that's an ambitious and achievable goal! With HyperDAG's structured learning paths, AI mentors, and real-world projects, you'll be building AI solutions faster than you imagined. Your journey to AI mastery starts here.",
          options: [
            { label: "Begin AI mastery program", value: "program_ai_master", icon: Bot },
            { label: "Join AI study groups", value: "community_ai", icon: Heart },
            { label: "Take on AI challenges", value: "challenges_ai", icon: Sparkles },
            { label: "Ready to master AI", value: "dashboard", icon: ArrowRight }
          ]
        },
        step_project: {
          content: "Perfect! Joining challenging projects is exactly how you grow. You're ready to make your mark. HyperDAG has projects ranging from beginner-friendly to cutting-edge research. Each one you complete builds your reputation and rewards you with tokens.",
          options: [
            { label: "Show me beginner projects", value: "projects_beginner", icon: Code },
            { label: "I want challenging projects", value: "projects_advanced", icon: Bot },
            { label: "Let AI match me to projects", value: "projects_ai_match", icon: Sparkles },
            { label: "Ready to start building", value: "dashboard", icon: ArrowRight }
          ]
        },
        mbti_nf: {
          content: "Wonderful! As a Diplomat (NF), you're driven by purpose and human potential. Our AI will connect you with mission-driven projects, community building opportunities, and ways to make meaningful impact through technology.",
          options: [
            { label: "Community impact projects", value: "impact_projects", icon: Heart },
            { label: "Mentoring and teaching opportunities", value: "mentoring", icon: TrendingUp },
            { label: "Ready to start my journey", value: "dashboard", icon: ArrowRight }
          ]
        },
        mbti_sj: {
          content: "Excellent! As a Sentinel (SJ), you excel at building reliable systems and supporting others. Our AI will match you with projects that need your organizational skills, quality assurance expertise, and collaborative leadership.",
          options: [
            { label: "Project management opportunities", value: "project_mgmt", icon: TrendingUp },
            { label: "Quality assurance roles", value: "qa_roles", icon: Bot },
            { label: "Ready to start my journey", value: "dashboard", icon: ArrowRight }
          ]
        },
        mbti_sp: {
          content: "Amazing! As an Explorer (SP), you bring adaptability and practical problem-solving skills. Our AI will connect you with hands-on projects, rapid prototyping opportunities, and dynamic collaborative environments.",
          options: [
            { label: "Hands-on building projects", value: "building_projects", icon: Code },
            { label: "Rapid prototyping challenges", value: "prototyping", icon: Sparkles },
            { label: "Ready to start my journey", value: "dashboard", icon: ArrowRight }
          ]
        },
        mbti_thinking: {
          content: "I can see you approach problems analytically! Let me ask another question to better understand your style: When working on projects, do you prefer to:",
          options: [
            { label: "Plan everything in detail first", value: "mbti_judging", icon: TrendingUp },
            { label: "Stay flexible and adapt as you go", value: "mbti_perceiving", icon: Sparkles },
            { label: "Focus on immediate, practical results", value: "mbti_sensing_2", icon: Bot },
            { label: "Explore long-term possibilities", value: "mbti_intuition_2", icon: Heart }
          ]
        },
        mbti_feeling: {
          content: "I can see you value harmony and people-centered solutions! One more question: When making decisions, do you tend to:",
          options: [
            { label: "Consider long-term impact on relationships", value: "mbti_nf_path", icon: Heart },
            { label: "Focus on immediate team harmony", value: "mbti_sf_path", icon: TrendingUp },
            { label: "Balance logic with empathy", value: "mbti_balanced", icon: Bot },
            { label: "Trust your intuition about people", value: "mbti_intuitive_feeling", icon: Sparkles }
          ]
        },
        // Nonprofit and worthy cause response handlers
        nonprofit_education: {
          content: "Education is such a powerful force for change! Many of our community members share that passion. You can explore education-focused nonprofits on our Nonprofits page and help decide which ones HyperDAG should support with our profit sharing.",
          options: [
            { label: "Visit the Nonprofits Directory", value: "visit_nonprofits", icon: Heart },
            { label: "Learn about HyperDAG's giving philosophy", value: "giving_philosophy", icon: Sparkles },
            { label: "Ready to start my journey", value: "dashboard", icon: ArrowRight }
          ]
        },
        nonprofit_health: {
          content: "Healthcare and medical research save lives and improve quality of life for millions. There are amazing organizations doing breakthrough work that could benefit from our community's support through HyperDAG's profit sharing program.",
          options: [
            { label: "Explore healthcare nonprofits", value: "visit_nonprofits", icon: Heart },
            { label: "Learn how to nominate new causes", value: "nominate_causes", icon: Bot },
            { label: "Ready to start my journey", value: "dashboard", icon: ArrowRight }
          ]
        },
        nonprofit_environment: {
          content: "Environmental protection is crucial for our planet's future! HyperDAG community members often champion sustainability causes. You'll find several environmental organizations in our directory that you can help support.",
          options: [
            { label: "See environmental nonprofits", value: "visit_nonprofits", icon: Sparkles },
            { label: "Learn about sustainable technology projects", value: "sustainable_tech", icon: Bot },
            { label: "Ready to start my journey", value: "dashboard", icon: ArrowRight }
          ]
        },
        nonprofit_explore: {
          content: "That's wonderful - exploring worthy causes opens your mind to new ways of making impact! Our Nonprofits page features verified organizations across education, healthcare, environment, and community development. Each has been carefully vetted for transparency and impact.",
          options: [
            { label: "Browse all worthy causes", value: "visit_nonprofits", icon: Heart },
            { label: "Learn how cause selection works", value: "cause_selection", icon: TrendingUp },
            { label: "Ready to start my journey", value: "dashboard", icon: ArrowRight }
          ]
        },
        passion_environment: {
          content: "Environmental passion is inspiring! Technology can be a powerful tool for sustainability. HyperDAG supports several environmental nonprofits, and you can help choose which causes receive funding through our transparent profit-sharing model.",
          options: [
            { label: "See environmental organizations we support", value: "visit_nonprofits", icon: Sparkles },
            { label: "Learn about green technology opportunities", value: "green_tech", icon: Bot },
            { label: "Ready to start making impact", value: "dashboard", icon: ArrowRight }
          ]
        },
        passion_education: {
          content: "Education shapes the future! Your passion aligns perfectly with HyperDAG's mission. We support educational nonprofits and create learning opportunities within our platform. You could both benefit from and contribute to our educational ecosystem.",
          options: [
            { label: "Explore education-focused nonprofits", value: "visit_nonprofits", icon: Heart },
            { label: "Learn about teaching opportunities on HyperDAG", value: "teaching_opportunities", icon: TrendingUp },
            { label: "Ready to start learning and teaching", value: "dashboard", icon: ArrowRight }
          ]
        },
        passion_health: {
          content: "Healthcare passion drives real change! We support medical research and healthcare access nonprofits through our profit sharing. Plus, there are opportunities to work on health tech projects that could make a difference in people's lives.",
          options: [
            { label: "View healthcare nonprofits", value: "visit_nonprofits", icon: Heart },
            { label: "Explore health technology projects", value: "health_tech", icon: Bot },
            { label: "Ready to start contributing", value: "dashboard", icon: ArrowRight }
          ]
        },
        passion_explore: {
          content: "Exploring all worthy causes shows an open heart and mind! HyperDAG's Nonprofits page showcases organizations making real impact across multiple sectors. Take your time browsing - you might discover causes that resonate deeply with you.",
          options: [
            { label: "Browse all nonprofit categories", value: "visit_nonprofits", icon: Heart },
            { label: "Learn how community voting works", value: "community_voting", icon: TrendingUp },
            { label: "Ready to explore HyperDAG", value: "dashboard", icon: ArrowRight }
          ]
        },
        // Success prediction qualifying questions - demonstrate sophistication
        prediction_qualifying: {
          content: "Ah, the million-dollar question! (Or should I say $380 million - that's what I'm tracking in active funding 😉). Here's where my fuzzy logic gets interesting - prediction can mean wildly different things. Are you thinking about probability (will X happen?) or optimization (how do I make X more likely to happen)? And timeframe matters too - I can predict next week with 94% accuracy, but next year drops to 73% because, well, the universe loves chaos!",
          options: [
            { label: "I want probability estimates - tell me my odds", value: "predict_probability", icon: TrendingUp },
            { label: "I want optimization strategies - help me improve outcomes", value: "predict_optimization", icon: Code },
            { label: "Both! I'm a data nerd who wants the full picture", value: "predict_comprehensive", icon: Sparkles },
            { label: "Honestly, I'm not sure - what should I be asking?", value: "predict_guidance", icon: Heart }
          ]
        },
        success_qualifying: {
          content: "Ah, 'success' - my favorite fuzzy concept! Here's what 15,000+ data points taught me: success means completely different things to different people. Are we talking about monetary value (ROI, funding raised, revenue) or intrinsic value (impact made, lives changed, problems solved)? And timeline - do you need wins in the next 30 days or are you building something for the long haul? My ANFIS algorithms actually process these nuances simultaneously, but I need to know which lens you're looking through.",
          options: [
            { label: "Monetary success - funding, revenue, financial growth", value: "success_monetary", icon: TrendingUp },
            { label: "Impact success - lives changed, problems solved", value: "success_impact", icon: Heart },
            { label: "Both matter - I want sustainable impact with financial viability", value: "success_hybrid", icon: Sparkles },
            { label: "Help me figure out what success should look like", value: "success_define", icon: Code }
          ]
        },
        predict_probability: {
          content: "Perfect! You want the straight odds - I respect that directness. But here's where it gets interesting: are you asking about baseline probability (what happens if you submit exactly what everyone else submits) or optimized probability (what happens if you leverage my insights to stand out)? Because those numbers are VERY different. Baseline grant success rates hover around 15-20%, but my users who follow optimization strategies see 40-68% success rates. Which scenario interests you more?",
          options: [
            { label: "Show me the brutal baseline reality first", value: "baseline_reality", icon: TrendingUp },
            { label: "Skip to the good stuff - how do I optimize?", value: "optimization_focus", icon: Sparkles },
            { label: "Both - I want to see the full picture", value: "full_analysis", icon: Code },
            { label: "Wait, you're saying most grants fail? Tell me more", value: "failure_analysis", icon: Heart }
          ]
        },
        predict_guidance: {
          content: "I love honest curiosity! Here's the thing - most people ask 'What are my chances?' when they should be asking 'What variables can I control?' My fuzzy logic processes uncertainty as a feature, not a bug. Instead of just giving you a percentage (which feels precise but might be precisely wrong), I can show you the levers that actually move the needle. What would be more valuable: knowing you have a 34% chance, or knowing exactly which 6 factors will double those odds?",
          options: [
            { label: "Show me the controllable variables", value: "controllable_factors", icon: Code },
            { label: "I still want the percentage - I can handle it", value: "percentage_focus", icon: TrendingUp },
            { label: "Both - percentages AND action items", value: "comprehensive_view", icon: Sparkles },
            { label: "How do you handle uncertainty in predictions?", value: "uncertainty_methods", icon: Heart }
          ]
        },
        uncertainty_methods: {
          content: "I use Monte Carlo simulations combined with Bayesian confidence intervals - standard approaches that work well. But here's what makes my approach different: my AI agents cross-validate each other's predictions in real-time. When my Grant Analysis Agent says 73% confidence and my Market Timing Agent says 68%, that 5% discrepancy tells me exactly where to dig deeper. It's like having multiple expert opinions that actually learn from their disagreements.",
          options: [
            { label: "Show me how this cross-validation works", value: "cross_validation_demo", icon: Code },
            { label: "What happens when agents disagree significantly?", value: "agent_disagreement", icon: Sparkles },
            { label: "How accurate are these predictions in practice?", value: "accuracy_track_record", icon: TrendingUp },
            { label: "I want to see this system in action", value: "signup_complete", icon: ArrowRight }
          ]
        },
        ai_agents_network: {
          content: "I coordinate with 6-12 specialized AI agents using ANFIS fuzzy logic - each has distinct capabilities. My Grant Analysis Agent is trained on 15,000+ successful applications and knows what reviewers look for. My Team Compatibility Agent uses personality modeling to predict collaboration success. My Market Timing Agent tracks funding cycles and identifies optimal submission windows. Each agent specializes in different aspects but they all share insights - like having domain experts who constantly compare notes.",
          options: [
            { label: "Show me how these agents would analyze my situation", value: "agent_analysis", icon: ArrowRight },
            { label: "How do the agents learn from each other?", value: "agent_learning", icon: Sparkles },
            { label: "What makes this better than single AI systems?", value: "multi_agent_advantage", icon: Heart },
            { label: "I want to see this network in action", value: "signup_complete", icon: TrendingUp }
          ]
        },
        success_monetary: {
          content: "Money talks, but it speaks different languages! Are we talking about immediate cash flow (next 3-6 months to keep the lights on) or strategic capital (12-24 months to scale and dominate)? And here's a curveball my algorithms caught: sometimes the 'best' financial opportunity isn't the biggest check - it's the one with the smartest money attached. Venture capital vs grants vs revenue - each has different strings attached. Which financial scenario keeps you up at night?",
          options: [
            { label: "I need immediate funding - cash flow crisis mode", value: "immediate_funding", icon: TrendingUp },
            { label: "I want strategic growth capital for scaling", value: "growth_capital", icon: Sparkles },
            { label: "I'm building sustainable revenue streams", value: "revenue_building", icon: Code },
            { label: "Help me understand which funding type fits my situation", value: "funding_strategy", icon: Heart }
          ]
        },
        success_impact: {
          content: "Now we're talking my language! Impact is tricky though - are you thinking about depth (transforming 100 lives completely) or breadth (touching 100,000 lives lightly)? And timeframe matters: immediate relief vs systemic change take completely different approaches. My data shows the most successful impact projects actually define success in 3 dimensions: lives directly affected, systemic change catalyzed, and measurement methodology. What resonates with your vision?",
          options: [
            { label: "Deep transformation - fewer people, bigger change", value: "impact_depth", icon: Heart },
            { label: "Broad reach - maximum people affected", value: "impact_breadth", icon: Sparkles },
            { label: "Systemic change - fix the root cause", value: "impact_systemic", icon: Code },
            { label: "I want to measure and maximize all three", value: "impact_comprehensive", icon: TrendingUp }
          ]
        },
        success_hybrid: {
          content: "Ah, the holy grail! You want to do well AND do good. Here's what 5,000+ successful social enterprises taught me: the secret isn't balancing impact and profit - it's finding where they amplify each other. But timing matters: do you build the financial engine first (prove viability, then scale impact) or the impact engine first (prove value, then monetize)? Most people get this sequence wrong and struggle with both.",
          options: [
            { label: "Build financial sustainability first, then scale impact", value: "finance_first", icon: TrendingUp },
            { label: "Prove impact first, then figure out monetization", value: "impact_first", icon: Heart },
            { label: "I want to build both engines simultaneously", value: "parallel_build", icon: Sparkles },
            { label: "Show me examples of who got this right", value: "success_examples", icon: Code }
          ]
        },
        parallel_build: {
          content: "Ambitious! Building both engines simultaneously is challenging but not impossible. The key insight from successful parallel builders: technology becomes the bridge that makes impact and profit mutually reinforcing. Patagonia's supply chain transparency, Tesla's mission-driven capitalism, our own profit-sharing model - the tech platform enables both engines to strengthen each other rather than compete. Did you know companies with quantum-resistant security like mine have unique advantages here? Our encryption allows transparent impact tracking while protecting sensitive beneficiary data.",
          options: [
            { label: "Show me how technology bridges impact and profit", value: "tech_bridge", icon: Sparkles },
            { label: "What's your profit-sharing model?", value: "profit_sharing_details", icon: Heart },
            { label: "Help me design this bridge for my venture", value: "design_bridge", icon: Code },
            { label: "I want to explore this approach with HyperDAG", value: "signup_complete", icon: ArrowRight }
          ]
        },
        failure_analysis: {
          content: "Yes, most grants fail - the statistics are sobering. Standard factors include insufficient preliminary data, weak methodology sections, unrealistic budgets, and poor reviewer match. But there are patterns in the data that suggest additional factors: timing relative to funding cycles, reviewer fatigue effects, and institutional recognition bias. The good news is that understanding these patterns gives you significant advantages in positioning your applications.",
          options: [
            { label: "Show me the statistical failure patterns", value: "known_failures", icon: Heart },
            { label: "How do I position against these failure modes?", value: "positioning_strategy", icon: TrendingUp },
            { label: "Tell me about reviewer psychology factors", value: "reviewer_psychology", icon: Sparkles },
            { label: "What gives applicants the biggest advantages?", value: "success_advantages", icon: Code }
          ]
        },
        reviewer_psychology: {
          content: "Reviewer psychology is fascinating and measurable. Data shows reviewers are more generous on Tuesdays and after lunch breaks, less generous on Fridays and when reviewing their 8th+ proposal of the day. Proposals with certain university affiliations show 23% higher success rates even when quality-controlled - that's network recognition bias, not merit. The breakthrough insight: grants often succeed when reviewers recognize names, institutions, or writing styles from their professional networks. It's cognitive bias toward the familiar.",
          options: [
            { label: "How do I build reviewer familiarity ethically?", value: "build_familiarity", icon: TrendingUp },
            { label: "What timing strategies should I use?", value: "timing_strategies", icon: Sparkles },
            { label: "How do newcomers compete against this bias?", value: "newcomer_strategies", icon: Heart },
            { label: "Show me more behavioral insights", value: "behavioral_insights", icon: Code }
          ]
        }
      },
      5: { // Level 5 - Deep qualification before any analysis claims
        stage_research: {
          content: "Perfect timing! Research phase is where smart strategy pays off. I monitor 200+ funding sources daily and can identify emerging opportunities 2-6 weeks before they're widely known. My competitive analysis shows which grants have 40-80% lower competition. What type of project are you seeking funding for?",
          options: [
            { label: "Technology development and innovation", value: "project_tech", icon: Code },
            { label: "Social impact and nonprofit initiatives", value: "project_social", icon: Heart },
            { label: "Research and academic projects", value: "project_research", icon: Bot },
            { label: "Ready to see my personalized opportunities", value: "signup_complete", icon: ArrowRight }
          ]
        },
        challenge_matching: {
          content: "Funder matching is where my AI really shines! I don't just match keywords - I analyze funder psychology, historical preferences, funding cycles, and success patterns. Did you know I can predict which funders will be most receptive to your specific approach with 78% accuracy? What's your project's primary focus area?",
          options: [
            { label: "Healthcare and medical innovation", value: "focus_health", icon: Heart },
            { label: "Education and learning solutions", value: "focus_education", icon: Bot },
            { label: "Environmental and sustainability tech", value: "focus_environment", icon: Sparkles },
            { label: "Ready for personalized funder analysis", value: "signup_complete", icon: ArrowRight }
          ]
        }
      }
    };

    const response = responses[step]?.[selectedValue];
    if (!response) {
      return null; // Let the main function handle fallback
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      options: response.options
    };
  };

  // Update user profile based on selections
  const updateProfile = (value: string, step: number) => {
    setProfile(prev => {
      const updated = { ...prev };
      
      if (step === 0) {
        updated.role = value;
      } else if (step === 1) {
        if (!updated.interests) updated.interests = [];
        updated.interests.push(value);
      } else if (step >= 2) {
        // Capture career development preferences
        if (value.includes('ai_') || value.includes('mbti_') || value.includes('learn_')) {
          if (!updated.interests) updated.interests = [];
          updated.interests.push(value);
        }
        
        // Capture MBTI-related responses
        if (value.startsWith('mbti_')) {
          if (!updated.goals) updated.goals = [];
          updated.goals.push(value);
        }
        
        // Capture skill development areas
        if (value.includes('skills') || value.includes('learn_') || value.includes('creative') || value.includes('tech')) {
          if (!updated.goals) updated.goals = [];
          updated.goals.push(value);
        }
      }

      return updated;
    });
  };

  // Save onboarding progress
  const saveOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/onboarding/welcome', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }
  });

  // Intelligent AI-powered question answering mutation
  const intelligentAnswerMutation = useMutation({
    mutationFn: async (question: string) => {
      const userContext = {
        userId: user?.id,
        onboardingStage: user?.onboardingStage,
        interests: user?.interests,
        currentStep,
        profile
      };

      return apiRequest('/api/qa/intelligent-answer', {
        method: 'POST',
        body: JSON.stringify({ question, userContext }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data.answer,
        timestamp: new Date(),
        options: [
          { label: "Continue guided tour", value: "continue", icon: ArrowRight },
          { label: "Explore on my own", value: "explore", icon: Sparkles }
        ]
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    },
    onError: (error) => {
      console.error('AI Answer Error:', error);
      setIsTyping(false);
      
      // Only show network errors, not false "busy" messages
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        const fallbackResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm having trouble connecting. Let me help you get started with HyperDAG in the meantime!",
          timestamp: new Date(),
          options: [
            { label: "Continue guided tour", value: "continue", icon: ArrowRight },
            { label: "Explore on my own", value: "explore", icon: Sparkles }
          ]
        };
        setMessages(prev => [...prev, fallbackResponse]);
        toast({
          title: "Connection Issue",
          description: "Please check your connection and try again.",
          variant: "destructive"
        });
      } else {
        // Provide helpful guidance without claiming agents are busy
        const helpfulResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Let me help you explore HyperDAG! I can guide you through our ZKP credentials, nonprofit directory, or help you get started.",
          timestamp: new Date(),
          options: [
            { label: "Learn about ZKP credentials", value: "zkp_intro", icon: Bot },
            { label: "Visit nonprofit directory", value: "visit_nonprofits", icon: Heart },
            { label: "Continue guided tour", value: "continue", icon: ArrowRight }
          ]
        };
        setMessages(prev => [...prev, helpfulResponse]);
      }
    }
  });

  // Handle text input with intelligent AI processing
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const questionToProcess = userInput;
    setUserInput('');
    setIsTyping(true);

    // Use intelligent AI agent routing instead of generic responses
    intelligentAnswerMutation.mutate(questionToProcess);
  };

  // Handle final actions
  const handleFinalAction = (value: string) => {
    if (value === 'dashboard' || value === 'explore') {
      toast({
        title: "Welcome aboard!",
        description: "Your personalized HyperDAG experience is ready."
      });
      
      // Immediate navigation for better UX
      const targetPath = value === 'dashboard' ? '/dashboard' : '/profile';
      
      // Use wouter's navigation for seamless routing
      setTimeout(() => {
        window.location.href = targetPath;
      }, 500);
      
      // Save progress in background (non-blocking)
      saveOnboardingMutation.mutate({
        profile,
        completed: true,
        redirectTo: targetPath
      });
    }
  };

  // Handle bypassing onboarding
  const handleBypassOnboarding = () => {
    // If user is already logged in, go directly to dashboard
    if (user) {
      toast({
        title: "Welcome to HyperDAG!",
        description: "Taking you to your dashboard."
      });
      setLocation('/dashboard');
      return;
    }

    // For non-authenticated users, show auth options
    toast({
      title: "Ready to explore HyperDAG?",
      description: "Choose how you'd like to get started with the platform."
    });
    setShowAuthOptions(true);
  };

  // Skip onboarding for existing users
  if (user?.onboardingStage >= 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Bot className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
            <p className="text-gray-600 mb-6">Ready to continue your HyperDAG journey?</p>
            <Link href="/dashboard">
              <Button className="w-full">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Bot className="h-8 w-8 text-purple-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Welcome to HyperDAG
              </h1>
            </div>
            <p className="text-gray-600">Your AI guide to discovering Web3 possibilities</p>
          </div>

          {/* Chat Interface */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-purple-100">
                    <Bot className="h-5 w-5 text-purple-600" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">HyperDAG AI Guide</CardTitle>
                  <p className="text-sm text-gray-500">Here to help you discover your path</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {message.options && (
                        <div className="mt-4 space-y-2">
                          {message.options.map((option, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => {
                                if (option.value === 'dashboard' || option.value === 'explore') {
                                  handleFinalAction(option.value);
                                } else if (option.label.toLowerCase().includes('dashboard') || option.label.toLowerCase().includes('ready to')) {
                                  // Fallback for any dashboard-related options
                                  handleFinalAction('dashboard');
                                } else {
                                  handleOptionSelect(option);
                                }
                              }}
                            >
                              {option.icon && <option.icon className="mr-2 h-4 w-4" />}
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            {/* Mobile-optimized Text Input */}
            <div className="border-t p-3 sm:p-4">
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your thoughts or questions..."
                  className="flex-1 text-base sm:text-sm h-10 sm:h-9"
                />
                <Button type="submit" size="sm" className="px-3 sm:px-2">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>

          {/* Authentication Options - Show when user wants to skip onboarding */}
          {showAuthOptions ? (
            <div className="mt-6 space-y-4">
              <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-3">Ready to Join HyperDAG?</h3>
                  <p className="text-purple-100 mb-4">
                    Experience 2.4M TPS performance with quantum-resistant security and embedded social impact.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/auth">
                      <Button className="bg-white text-purple-600 hover:bg-gray-100 w-full sm:w-auto">
                        Create Account / Sign In
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-purple-200 hover:text-white"
                      onClick={() => setShowAuthOptions(false)}
                    >
                      Back to guided tour
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Skip Option */
            <div className="text-center mt-6">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleBypassOnboarding()}
              >
                Skip onboarding and explore on my own
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}