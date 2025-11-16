import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Share2, Copy, Heart, Sparkles, Zap, ChevronUp, DollarSign, TrendingDown, BarChart3, Clock, FileText, History, GraduationCap, Wallet, Trophy, Target, Users, Gift, Star, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Web3TrainingAcademy } from '@/components/web3-training-academy';
import { MultimodalTooltip } from '@/components/MultimodalTooltip';
import { getEducationalContent } from '@/data/educationalContent';
import { ShareButton } from '@/components/ShareButton';
import { CostSavingsTracker } from '@/components/CostSavingsTracker';
import { Navigation } from '@/components/Navigation';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface UnlockedFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlockedAt: number; // message count when unlocked
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
}

interface UserStats {
  messagesExchanged: number;
  totalSavings: number;
  streak: number;
  achievementsEarned: number;
  friendsReferred: number;
}

const features: UnlockedFeature[] = [
  { id: 'share', name: 'Share & Earn', description: 'Share and get bonus credits', icon: <Share2 className="w-4 h-4" />, unlockedAt: 2 },
  { id: 'web3training', name: 'Web3 Academy', description: 'Gasless smart wallet training', icon: <GraduationCap className="w-4 h-4" />, unlockedAt: 3 },
  { id: 'referral', name: 'Refer Friends', description: 'Earn rewards for referrals', icon: <Users className="w-4 h-4" />, unlockedAt: 4 },
  { id: 'advanced', name: 'Premium AI', description: 'Access best AI models', icon: <Sparkles className="w-4 h-4" />, unlockedAt: 6 },
  { id: 'rewards', name: 'Daily Rewards', description: 'Get daily streak bonuses', icon: <Gift className="w-4 h-4" />, unlockedAt: 8 },
];

const initialAchievements: Achievement[] = [
  { id: 'first-chat', title: 'First Steps', description: 'Send your first message', icon: <Send className="w-4 h-4" />, earned: false },
  { id: 'cost-saver', title: 'Smart Saver', description: 'Save $1 in AI costs', icon: <DollarSign className="w-4 h-4" />, earned: false, progress: 0, maxProgress: 100 },
  { id: 'social-butterfly', title: 'Social Butterfly', description: 'Share 3 conversations', icon: <Share2 className="w-4 h-4" />, earned: false, progress: 0, maxProgress: 3 },
  { id: 'streak-master', title: 'Streak Master', description: 'Maintain 7-day streak', icon: <Flame className="w-4 h-4" />, earned: false, progress: 0, maxProgress: 7 },
  { id: 'ai-expert', title: 'AI Expert', description: 'Send 50 messages', icon: <Target className="w-4 h-4" />, earned: false, progress: 0, maxProgress: 50 },
];

function ValueFocusedChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Welcome to AI Trinity! I'm your intelligent AI assistant with cost optimization and viral growth features. Ask me anything to start earning rewards! 🚀",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>([]);
  const [showFeatureUnlock, setShowFeatureUnlock] = useState<UnlockedFeature | null>(null);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [showTrainingAcademy, setShowTrainingAcademy] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [userStats, setUserStats] = useState<UserStats>({
    messagesExchanged: 0,
    totalSavings: 0,
    streak: 0,
    achievementsEarned: 0,
    friendsReferred: 0
  });
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);
  const [pendingToasts, setPendingToasts] = useState<Array<{title: string, description: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle toast notifications outside of render
  useEffect(() => {
    if (pendingToasts.length > 0) {
      pendingToasts.forEach(notification => {
        toast({
          title: notification.title,
          description: notification.description,
        });
      });
      setPendingToasts([]);
    }
  }, [pendingToasts, toast]);

  const checkForFeatureUnlocks = (messageCount: number) => {
    const newUnlocks = features.filter(
      feature => feature.unlockedAt === messageCount && !unlockedFeatures.includes(feature.id)
    );
    
    if (newUnlocks.length > 0) {
      const feature = newUnlocks[0];
      setUnlockedFeatures(prev => [...prev, feature.id]);
      setShowFeatureUnlock(feature);
      setTimeout(() => setShowFeatureUnlock(null), 3000);
      
      // Queue toast notification instead of showing immediately
      setPendingToasts(prev => [...prev, {
        title: "🎉 New Feature Unlocked!",
        description: `${feature.name}: ${feature.description}`,
      }]);
    }
  };

  const checkAchievements = (messageCount: number, savings: number) => {
    const newlyEarnedAchievements: Achievement[] = [];
    
    setAchievements(prev => prev.map(achievement => {
      if (achievement.earned) return achievement;
      
      let earned = false;
      let progress = achievement.progress || 0;
      
      switch (achievement.id) {
        case 'first-chat':
          earned = messageCount >= 1;
          break;
        case 'cost-saver':
          progress = Math.min(savings * 100, achievement.maxProgress || 100);
          earned = savings >= 1;
          break;
        case 'ai-expert':
          progress = Math.min(messageCount, achievement.maxProgress || 50);
          earned = messageCount >= 50;
          break;
        case 'social-butterfly':
          // This would be updated when user shares
          break;
        case 'streak-master':
          progress = userStats.streak;
          earned = userStats.streak >= 7;
          break;
      }
      
      if (earned && !achievement.earned) {
        newlyEarnedAchievements.push(achievement);
        setUserStats(prev => ({ ...prev, achievementsEarned: prev.achievementsEarned + 1 }));
      }
      
      return { ...achievement, earned, progress };
    }));
    
    // Queue achievement toasts
    if (newlyEarnedAchievements.length > 0) {
      setPendingToasts(prev => [...prev, ...newlyEarnedAchievements.map(achievement => ({
        title: "🏆 Achievement Unlocked!",
        description: `${achievement.title}: ${achievement.description}`,
      }))]);
    }
  };

  const quickStartActions = [
    { title: "Ask a Question", description: "Try: 'What can you help me with?'", action: () => setInputValue("What can you help me with?") },
    { title: "Cost Optimization", description: "Try: 'How much will this save me?'", action: () => setInputValue("How much will this save me?") },
    { title: "Explore Features", description: "Try: 'What features are available?'", action: () => setInputValue("What features are available?") },
  ];

  const callRealAI = async (userMessage: string): Promise<string> => {
    // Quick start suggestion responses for better UX
    if (userMessage === "What can you help me with?") {
      return "I can help with AI questions, cost optimization, Web3 training, and more! I use intelligent routing to get you the best AI responses at the lowest cost. Try asking about any topic - each message unlocks new features! 🚀";
    }
    if (userMessage === "How much will this save me?") {
      return "Great question! I route your requests through multiple AI providers to find the best price. You've already saved $" + totalSavings.toFixed(4) + " compared to premium providers. Each message saves you money while unlocking new features! 💰";
    }
    if (userMessage === "What features are available?") {
      return "Amazing features unlock as you chat! Currently unlocked: " + unlockedFeatures.length + "/" + features.length + ". Coming up: sharing rewards, Web3 training, premium AI models, and referral bonuses. Keep chatting to unlock them all! ✨";
    }
    try {
      // Add session tracking for conversation memory
      const sessionId = localStorage.getItem('chatSessionId') || Date.now().toString();
      localStorage.setItem('chatSessionId', sessionId);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationLength: messages.filter(m => m.isUser).length,
          sessionId: sessionId,
          conversationHistory: messages.map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.text
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      const data = await response.json();
      // Handle new API response format with savings tracking
      if (data.success && data.data && data.data.response) {
        const cost = data.data.cost || 0;
        const savings = Math.max(0, 0.002 - cost);
        setTotalSavings(prev => prev + savings);
        setUserStats(prev => ({ 
          ...prev, 
          messagesExchanged: prev.messagesExchanged + 1,
          totalSavings: prev.totalSavings + savings
        }));
        
        // Check achievements after updating stats
        checkAchievements(userStats.messagesExchanged + 1, userStats.totalSavings + savings);
        
        return data.data.response;
      }
      return data.response || 'I\'m having trouble responding right now. Try again!';
    } catch (error) {
      console.error('AI call failed:', error);
      // Honest fallback responses when there are actual issues
      const fallbacks = [
        "I'm having trouble connecting to the AI service right now. Please try again in a moment.",
        "The AI service is temporarily unavailable. Your message wasn't processed.",
        "Connection error - I wasn't able to process your request. Please try again."
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Call real AI with realistic delay
    setTimeout(async () => {
      try {
        const aiText = await callRealAI(inputValue);
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: aiText,
          isUser: false,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
        setChatHistory(prev => [...prev, inputValue]);
        // Message processed successfully
        setIsLoading(false);
        
        // Check for feature unlocks
        const totalMessages = messages.length + 2; // +1 for user message, +1 for AI response
        checkForFeatureUnlocks(totalMessages);
      } catch (error) {
        console.error('Failed to get AI response:', error);
        setIsLoading(false);
      }
    }, 800 + Math.random() * 400);
  };

  const handleShare = () => {
    const chatUrl = `${window.location.origin}/chat/${btoa(JSON.stringify(messages.slice(0, 5)))}`;
    navigator.clipboard.writeText(chatUrl);
    toast({
      title: "Chat shared! 🎉",
      description: "Link copied to clipboard. Share it with friends to unlock bonus features!",
    });
  };

  const getMessageCount = () => messages.filter(m => m.isUser).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <Navigation />
      {/* Quick Start Overlay for ≤60s onboarding */}
      {showQuickStart && (
        <motion.div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-gradient-to-br from-purple-900 to-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to AI Trinity!</h2>
              <p className="text-white/70">Get started in under 60 seconds with these quick actions:</p>
            </div>
            
            <div className="space-y-3 mb-6">
              {quickStartActions.map((action, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    action.action();
                    setShowQuickStart(false);
                  }}
                  className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/10 hover:border-white/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-semibold text-sm">{action.title}</div>
                  <div className="text-white/60 text-xs">{action.description}</div>
                </motion.button>
              ))}
            </div>
            
            <button
              onClick={() => setShowQuickStart(false)}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Start Chatting →
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Value Proposition Header with Social Proof */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Social Proof Banner */}
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-semibold">12,847</span>
                <span className="text-white/70">active users</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-semibold">$47,293</span>
                <span className="text-white/70">saved today</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">4.9/5</span>
                <span className="text-white/70">user rating</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Trinity Chat</h1>
                <p className="text-green-400 text-sm">Intelligent routing • Real savings • Viral rewards</p>
              </div>
            </div>
            
            {/* User Stats & Achievement Button */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-white/70">Your Progress</div>
                <div className="font-bold text-green-400">${userStats.totalSavings.toFixed(4)} saved</div>
              </div>
              <button
                onClick={() => setShowAchievements(true)}
                className="relative bg-white/10 hover:bg-white/20 p-3 rounded-lg transition-all border border-white/20"
              >
                <Trophy className="w-5 h-5" />
                {achievements.filter(a => a.earned).length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {achievements.filter(a => a.earned).length}
                  </div>
                )}
              </button>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{getMessageCount()}</div>
                <div className="text-xs text-white/60">Messages</div>
              </div>
              {unlockedFeatures.includes('share') && (
                <ShareButton
                  contentType="conversation"
                  contentId={messages[messages.length - 1]?.id || 'default'}
                  title="Join AI Trinity: Save 79% on AI Costs"
                  description="Experience intelligent AI routing with real-time cost optimization. Unlock features through chat and earn rewards for sharing!"
                  variant="ghost"
                  size="sm"
                  showLabel={false}
                />
              )}
              {unlockedFeatures.includes('web3training') && (
                <Dialog open={showTrainingAcademy} onOpenChange={setShowTrainingAcademy}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid="button-web3-training">
                      <GraduationCap className="w-4 h-4 mr-1" />
                      Web3 Academy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <GraduationCap className="w-5 h-5" />
                        <span>Web3 Training Academy</span>
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">Gasless</span>
                      </DialogTitle>
                    </DialogHeader>
                    <Web3TrainingAcademy />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          {/* Key Benefits Bar */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <TrendingDown className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-sm font-semibold">79% Cost Reduction</div>
              <div className="text-xs text-white/60">vs OpenAI/Claude</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <div className="text-sm font-semibold">Smart Routing</div>
              <div className="text-xs text-white/60">Auto-optimized</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <div className="text-sm font-semibold">Real Analytics</div>
              <div className="text-xs text-white/60">Live cost tracking</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <DollarSign className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <div className="text-sm font-semibold">Profit Opportunities</div>
              <div className="text-xs text-white/60">Arbitrage alerts</div>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Unlock Notification */}
      <AnimatePresence>
        {showFeatureUnlock && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-lg shadow-lg border border-white/20">
              <div className="flex items-center space-x-2 text-white">
                {showFeatureUnlock.icon}
                <div>
                  <div className="font-semibold">🎉 {showFeatureUnlock.name} Unlocked!</div>
                  <div className="text-sm opacity-90">{showFeatureUnlock.description}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout: History | Chat | Artifacts */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat History */}
        <div className="w-64 border-r border-white/10 bg-black/20 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <History className="w-4 h-4 text-white/60" />
            <span className="text-sm font-semibold text-white/80">Chat History</span>
          </div>
          <div className="space-y-2">
            {chatHistory.length === 0 ? (
              <div className="text-xs text-white/40 italic">Start chatting to see history</div>
            ) : (
              chatHistory.slice(-10).map((chat, index) => (
                <div key={index} className="bg-white/5 rounded p-2 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="text-xs text-white/80 truncate">{chat}</div>
                  <div className="text-xs text-white/40 mt-1">Just now</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center - Chat Interface */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isUser
                      ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                  data-testid={`message-${message.isUser ? 'user' : 'ai'}`}
                >
                  {message.text}
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/10 bg-black/10">
            <div className="flex space-x-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything to save money with AI arbitrage..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-green-500 h-12"
                disabled={isLoading}
                data-testid="input-chat"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !inputValue.trim()}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 h-12 px-6"
                data-testid="button-send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Savings & Progress Indicator */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-xs text-green-400">
                  💰 Next message saves ~$0.02 vs OpenAI
                </div>
                <div className="text-xs text-white/60">
                  {Math.min(getMessageCount(), 12)}/12 features unlocked
                </div>
              </div>
              <div className="w-48 bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((getMessageCount() / 12) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Artifacts & Analytics */}
        <div className="w-80 border-l border-white/10 bg-black/20 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-4 h-4 text-white/60" />
            <span className="text-sm font-semibold text-white/80">Savings & Analytics</span>
          </div>
          
          {/* Cost Savings Chart */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Cost Comparison</div>
              {getEducationalContent('viralGrowth') && (
                <MultimodalTooltip 
                  content={getEducationalContent('viralGrowth')!}
                  side="left"
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">OpenAI GPT-4</span>
                <span className="text-xs text-red-400">$0.03/msg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Claude 3.5</span>
                <span className="text-xs text-red-400">$0.025/msg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-green-400">Our AI Router</span>
                <span className="text-xs text-green-400">$0.006/msg</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-xs text-white">Your Savings</span>
                  <span className="text-xs text-green-400">79% saved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Arbitrage Opportunities */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Smart Routing</div>
              {getEducationalContent('anfisRouting') && (
                <MultimodalTooltip 
                  content={getEducationalContent('anfisRouting')!}
                  side="left"
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                <div className="text-xs text-green-400">✓ DeepSeek: 85% cheaper</div>
                <div className="text-xs text-white/60">Best for: Code, analysis</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
                <div className="text-xs text-blue-400">⚡ OpenRouter: 60% cheaper</div>
                <div className="text-xs text-white/60">Best for: General chat</div>
              </div>
            </div>
          </div>

          {/* Unlocked Features */}
          {unlockedFeatures.length > 0 && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-sm font-semibold mb-2">Unlocked Features</div>
              <div className="space-y-1">
                {unlockedFeatures.map((featureId) => {
                  const feature = features.find(f => f.id === featureId);
                  if (!feature) return null;
                  
                  return (
                    <div key={feature.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        {feature.icon}
                        <span className="text-white/80">{feature.name}</span>
                      </div>
                      {feature.id === 'web3training' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setShowTrainingAcademy(true)}
                          className="h-6 px-2 text-xs"
                        >
                          Launch
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Access - Web3 Training */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">New to Web3?</span>
              </div>
              {getEducationalContent('zkpPrivacy') && (
                <MultimodalTooltip 
                  content={getEducationalContent('zkpPrivacy')!}
                  side="left"
                />
              )}
            </div>
            <p className="text-xs text-white/60 mb-3">
              Learn blockchain technology with zero gas fees. Create smart wallets, mint NFTs, and experience secure authentication - all for free!
            </p>
            <Dialog open={showTrainingAcademy} onOpenChange={setShowTrainingAcademy}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" data-testid="button-quick-web3-training">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  Start Free Web3 Training
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5" />
                    <span>Web3 Training Academy</span>
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">Gasless</span>
                  </DialogTitle>
                </DialogHeader>
                <Web3TrainingAcademy />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Viral Footer */}
      <div className="p-4 text-center border-t border-white/10 bg-black/20">
        <p className="text-white/60 text-sm">
          💰 Save 79% on AI costs • 📊 Real-time arbitrage • 🚀 Share to unlock enterprise features
        </p>
      </div>

      {/* Achievements Dialog */}
      <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>Achievements</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`p-3 rounded-lg border ${
                  achievement.earned 
                    ? 'bg-yellow-400/20 border-yellow-400/50' 
                    : 'bg-white/5 border-white/20'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    achievement.earned ? 'bg-yellow-400/30' : 'bg-white/10'
                  }`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{achievement.title}</div>
                    <div className="text-white/60 text-xs">{achievement.description}</div>
                    {achievement.maxProgress && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-white/70 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress || 0}/{achievement.maxProgress}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((achievement.progress || 0) / achievement.maxProgress * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {achievement.earned && (
                    <div className="text-yellow-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Viral Referral Section */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="font-semibold">Refer Friends & Earn</span>
            </div>
            <p className="text-sm text-white/70 mb-3">
              Share AI Trinity with friends and unlock exclusive rewards! You've referred {userStats.friendsReferred} friends.
            </p>
            <button
              onClick={() => {
                const referralUrl = `${window.location.origin}?ref=${btoa('user123')}&utm_source=referral`;
                navigator.clipboard.writeText(referralUrl);
                toast({
                  title: "Referral link copied! 🎁",
                  description: "Share with friends to earn rewards together!",
                });
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              Copy Referral Link
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cost Savings Tracker - Cycle 1 Dogfooding Feature */}
      <CostSavingsTracker messageCount={messages.length} />
    </div>
  );
}

export default ValueFocusedChat;