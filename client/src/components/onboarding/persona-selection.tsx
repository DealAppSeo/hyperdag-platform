import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Code, Palette, TrendingUp } from 'lucide-react';

// Persona data with descriptions and representative examples
const PERSONAS = [
  {
    id: 'developer',
    title: 'Developer',
    description: 'Build the future of Web3 with code',
    details: 'Contribute to cutting-edge blockchain projects, zero-knowledge systems, and decentralized applications',
    icon: Code,
    colorClass: 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300',
    titleClass: 'text-blue-600',
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
    examples: [
      'Frontend Engineers',
      'Smart Contract Developers',
      'ZKP Implementers',
      'DevOps & Infrastructure'
    ]
  },
  {
    id: 'designer',
    title: 'Designer',
    description: 'Shape user experiences for Web3',
    details: 'Design intuitive interfaces, create visual systems, and improve usability for complex blockchain applications',
    icon: Palette,
    colorClass: 'bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300',
    titleClass: 'text-orange-600',
    buttonClass: 'bg-orange-600 hover:bg-orange-700',
    examples: [
      'UX/UI Designers',
      'Visual Designers',
      'Interaction Designers',
      'Content Strategists'
    ]
  },
  {
    id: 'influencer',
    title: 'Influencer',
    description: 'Amplify Web3 ideas and communities',
    details: 'Build communities, create educational content, and help drive adoption of decentralized technologies',
    icon: TrendingUp,
    colorClass: 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300',
    titleClass: 'text-green-600',
    buttonClass: 'bg-green-600 hover:bg-green-700',
    examples: [
      'Community Managers',
      'Content Creators',
      'Educators',
      'Project Evangelists'
    ]
  }
];

interface PersonaSelectionProps {
  onSelectPersona: (persona: string) => void;
}

export default function PersonaSelection({ onSelectPersona }: PersonaSelectionProps) {
  const { toast } = useToast();
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handlePersonaClick = (personaId: string) => {
    setSelectedPersona(personaId);
  };
  
  const handleConfirm = async () => {
    if (!selectedPersona) {
      toast({
        title: "Please select a persona",
        description: "Choose the role that best describes you",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Call the onSelectPersona callback
      onSelectPersona(selectedPersona);
      
      toast({
        title: `Welcome ${getPersonaTitle(selectedPersona)}!`,
        description: "Your journey has been personalized based on your selection.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your persona selection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper to get persona title
  const getPersonaTitle = (personaId: string): string => {
    const persona = PERSONAS.find(p => p.id === personaId);
    return persona?.title || "Professional";
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="shadow-lg border-2 border-primary/20 mb-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl">Welcome to HyperDAG</CardTitle>
          <CardDescription className="text-lg max-w-2xl mx-auto">
            Tell us about your role so we can personalize your experience and show you the most relevant features.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PERSONAS.map(persona => {
          const isSelected = selectedPersona === persona.id;
          const IconComponent = persona.icon;
          
          return (
            <Card 
              key={persona.id}
              className={`relative transition-all duration-300 cursor-pointer border-2 ${
                isSelected ? `border-primary ring-2 ring-primary/30 ${persona.colorClass}` : 'border-border hover:border-primary/30'
              }`}
              onClick={() => handlePersonaClick(persona.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className={persona.titleClass}>{persona.title}</CardTitle>
                    <CardDescription className="mt-1">{persona.description}</CardDescription>
                  </div>
                  <div className={`p-2 rounded-full ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                    <IconComponent className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {persona.details}
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Examples:</p>
                  <ul className="text-sm space-y-1">
                    {persona.examples.map((example, index) => (
                      <li key={index} className="flex items-center">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${isSelected ? 'bg-primary' : 'bg-muted-foreground'}`}></span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  variant={isSelected ? "default" : "outline"}
                  className={`w-full ${isSelected ? persona.buttonClass : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePersonaClick(persona.id);
                  }}
                >
                  {isSelected ? "Selected" : "Select"}
                </Button>
              </CardFooter>
              
              {isSelected && (
                <div className="absolute top-2 right-2 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-white rounded-full"></div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      
      <div className="mt-8 flex justify-center">
        <Button 
          size="lg" 
          onClick={handleConfirm}
          disabled={!selectedPersona || isSubmitting}
          className="px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          You can always change your persona later in your profile settings.
        </p>
      </div>
    </div>
  );
}