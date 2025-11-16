import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoute } from 'wouter';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

function SharedChat() {
  const [, params] = useRoute('/chat/:id');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      try {
        const decodedMessages = JSON.parse(atob(params.id));
        setMessages(decodedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Failed to decode shared chat:', error);
      }
    }
    setLoading(false);
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading shared conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold">Shared AI Chat</span>
        </div>
        <Button 
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
          data-testid="button-start-chat"
        >
          Start Your Own Chat
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </header>

      {/* Chat Preview */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 text-sm mb-4"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Someone shared this AI conversation with you!</span>
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">
            See what's possible with <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AI Chat</span>
          </h1>
          <p className="text-xl text-white/70">
            Every message unlocks new features. Start your own conversation to experience it all.
          </p>
        </div>

        {/* Messages Preview */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isUser
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                  data-testid={`shared-message-${index}`}
                >
                  {message.text}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button 
              size="lg"
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 mb-4"
              data-testid="button-start-own-chat"
            >
              Start Your Own AI Chat
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-white/60 text-sm">
              🚀 Unlock features as you chat • 💬 Share with friends • 🎉 Completely free
            </p>
          </motion.div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Progressive Unlocks', desc: 'New features appear as you chat more', icon: '🔓' },
            { title: 'Instant Sharing', desc: 'Share conversations with one click', icon: '🚀' },
            { title: 'Smart AI', desc: 'Gets better and more capable with use', icon: '🧠' }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="bg-white/5 rounded-lg p-6 border border-white/10 text-center"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/70 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SharedChat;