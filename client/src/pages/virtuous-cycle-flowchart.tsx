import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  ArrowDown, 
  Users, 
  Heart, 
  Target, 
  TrendingUp, 
  HandHeart, 
  Award, 
  Lightbulb, 
  RefreshCw,
  Zap,
  Globe,
  Share2,
  Download,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VirtuousCycleFlowchart = () => {
  const { toast } = useToast();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HyperDAG Virtuous Cycle of Purpose-Driven Impact',
          text: 'See how HyperDAG creates exponential value by aligning passion, purpose, and impact',
          url: url
        });
      } catch (error) {
        // Fallback to copy
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Share this flowchart to show the power of purpose-driven collaboration"
        });
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Share this flowchart to show the power of purpose-driven collaboration"
      });
    }
  };

  const FlowNode = ({ 
    icon: Icon, 
    title, 
    description, 
    color, 
    bgColor, 
    textColor = "text-gray-800",
    size = "default" 
  }: {
    icon: any;
    title: string;
    description: string;
    color: string;
    bgColor: string;
    textColor?: string;
    size?: "small" | "default" | "large";
  }) => {
    const cardClass = size === "large" 
      ? "p-6 min-h-[160px]" 
      : size === "small" 
        ? "p-4 min-h-[120px]" 
        : "p-5 min-h-[140px]";
    
    return (
      <Card className={`${bgColor} border-2 ${color} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
        <CardContent className={cardClass}>
          <div className="flex flex-col items-center text-center h-full justify-center">
            <div className={`w-12 h-12 ${bgColor.replace('bg-', 'bg-').replace('-50', '-100')} rounded-full flex items-center justify-center mb-3`}>
              <Icon className={`h-6 w-6 ${color.replace('border-', 'text-')}`} />
            </div>
            <h3 className={`font-bold mb-2 ${textColor} ${size === 'large' ? 'text-lg' : 'text-base'}`}>
              {title}
            </h3>
            <p className={`text-sm ${textColor} opacity-90 leading-relaxed`}>
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const Arrow = ({ direction = "right", className = "" }: { direction?: "right" | "down"; className?: string }) => {
    const ArrowIcon = direction === "down" ? ArrowDown : ArrowRight;
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="bg-blue-100 p-2 rounded-full">
          <ArrowIcon className="h-5 w-5 text-blue-600" />
        </div>
      </div>
    );
  };

  const CycleIndicator = () => (
    <div className="flex items-center justify-center">
      <div className="bg-green-100 p-3 rounded-full border-2 border-green-400">
        <RefreshCw className="h-6 w-6 text-green-600 animate-spin" style={{ animationDuration: '3s' }} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              The HyperDAG Virtuous Cycle
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            A self-reinforcing ecosystem where purpose alignment creates exponential value 
            by connecting passion with impact through transparent, efficient collaboration
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Button onClick={handleShare} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share This Flowchart
            </Button>
            <Badge variant="outline" className="px-4 py-2">
              <Globe className="h-4 w-4 mr-2" />
              Share-ready Deep Link
            </Badge>
          </div>
        </div>

        {/* Main Flow */}
        <div className="space-y-8">
          {/* Problem Layer */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">The Challenge We Solve</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <FlowNode
                icon={HandHeart}
                title="Disconnected Nonprofits"
                description="Organizations struggle to find skilled volunteers, mentors, and sustainable funding beyond traditional grants"
                color="border-red-400"
                bgColor="bg-red-50"
                textColor="text-red-800"
              />
              <FlowNode
                icon={Users}
                title="Unfulfilled Helpers"
                description="People want to create meaningful impact but lack efficient ways to connect with aligned causes and opportunities"
                color="border-orange-400"
                bgColor="bg-orange-50"
                textColor="text-orange-800"
              />
              <FlowNode
                icon={Target}
                title="Misaligned Resources"
                description="Successful individuals and young professionals remain disconnected from impactful collaboration opportunities"
                color="border-yellow-400"
                bgColor="bg-yellow-50"
                textColor="text-yellow-800"
              />
            </div>
          </div>

          <Arrow direction="down" className="my-8" />

          {/* Solution Layer */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">The HyperDAG Solution</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <FlowNode
                icon={Heart}
                title="Purpose Hub Discovery"
                description="AI-powered matching connects individual passions with verified nonprofit needs through transparent impact tracking"
                color="border-blue-400"
                bgColor="bg-blue-50"
                textColor="text-blue-800"
                size="large"
              />
              <FlowNode
                icon={Lightbulb}
                title="Synergy Creation"
                description="Smart algorithms identify collaboration opportunities between grants, nonprofits, and skilled individuals"
                color="border-purple-400"
                bgColor="bg-purple-50"
                textColor="text-purple-800"
                size="large"
              />
            </div>
          </div>

          <Arrow direction="down" className="my-8" />

          {/* Value Creation Cycle */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">The Virtuous Value Cycle</h2>
            
            {/* Cycle Visualization - Responsive Design */}
            <div className="relative max-w-4xl mx-auto px-4 py-8">
              {/* Center: Continuous Value Creation - Responsive Circular Design */}
              <div className="absolute inset-16 sm:inset-20 md:inset-24 lg:inset-28 flex items-center justify-center z-10">
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-4 sm:border-6 md:border-8 border-green-600 shadow-2xl flex items-center justify-center">
                  <div className="text-center px-2">
                    <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 md:h-9 md:w-9 lg:h-11 lg:w-11 text-white mx-auto mb-1 sm:mb-2" />
                    <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white leading-tight">Exponential</h3>
                    <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white leading-tight mb-1">Value Creation</h3>
                    <p className="text-green-100 text-xs hidden md:block leading-tight">
                      Self-reinforcing impact loop
                    </p>
                  </div>
                </div>
              </div>

              {/* Cycle Elements positioned in circle - Responsive */}
              <div className="relative w-full h-[320px] sm:h-[380px] md:h-[440px] lg:h-[500px] overflow-visible">
                {/* Step 1: Top - Successful People Mentor */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 sm:w-28 md:w-32 lg:w-36">
                  <div className="relative">
                    <Card className="bg-emerald-50 border-2 border-emerald-400 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <CardContent className="p-2 sm:p-3 md:p-4 min-h-[80px] sm:min-h-[90px] md:min-h-[100px]">
                        <div className="flex flex-col items-center text-center h-full justify-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-1 sm:mb-2">
                            <Award className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-emerald-600" />
                          </div>
                          <h3 className="font-bold text-emerald-800 text-xs sm:text-sm md:text-base mb-1">
                            Experienced Mentors
                          </h3>
                          <p className="text-xs text-emerald-800 opacity-90 leading-tight hidden sm:block">
                            Successful professionals share expertise
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-emerald-500 text-white text-sm px-2 py-1">1</Badge>
                    </div>
                    {/* Arrow to next step */}
                    <div className="absolute top-1/2 -right-6 sm:-right-8 md:-right-10 transform -translate-y-1/2 hidden sm:block">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 transform rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Right - Young People Gain Skills */}
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-24 sm:w-28 md:w-32 lg:w-36">
                  <div className="relative">
                    <Card className="bg-blue-50 border-2 border-blue-400 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <CardContent className="p-2 sm:p-3 md:p-4 min-h-[80px] sm:min-h-[90px] md:min-h-[100px]">
                        <div className="flex flex-col items-center text-center h-full justify-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center mb-1 sm:mb-2">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                          <h3 className="font-bold text-blue-800 text-xs sm:text-sm md:text-base mb-1">
                            Emerging Talent
                          </h3>
                          <p className="text-xs text-blue-800 opacity-90 leading-tight hidden sm:block">
                            Young professionals gain experience
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-blue-500 text-white text-sm px-2 py-1">2</Badge>
                    </div>
                    {/* Arrow to next step */}
                    <div className="absolute bottom-0 left-1/2 transform translate-y-6 sm:translate-y-8 md:translate-y-10 -translate-x-1/2 hidden sm:block">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 transform rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Bottom - Nonprofits Receive Value */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 sm:w-28 md:w-32 lg:w-36">
                  <div className="relative">
                    <Card className="bg-purple-50 border-2 border-purple-400 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <CardContent className="p-2 sm:p-3 md:p-4 min-h-[80px] sm:min-h-[90px] md:min-h-[100px]">
                        <div className="flex flex-col items-center text-center h-full justify-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center mb-1 sm:mb-2">
                            <HandHeart className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                          </div>
                          <h3 className="font-bold text-purple-800 text-xs sm:text-sm md:text-base mb-1">
                            Nonprofits Thrive
                          </h3>
                          <p className="text-xs text-purple-800 opacity-90 leading-tight hidden sm:block">
                            Organizations receive skilled support
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-purple-500 text-white text-sm px-2 py-1">3</Badge>
                    </div>
                    {/* Arrow to next step */}
                    <div className="absolute top-1/2 -left-6 sm:-left-8 md:-left-10 transform -translate-y-1/2 hidden sm:block">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 transform -rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Left - Demonstrated Impact */}
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-24 sm:w-28 md:w-32 lg:w-36">
                  <div className="relative">
                    <Card className="bg-green-50 border-2 border-green-400 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <CardContent className="p-2 sm:p-3 md:p-4 min-h-[80px] sm:min-h-[90px] md:min-h-[100px]">
                        <div className="flex flex-col items-center text-center h-full justify-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center mb-1 sm:mb-2">
                            <Target className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600" />
                          </div>
                          <h3 className="font-bold text-green-800 text-xs sm:text-sm md:text-base mb-1">
                            Proven Impact
                          </h3>
                          <p className="text-xs text-green-800 opacity-90 leading-tight hidden sm:block">
                            Transparent results attract participants
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-green-500 text-white text-sm px-2 py-1">4</Badge>
                    </div>
                    {/* Arrow back to step 1 */}
                    <div className="absolute top-0 left-1/2 transform -translate-y-6 sm:-translate-y-8 md:-translate-y-10 -translate-x-1/2 hidden sm:block">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 transform -rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <CycleIndicator />

          {/* Outcomes */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Exponential Outcomes</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <FlowNode
                icon={TrendingUp}
                title="Sustainable Growth"
                description="Each successful collaboration attracts more participants, creating network effects and sustained impact"
                color="border-green-400"
                bgColor="bg-green-50"
                textColor="text-green-800"
              />
              <FlowNode
                icon={Globe}
                title="Global Scale"
                description="Purpose-driven connections transcend geographic boundaries, multiplying impact across communities"
                color="border-blue-400"
                bgColor="bg-blue-50"
                textColor="text-blue-800"
              />
              <FlowNode
                icon={Heart}
                title="Meaningful Legacy"
                description="Participants build lasting relationships and create generational impact through aligned purpose"
                color="border-purple-400"
                bgColor="bg-purple-50"
                textColor="text-purple-800"
              />
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl text-white">
            <h2 className="text-3xl font-bold mb-4">Join the Virtuous Cycle</h2>
            <p className="text-xl mb-6 opacity-90">
              Be part of a system where everyone wins: nonprofits get support, 
              young people gain experience, mentors create impact, and society benefits exponentially.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline" 
                className="bg-white text-blue-600 hover:bg-blue-50 border-white"
                onClick={() => window.location.href = '/purpose-hub'}
              >
                Start Your Purpose Journey
              </Button>
              <Button 
                variant="outline" 
                className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share This Vision
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            Powered by HyperDAG - Where Purpose Meets Impact Through Technology
          </p>
        </div>
      </div>
    </div>
  );
};

export default VirtuousCycleFlowchart;