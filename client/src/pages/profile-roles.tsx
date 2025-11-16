import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, GraduationCap, Zap, Rocket, Users } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface Role {
  id: string;
  category: string;
  primary: string;
  secondary: string;
  icon: React.ReactNode;
  description: string;
  benefits: string[];
  timeCommitment: string;
}

const ProfileRoles: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const roles: Role[] = [
    {
      id: 'mentor',
      category: 'Knowledge Sharing',
      primary: 'Mentor',
      secondary: 'Mentee',
      icon: <GraduationCap className="h-8 w-8" />,
      description: 'Share your expertise and learn from others in your field',
      benefits: ['Build leadership skills', 'Expand professional network', 'Give back to community'],
      timeCommitment: '2-4 hours/week'
    },
    {
      id: 'trainer',
      category: 'Skill Development',
      primary: 'Trainer',
      secondary: 'Trainee',
      icon: <Zap className="h-8 w-8" />,
      description: 'Provide structured training or develop new competencies',
      benefits: ['Develop teaching skills', 'Stay current with trends', 'Create training content'],
      timeCommitment: '3-6 hours/week'
    },
    {
      id: 'coach',
      category: 'Strategic Guidance',
      primary: 'Coach',
      secondary: 'Assistant',
      icon: <Rocket className="h-8 w-8" />,
      description: 'Guide strategic decisions or support leaders in achieving goals',
      benefits: ['Enhance leadership abilities', 'Strategic thinking', 'Executive experience'],
      timeCommitment: '4-8 hours/week'
    }
  ];

  const handleRoleToggle = (roleId: string, type: 'primary' | 'secondary') => {
    const fullRoleId = `${roleId}_${type}`;
    setSelectedRoles(prev => {
      if (prev.includes(fullRoleId)) {
        return prev.filter(id => id !== fullRoleId);
      } else {
        return [...prev, fullRoleId];
      }
    });
  };

  const handleSaveAndContinue = () => {
    if (selectedRoles.length === 0) {
      toast({
        title: "Select at least one role",
        description: "Please choose how you'd like to contribute to the ecosystem.",
        variant: "destructive"
      });
      return;
    }

    // Save roles to user profile (would typically make API call here)
    console.log('Saving roles:', selectedRoles);
    
    toast({
      title: "Profile updated!",
      description: "Your roles have been saved. Ready for AI recommendations.",
    });

    // Navigate to dashboard for AI recommendations
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-purple-100 text-purple-800 font-bold px-6 py-3 text-lg rounded-full mb-4">
            STEP 5 OF 6
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Define Your Impact Role
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose how you want to contribute to the HyperDAG ecosystem. You can select multiple roles and switch between giving and receiving in each category.
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {roles.map((role) => (
              <Card key={role.id} className="relative transition-all duration-300 hover:shadow-lg border-2 hover:border-purple-200">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4 text-purple-600">
                    {role.icon}
                  </div>
                  <Badge variant="outline" className="mb-2 text-purple-600 border-purple-200">
                    {role.category}
                  </Badge>
                  <CardTitle className="text-xl">{role.primary} ↔ {role.secondary}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {/* Role Selection Options */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-purple-50">
                      <Checkbox
                        id={`${role.id}_primary`}
                        checked={selectedRoles.includes(`${role.id}_primary`)}
                        onCheckedChange={() => handleRoleToggle(role.id, 'primary')}
                      />
                      <label 
                        htmlFor={`${role.id}_primary`} 
                        className="flex-1 cursor-pointer font-medium text-purple-700"
                      >
                        I want to be a {role.primary}
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-blue-50">
                      <Checkbox
                        id={`${role.id}_secondary`}
                        checked={selectedRoles.includes(`${role.id}_secondary`)}
                        onCheckedChange={() => handleRoleToggle(role.id, 'secondary')}
                      />
                      <label 
                        htmlFor={`${role.id}_secondary`} 
                        className="flex-1 cursor-pointer font-medium text-blue-700"
                      >
                        I want to be a {role.secondary}
                      </label>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Benefits:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {role.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Time Commitment */}
                  <div className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      Time: {role.timeCommitment}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Roles Summary */}
          {selectedRoles.length > 0 && (
            <div className="bg-white rounded-xl p-6 mb-8 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Selected Roles:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedRoles.map((roleId) => {
                  const [id, type] = roleId.split('_');
                  const role = roles.find(r => r.id === id);
                  const roleTitle = type === 'primary' ? role?.primary : role?.secondary;
                  return (
                    <Badge key={roleId} variant="default" className="bg-purple-100 text-purple-800">
                      {roleTitle}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Link href="/hypercrowd">
              <Button variant="outline" size="lg" className="flex items-center">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Team Building
              </Button>
            </Link>

            <Button 
              size="lg" 
              onClick={handleSaveAndContinue}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={selectedRoles.length === 0}
            >
              Complete Profile & Get AI Recommendations
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Don't worry - you can change these roles anytime in your profile settings. 
              The AI will use this information to provide better recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileRoles;