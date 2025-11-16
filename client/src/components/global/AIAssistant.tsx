import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Send, X, MessageCircle, Minimize2, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AIMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  agentUsed?: string;
  category?: string;
}

interface ConversationHistory {
  messages: AIMessage[];
  lastUpdated: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export default function AIAssistant({ isOpen, onToggle, className = '' }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get user context for better AI responses
  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  // AI Agent Status (NO POLLING)
  const { data: agentStatus, refetch: refetchAgentStatus } = useQuery({
    queryKey: ['/api/qa/agent-status'],
    refetchInterval: false, // ❌ NO POLLING - eliminated 1 req/min
    enabled: isOpen
  });

  // Load conversation history from localStorage on component mount
  useEffect(() => {
    if (isOpen && user?.id) {
      const storageKey = `hyperdag_ai_conversation_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const history: ConversationHistory = JSON.parse(stored);
          // Only load recent messages (last 24 hours)
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const recentMessages = history.messages.filter(
            msg => new Date(msg.timestamp) > dayAgo
          );
          setMessages(recentMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        } catch (error) {
          console.warn('Failed to load AI conversation history:', error);
        }
      }
    }
  }, [isOpen, user?.id]);

  // Save conversation history to localStorage
  const saveConversationHistory = useCallback((newMessages: AIMessage[]) => {
    if (user?.id) {
      const storageKey = `hyperdag_ai_conversation_${user.id}`;
      const history: ConversationHistory = {
        messages: newMessages,
        lastUpdated: new Date()
      };
      localStorage.setItem(storageKey, JSON.stringify(history));
    }
  }, [user?.id]);

  // Intelligent AI response mutation
  const askAIMutation = useMutation({
    mutationFn: async (question: string) => {
      const userContext = {
        userId: user?.id,
        onboardingStage: user?.onboardingStage,
        interests: user?.interests,
        currentPage: window.location.pathname,
        conversationHistory: messages.slice(-10), // Include last 10 messages for context
        userGoals: user?.activeGoals || [],
        currentProject: user?.currentProject
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
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data.answer,
        timestamp: new Date(),
        agentUsed: data.data.agentUsed,
        category: data.data.category
      };
      const updatedMessages = [...messages, aiResponse];
      setMessages(updatedMessages);
      saveConversationHistory(updatedMessages);
    },
    onError: (error) => {
      console.error('AI Assistant Error:', error);
      // Only show fallback if it's a real network/server error
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        const fallbackResponse: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
          timestamp: new Date(),
          agentUsed: 'fallback'
        };
        setMessages(prev => [...prev, fallbackResponse]);
        toast({
          title: "Connection Issue",
          description: "Please check your internet connection and try again.",
          variant: "destructive"
        });
      } else {
        // For other errors, provide a more helpful message focused on immediate value
        const helpfulResponse: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I can help you maximize your HyperDAG experience! Try asking about sharing your referral code, finding grants, connecting with collaborators, or building your reputation.",
          timestamp: new Date(),
          agentUsed: 'system'
        };
        setMessages(prev => [...prev, helpfulResponse]);
      }
    }
  });

  // Generate persona-driven welcome message
  const getPersonaWelcomeMessage = (user: any): string => {
    const persona = user.persona?.toLowerCase() || '';
    const hasReferralCode = user.referralCode;
    
    let welcomeContent = "🎉 Welcome to HyperDAG! ";
    
    // DeFi/Investor/Influencer personas - scarcity and early adoption messaging
    if (persona.includes('defi') || persona.includes('investor') || persona.includes('influencer') || 
        persona.includes('entrepreneur') || persona.includes('trader')) {
      welcomeContent += "Imagine if someone gave you Bitcoin back in 2015... 💰\n\n";
      welcomeContent += "HyperDAG has limited monthly token distributions - you earn tokens by giving tokens away! ";
      welcomeContent += "Get your friends and family onboard while tokens are still available.\n\n";
      welcomeContent += `📨 Your referral code: **${hasReferralCode}** - Share it everywhere!\n`;
      welcomeContent += "💡 **Quick wins:** Share on social media, invite 5 friends, earn while they earn!";
    }
    // Social good/nonprofit personas
    else if (persona.includes('nonprofit') || persona.includes('social') || persona.includes('community') ||
             persona.includes('activist') || persona.includes('volunteer')) {
      welcomeContent += "Ready to amplify your impact? 🌍\n\n";
      welcomeContent += "Promote your favorite nonprofit or social cause - when people join through your link, ";
      welcomeContent += "both you AND your cause receive tokens!\n\n";
      welcomeContent += `🎯 Your referral code: **${hasReferralCode}** - Share it to support your causes!\n`;
      welcomeContent += "💡 **Quick wins:** Add your nonprofit, share your mission, build a community!";
    }
    // Career-focused/job seekers/professionals
    else if (persona.includes('developer') || persona.includes('professional') || persona.includes('student') ||
             persona.includes('career') || persona.includes('freelancer')) {
      welcomeContent += "Transform uncertainty into opportunity! 🚀\n\n";
      welcomeContent += "Whether AI threatens your job or you want to stay ahead - HyperDAG lets you earn as you learn. ";
      welcomeContent += "Master AI & Web3 tools, build your reputation, connect with recruiters.\n\n";
      welcomeContent += `⭐ Your referral code: **${hasReferralCode}** - Network and earn together!\n`;
      welcomeContent += "💡 **Quick wins:** Complete skill challenges, share achievements, build your portfolio!";
    }
    // Default welcome for others
    else {
      welcomeContent += "You're early to something special! 🌟\n\n";
      welcomeContent += "HyperDAG rewards you for building community. Share your referral code, ";
      welcomeContent += "invite friends, and earn tokens together!\n\n";
      welcomeContent += `🔗 Your referral code: **${hasReferralCode}** - Start sharing!\n`;
      welcomeContent += "💡 **Quick wins:** Invite friends, share on social, explore grants!";
    }
    
    return welcomeContent;
  };

  // Initial personalized welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0 && user) {
      const welcomeContent = getPersonaWelcomeMessage(user);

      const welcomeMessage: AIMessage = {
        id: '1',
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date(),
        agentUsed: 'system'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || askAIMutation.isPending) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveConversationHistory(updatedMessages);
    const questionToProcess = userInput;
    setUserInput('');
    askAIMutation.mutate(questionToProcess);
  };

  const clearConversation = () => {
    setMessages([]);
    // Re-add personalized welcome message
    if (user) {
      const welcomeContent = getPersonaWelcomeMessage(user);
      const welcomeMessage: AIMessage = {
        id: '1',
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date(),
        agentUsed: 'system'
      };
      setMessages([welcomeMessage]);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className={`fixed bottom-4 right-4 w-80 sm:w-96 h-96 flex flex-col shadow-xl border-2 z-50 transition-all duration-200 ${isMinimized ? 'h-14' : ''} ${className}`}>
      {/* Header */}
      <CardHeader className="pb-2 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-sm font-medium">AI Assistant</CardTitle>
            {agentStatus?.data?.availableAgents && (
              <Badge variant="outline" className="text-xs">
                {agentStatus.data.availableAgents}/{agentStatus.data.totalAgents} agents
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0"
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                          <Bot className="h-2 w-2" />
                        </AvatarFallback>
                      </Avatar>
                      {message.agentUsed && message.agentUsed !== 'system' && message.agentUsed !== 'fallback' && (
                        <Badge variant="secondary" className="text-xs">
                          {message.agentUsed}
                        </Badge>
                      )}
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}

            {askAIMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Action Buttons - Show after welcome message */}
            {messages.length <= 2 && user && (
              <div className="space-y-2 mt-3">
                <div className="text-xs text-gray-500 mb-2">Quick Actions:</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setUserInput("How do I share my referral code effectively?");
                      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                      handleSubmit(syntheticEvent);
                    }}
                  >
                    📨 Share Referral Code
                  </Button>
                  
                  {(user.persona?.toLowerCase().includes('investor') || 
                    user.persona?.toLowerCase().includes('defi') || 
                    user.persona?.toLowerCase().includes('entrepreneur')) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setUserInput("What's the best way to maximize token earnings?");
                        const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                        handleSubmit(syntheticEvent);
                      }}
                    >
                      💰 Maximize Tokens
                    </Button>
                  )}
                  
                  {(user.persona?.toLowerCase().includes('nonprofit') || 
                    user.persona?.toLowerCase().includes('social') || 
                    user.persona?.toLowerCase().includes('community')) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setUserInput("How can I add my nonprofit and get support?");
                        const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                        handleSubmit(syntheticEvent);
                      }}
                    >
                      🌍 Support My Cause
                    </Button>
                  )}
                  
                  {(user.persona?.toLowerCase().includes('developer') || 
                    user.persona?.toLowerCase().includes('professional') || 
                    user.persona?.toLowerCase().includes('student')) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setUserInput("How do I build my reputation and connect with opportunities?");
                        const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                        handleSubmit(syntheticEvent);
                      }}
                    >
                      🚀 Build Reputation
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setUserInput("Show me available grants I can apply for");
                      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                      handleSubmit(syntheticEvent);
                    }}
                  >
                    💼 Find Grants
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setUserInput("How do I connect with other members for collaboration?");
                      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                      handleSubmit(syntheticEvent);
                    }}
                  >
                    🤝 Find Collaborators
                  </Button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t p-3 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 text-sm"
                disabled={askAIMutation.isPending}
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={askAIMutation.isPending || !userInput.trim()}
                className="px-3"
              >
                <Send className="h-3 w-3" />
              </Button>
            </form>
            <div className="flex justify-between items-center mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="text-xs h-6"
              >
                Clear chat
              </Button>
              {agentStatus?.data?.availableAgents === 0 && (
                <Badge variant="destructive" className="text-xs">
                  Agents at capacity
                </Badge>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}