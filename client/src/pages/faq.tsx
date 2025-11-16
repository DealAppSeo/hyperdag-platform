import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Code, Users, Heart, Lock, Globe, Zap, Award } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon?: React.ReactNode;
}

export default function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqItems: FAQItem[] = [
    {
      id: 'security',
      question: 'How secure is my data on HyperDAG?',
      answer: 'All your personal information on HyperDAG is protected with AES-256 military-grade encryption - the same security standard used by government agencies and major financial institutions. Your data is encrypted before storage and only you have access to your private information.',
      category: 'security',
      icon: <Shield className="h-5 w-5 text-blue-600" />
    },
    {
      id: 'opensource',
      question: 'Is HyperDAG really open source?',
      answer: 'Yes, HyperDAG is completely open source. Our entire codebase is transparent and auditable by anyone. You can see exactly how your data is handled, review our security implementations, and even contribute to the platform\'s development. This ensures complete transparency and trust.',
      category: 'transparency',
      icon: <Code className="h-5 w-5 text-green-600" />
    },
    {
      id: 'founders_equity',
      question: 'Do the founders take equity in HyperDAG?',
      answer: 'No, HyperDAG\'s founders have taken zero equity in the platform. They can only earn value the same way everyone else does - by providing value to the ecosystem. This ensures complete alignment between the founders and the community, removing any conflicts of interest.',
      category: 'transparency',
      icon: <Users className="h-5 w-5 text-purple-600" />
    },
    {
      id: 'privacy_design',
      question: 'How does HyperDAG protect my privacy?',
      answer: 'HyperDAG is built with privacy by design. We use zero-knowledge proofs and privacy-preserving technologies so you can verify your credentials without revealing sensitive information. Your data belongs to you, and we only use it to provide the services you request.',
      category: 'security',
      icon: <Lock className="h-5 w-5 text-indigo-600" />
    },
    {
      id: 'what_is_hyperdag',
      question: 'What is HyperDAG?',
      answer: 'HyperDAG is a Web3 and AI platform focused on social impact discovery. We create a collaborative ecosystem where purpose-driven individuals and organizations can connect, find funding opportunities, and make meaningful impact together.',
      category: 'platform',
      icon: <Globe className="h-5 w-5 text-blue-500" />
    },
    {
      id: 'how_earn_value',
      question: 'How can I earn value on HyperDAG?',
      answer: 'Everyone on HyperDAG earns value the same way - by providing value to the ecosystem. This can include mentoring others, contributing to projects, sharing knowledge, connecting people, or participating in grant-funded initiatives. Our reputation system rewards meaningful contributions.',
      category: 'platform',
      icon: <Zap className="h-5 w-5 text-yellow-600" />
    },
    {
      id: 'grants_funding',
      question: 'How does grant matching work?',
      answer: 'Our AI-powered grant discovery system analyzes your profile, skills, and project needs to match you with relevant funding opportunities. We scan hundreds of grant sources to find the best fits for your nonprofit, startup, or personal development goals.',
      category: 'platform',
      icon: <Award className="h-5 w-5 text-green-500" />
    },
    {
      id: 'community_driven',
      question: 'What makes HyperDAG community-driven?',
      answer: 'HyperDAG is governed by its community. Major decisions are made transparently with community input. Since founders have no equity, there\'s no central authority extracting value. The platform exists to serve its users, not shareholders.',
      category: 'transparency',
      icon: <Heart className="h-5 w-5 text-red-500" />
    },
    {
      id: 'data_ownership',
      question: 'Who owns my data?',
      answer: 'You own your data completely. HyperDAG uses military-grade encryption to protect your information, and you control what data you share and with whom. We never sell your data or use it for advertising. Your privacy is non-negotiable.',
      category: 'security',
      icon: <Shield className="h-5 w-5 text-blue-600" />
    },
    {
      id: 'getting_started',
      question: 'How do I get started on HyperDAG?',
      answer: 'Getting started is simple: create your account, complete the persona discovery questionnaire to help us understand your goals, and explore the personalized recommendations we provide. The platform will guide you through connecting with relevant opportunities and people.',
      category: 'platform',
      icon: <Zap className="h-5 w-5 text-blue-500" />
    }
  ];

  const categories = [
    { id: 'all', label: 'All Questions', icon: <Globe className="h-4 w-4" /> },
    { id: 'security', label: 'Security & Privacy', icon: <Shield className="h-4 w-4" /> },
    { id: 'transparency', label: 'Transparency', icon: <Code className="h-4 w-4" /> },
    { id: 'platform', label: 'Platform', icon: <Users className="h-4 w-4" /> }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqItems 
    : faqItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Learn about HyperDAG's security, transparency, and community-driven approach
          </p>
        </div>

        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Your Security is Our Priority:</strong> All information is protected with military-grade AES-256 encryption. 
            Our open-source approach ensures complete transparency in how we handle your data.
          </AlertDescription>
        </Alert>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-blue-50'
              }`}
            >
              {category.icon}
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              {selectedCategory === 'all' ? 'All Questions' : categories.find(c => c.id === selectedCategory)?.label}
            </CardTitle>
            <CardDescription>
              {selectedCategory === 'security' && 'Learn about our military-grade security and privacy protection'}
              {selectedCategory === 'transparency' && 'Discover how HyperDAG ensures complete transparency and community alignment'}
              {selectedCategory === 'platform' && 'Understand how HyperDAG works and how you can benefit'}
              {selectedCategory === 'all' && 'Everything you need to know about HyperDAG'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      {faq.icon}
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700 leading-relaxed pl-8">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Key Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="text-center">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Military-Grade Security</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-700">
                AES-256 encryption protects all your data with the same security used by government agencies
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <Code className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Fully Open Source</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-700">
                Complete transparency with auditable code and community-driven development
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Zero Equity Founders</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-700">
                Founders earn value the same way as everyone else - by contributing to the ecosystem
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}