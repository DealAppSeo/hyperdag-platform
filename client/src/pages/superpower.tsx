import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { 
  Heart, 
  Globe,
  DollarSign,
  Award,
  Star,
  BookOpen,
  Lightbulb,
  Target,
  ArrowRight,
  CheckCircle2,
  Zap,
  Compass,
  Users,
  TrendingUp
} from "lucide-react";

interface IkigaiData {
  passion: string;
  mission: string;
  profession: string;
  vocation: string;
  superPowerStatement: string;
}

export default function SuperPower() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [ikigaiData, setIkigaiData] = useState<IkigaiData>({
    passion: user?.ikigaiPassion || '',
    mission: user?.ikigaiMission || '',
    profession: user?.ikigaiProfession || '',
    vocation: user?.ikigaiVocation || '',
    superPowerStatement: user?.superPowerStatement || ''
  });

  const handleSaveIkigai = async () => {
    try {
      const response = await fetch('/api/user/superpower', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ikigaiPassion: ikigaiData.passion,
          ikigaiMission: ikigaiData.mission,
          ikigaiProfession: ikigaiData.profession,
          ikigaiVocation: ikigaiData.vocation,
          superPowerStatement: ikigaiData.superPowerStatement,
          superPowerDiscovered: true
        })
      });

      if (response.ok) {
        toast({
          title: "SuperPower Discovered!",
          description: "Your Ikigai has been saved to your profile"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your SuperPower discovery",
        variant: "destructive"
      });
    }
  };

  const recommendedReading = [
    {
      title: "Ikigai: The Japanese Secret to a Long and Happy Life",
      author: "Hector Garcia & Francesc Miralles",
      description: "Discover the life-changing Japanese concept of finding your reason for being"
    },
    {
      title: "The Purpose Driven Life",
      author: "Rick Warren",
      description: "A spiritual guide to discovering God's plan for your life and finding meaning"
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      description: "Build good habits and break bad ones with science-backed strategies"
    },
    {
      title: "Flow: The Psychology of Optimal Experience",
      author: "Mihaly Csikszentmihalyi",
      description: "Learn how to achieve the state of flow where passion meets skill"
    },
    {
      title: "Drive: The Surprising Truth About What Motivates Us",
      author: "Daniel H. Pink",
      description: "Understand the science of motivation and purpose-driven work"
    }
  ];

  const comingSoonFeatures = [
    "Habit Building Tools",
    "SuperPower Matching Network",
    "Ikigai Career Pathfinder",
    "Purpose-Driven Project Generator",
    "Mentor-Mentee Matching",
    "Flow State Training"
  ];

  return (
    <div className="container mx-auto px-4 py-6 mb-20">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            SuperPower Discovery
          </h1>
        </div>
        
        <p className="text-xl text-gray-700 mb-6 max-w-3xl mx-auto">
          Discover your Ikigai - your reason for being. Find the sweet spot where what you love meets what the world needs.
        </p>
      </div>

      {/* Ikigai Explanation */}
      <Card className="mb-8 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Compass className="h-6 w-6 text-yellow-600" />
            What is Ikigai?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Ikigai (生き甲斐) is a Japanese concept meaning "reason for being" or "purpose in life." 
                It represents the intersection of four fundamental elements that create a fulfilling, 
                meaningful existence.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-red-700">What You Love</span>
                  </div>
                  <p className="text-sm text-gray-600">Your passion and interests</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-blue-700">What World Needs</span>
                  </div>
                  <p className="text-sm text-gray-600">Your mission and calling</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-400">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-green-700">What You're Paid For</span>
                  </div>
                  <p className="text-sm text-gray-600">Your profession and livelihood</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold text-purple-700">What You're Good At</span>
                  </div>
                  <p className="text-sm text-gray-600">Your vocation and skills</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="relative w-64 h-64 mx-auto">
                {/* Ikigai Venn Diagram */}
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Four overlapping circles */}
                  <circle cx="75" cy="75" r="45" fill="rgba(239, 68, 68, 0.3)" stroke="rgb(239, 68, 68)" strokeWidth="2" />
                  <circle cx="125" cy="75" r="45" fill="rgba(59, 130, 246, 0.3)" stroke="rgb(59, 130, 246)" strokeWidth="2" />
                  <circle cx="75" cy="125" r="45" fill="rgba(34, 197, 94, 0.3)" stroke="rgb(34, 197, 94)" strokeWidth="2" />
                  <circle cx="125" cy="125" r="45" fill="rgba(147, 51, 234, 0.3)" stroke="rgb(147, 51, 234)" strokeWidth="2" />
                  
                  {/* Center text */}
                  <text x="100" y="100" textAnchor="middle" dy="0.3em" className="text-sm font-bold fill-gray-800">
                    IKIGAI
                  </text>
                  
                  {/* Labels */}
                  <text x="50" y="50" textAnchor="middle" className="text-xs fill-red-700 font-medium">Love</text>
                  <text x="150" y="50" textAnchor="middle" className="text-xs fill-blue-700 font-medium">Need</text>
                  <text x="50" y="150" textAnchor="middle" className="text-xs fill-green-700 font-medium">Paid</text>
                  <text x="150" y="150" textAnchor="middle" className="text-xs fill-purple-700 font-medium">Good</text>
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discovery Process */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-600" />
              Discover Your SuperPower
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="passion" className="flex items-center gap-2 text-red-700 font-medium">
                  <Heart className="h-4 w-4" />
                  What You Love (Passion)
                </Label>
                <Textarea
                  id="passion"
                  placeholder="What activities make you lose track of time? What topics excite you?"
                  value={ikigaiData.passion}
                  onChange={(e) => setIkigaiData(prev => ({ ...prev, passion: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="mission" className="flex items-center gap-2 text-blue-700 font-medium">
                  <Globe className="h-4 w-4" />
                  What the World Needs (Mission)
                </Label>
                <Textarea
                  id="mission"
                  placeholder="What problems do you see that need solving? How can you make a difference?"
                  value={ikigaiData.mission}
                  onChange={(e) => setIkigaiData(prev => ({ ...prev, mission: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="profession" className="flex items-center gap-2 text-green-700 font-medium">
                  <DollarSign className="h-4 w-4" />
                  What You Can Be Paid For (Profession)
                </Label>
                <Textarea
                  id="profession"
                  placeholder="What skills or services do people value and pay for?"
                  value={ikigaiData.profession}
                  onChange={(e) => setIkigaiData(prev => ({ ...prev, profession: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="vocation" className="flex items-center gap-2 text-purple-700 font-medium">
                  <Award className="h-4 w-4" />
                  What You're Good At (Vocation)
                </Label>
                <Textarea
                  id="vocation"
                  placeholder="What are your natural talents and developed skills?"
                  value={ikigaiData.vocation}
                  onChange={(e) => setIkigaiData(prev => ({ ...prev, vocation: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="superpower" className="flex items-center gap-2 text-yellow-700 font-medium">
                  <Zap className="h-4 w-4" />
                  Your SuperPower Statement
                </Label>
                <Textarea
                  id="superpower"
                  placeholder="Synthesize the above into your unique SuperPower statement..."
                  value={ikigaiData.superPowerStatement}
                  onChange={(e) => setIkigaiData(prev => ({ ...prev, superPowerStatement: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <Button onClick={handleSaveIkigai} className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save My SuperPower
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Reading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Recommended Reading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendedReading.map((book, index) => (
                <div key={index} className="border-l-4 border-indigo-200 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900">{book.title}</h4>
                  <p className="text-sm text-indigo-600 mb-1">by {book.author}</p>
                  <p className="text-sm text-gray-600">{book.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon - Full Width */}
      <Card className="border-2 border-dashed border-gray-300 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-center justify-center">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {comingSoonFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                <Lightbulb className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 flex-1">{feature}</span>
                <Badge variant="secondary">Soon</Badge>
              </div>
            ))}
          </div>
          <div className="p-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">
            <p className="text-gray-600 text-center text-lg">
              Tools for habit building, finding your flow state, and connecting with others who share your purpose.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}