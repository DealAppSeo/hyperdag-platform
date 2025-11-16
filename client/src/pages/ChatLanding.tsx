import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Share2, Copy, Heart, Sparkles, Zap, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

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

const features: UnlockedFeature[] = [
  { id: 'share', name: 'Share Conversation', description: 'Share this conversation with friends', icon: <Share2 className="w-4 h-4" />, unlockedAt: 3 },
  { id: 'save', name: 'Save Chat', description: 'Save conversations for later', icon: <Heart className="w-4 h-4" />, unlockedAt: 5 },
  { id: 'advanced', name: 'Advanced AI', description: 'Access premium AI models', icon: <Sparkles className="w-4 h-4" />, unlockedAt: 8 },
  { id: 'realtime', name: 'Real-time Collaboration', description: 'Chat with friends in real-time', icon: <Zap className="w-4 h-4" />, unlockedAt: 12 },
];

function ChatLanding() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI assistant. Ask me anything - I get smarter and unlock new features as we chat! 🚀",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>([]);
  const [showFeatureUnlock, setShowFeatureUnlock] = useState<UnlockedFeature | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkForFeatureUnlocks = (messageCount: number) => {
    const newUnlocks = features.filter(
      feature => feature.unlockedAt === messageCount && !unlockedFeatures.includes(feature.id)
    );
    
    if (newUnlocks.length > 0) {
      const feature = newUnlocks[0];
      setUnlockedFeatures(prev => [...prev, feature.id]);
      setShowFeatureUnlock(feature);
      setTimeout(() => setShowFeatureUnlock(null), 3000);
    }
  };

  const callRealAI = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationLength: messages.filter(m => m.isUser).length
        }),
      });

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      const data = await response.json();
      return data.response || 'I\'m having trouble responding right now. Try again!';
    } catch (error) {
      console.error('AI call failed:', error);
      // Fallback responses that encourage engagement
      const fallbacks = [
        "I'm experiencing a brief connection issue, but I'm getting stronger with each message! What else would you like to know?",
        "Let me try that again! The more we chat, the more features you unlock. Ask me anything!",
        "I'm working on improving my responses. Keep chatting to unlock new capabilities!"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      {/* Minimal Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold">AI Chat</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-purple-400">
            {getMessageCount()} messages • {unlockedFeatures.length} features unlocked
          </span>
          {unlockedFeatures.includes('share') && (
            <Button variant="ghost" size="sm" onClick={handleShare} data-testid="button-share">
              <Share2 className="w-4 h-4" />
            </Button>
          )}
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

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
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
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
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
        <div className="p-4 border-t border-white/10">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything... each message unlocks new features!"
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-500"
              disabled={isLoading}
              data-testid="input-chat"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Chat more to unlock features</span>
              <span>{Math.min(getMessageCount(), 12)}/12 to unlock all</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1 mt-1">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((getMessageCount() / 12) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Features Preview */}
      <AnimatePresence>
        {unlockedFeatures.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-4 top-1/2 transform -translate-y-1/2 space-y-2"
          >
            {unlockedFeatures.map((featureId) => {
              const feature = features.find(f => f.id === featureId);
              if (!feature) return null;
              
              return (
                <motion.div
                  key={feature.id}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 cursor-pointer"
                  data-testid={`feature-${feature.id}`}
                >
                  <div className="flex items-center space-x-1 text-white">
                    {feature.icon}
                    <span className="text-xs">{feature.name}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viral Footer */}
      <div className="p-4 text-center border-t border-white/10">
        <p className="text-white/60 text-sm">
          💬 Chat with AI • 🔓 Unlock features • 🚀 Share with friends to unlock bonus features
        </p>
      </div>
    </div>
  );
}

export default ChatLanding;