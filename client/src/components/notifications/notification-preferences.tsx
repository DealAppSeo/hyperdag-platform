import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface NotificationPreferences {
  grantMatches: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  teamMatches: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  exclusiveOpportunities: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  urgentDeadlines: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export default function NotificationPreferences() {
  const { toast } = useToast();
  
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/user/notification-preferences'],
    retry: false,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: NotificationPreferences) => {
      const response = await apiRequest('PUT', '/api/user/notification-preferences', newPreferences);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/notification-preferences'] });
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update notification preferences.",
        variant: "destructive",
      });
    },
  });

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(
    preferences || {
      grantMatches: { email: true, sms: false, push: true },
      teamMatches: { email: true, sms: false, push: true },
      exclusiveOpportunities: { email: true, sms: true, push: true },
      urgentDeadlines: { email: true, sms: true, push: true },
    }
  );

  const handlePreferenceChange = (category: keyof NotificationPreferences, method: 'email' | 'sms' | 'push', value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [method]: value
      }
    }));
  };

  const savePreferences = () => {
    updatePreferencesMutation.mutate(localPreferences);
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Control how you want to be notified about exclusive opportunities and perfect matches.
          Higher notification frequency = more exclusive discoveries!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grant Matches */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Exclusive Grant Discoveries</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Get notified when we find grants that perfectly match your skills and aren't publicly listed yet.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email</span>
              </div>
              <Switch
                checked={localPreferences.grantMatches.email}
                onCheckedChange={(value) => handlePreferenceChange('grantMatches', 'email', value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">SMS</span>
              </div>
              <Switch
                checked={localPreferences.grantMatches.sms}
                onCheckedChange={(value) => handlePreferenceChange('grantMatches', 'sms', value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm">Push</span>
              </div>
              <Switch
                checked={localPreferences.grantMatches.push}
                onCheckedChange={(value) => handlePreferenceChange('grantMatches', 'push', value)}
              />
            </div>
          </div>
        </div>

        {/* Team Matches */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Perfect Team Matches</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Be notified when someone with complementary skills wants to collaborate on your type of projects.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email</span>
              </div>
              <Switch
                checked={localPreferences.teamMatches.email}
                onCheckedChange={(value) => handlePreferenceChange('teamMatches', 'email', value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">SMS</span>
              </div>
              <Switch
                checked={localPreferences.teamMatches.sms}
                onCheckedChange={(value) => handlePreferenceChange('teamMatches', 'sms', value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm">Push</span>
              </div>
              <Switch
                checked={localPreferences.teamMatches.push}
                onCheckedChange={(value) => handlePreferenceChange('teamMatches', 'push', value)}
              />
            </div>
          </div>
        </div>

        {/* Exclusive Opportunities */}
        <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">VIP Opportunities</h3>
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Recommended</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            First access to high-value opportunities before they're announced publicly. Users who enable all methods get 3x more exclusive discoveries.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email</span>
              </div>
              <Switch
                checked={localPreferences.exclusiveOpportunities.email}
                onCheckedChange={(value) => handlePreferenceChange('exclusiveOpportunities', 'email', value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">SMS</span>
              </div>
              <Switch
                checked={localPreferences.exclusiveOpportunities.sms}
                onCheckedChange={(value) => handlePreferenceChange('exclusiveOpportunities', 'sms', value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm">Push</span>
              </div>
              <Switch
                checked={localPreferences.exclusiveOpportunities.push}
                onCheckedChange={(value) => handlePreferenceChange('exclusiveOpportunities', 'push', value)}
              />
            </div>
          </div>
        </div>

        {/* Urgent Deadlines */}
        <div className="border rounded-lg p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold">Urgent Deadlines</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Time-sensitive opportunities closing soon - grants, team formation deadlines, application cutoffs.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email</span>
              </div>
              <Switch
                checked={localPreferences.urgentDeadlines.email}
                onCheckedChange={(value) => handlePreferenceChange('urgentDeadlines', 'email', value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">SMS</span>
              </div>
              <Switch
                checked={localPreferences.urgentDeadlines.sms}
                onCheckedChange={(value) => handlePreferenceChange('urgentDeadlines', 'sms', value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm">Push</span>
              </div>
              <Switch
                checked={localPreferences.urgentDeadlines.push}
                onCheckedChange={(value) => handlePreferenceChange('urgentDeadlines', 'push', value)}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={savePreferences}
            disabled={updatePreferencesMutation.isPending}
            className="w-full"
          >
            {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Notification Preferences'}
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Your preferences help us deliver more relevant opportunities. You can change these anytime.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}