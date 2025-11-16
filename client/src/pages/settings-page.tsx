import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';
import { useLocation } from 'wouter';
import { UserSettings } from '@shared/schema';

import PrivacySettingsForm from '@/components/settings/PrivacySettingsForm';
import CommunicationSettingsForm from '@/components/settings/CommunicationSettingsForm';
import WalletSettingsForm from '@/components/settings/WalletSettingsForm';
import CollaborationSettingsForm from '@/components/settings/CollaborationSettingsForm';
import GrantPreferencesForm from '@/components/settings/GrantPreferencesForm';
import TeamFormationSettingsForm from '@/components/settings/TeamFormationSettingsForm';
import PersonaSettingsForm from '@/components/settings/PersonaSettingsForm';
import ReputationSettingsForm from '@/components/settings/ReputationSettingsForm';
import InterfaceSettingsForm from '@/components/settings/InterfaceSettingsForm';
import { Layout } from '@/components/layout/layout';
import LanguageSettingsForm from '@/components/settings/LanguageSettingsForm';
import AccessibilitySettingsForm from '@/components/settings/AccessibilitySettingsForm';
import DataManagementSettingsForm from '@/components/settings/DataManagementSettingsForm';

const SettingsPage = () => {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('privacy');
  
  // Fetch user settings
  const { data: settings, isLoading: isLoadingSettings, error: settingsError } = useQuery<UserSettings>({
    queryKey: ['/api/user/settings'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      const res = await apiRequest('PATCH', '/api/user/settings', newSettings);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Your settings have been saved successfully.',
        variant: 'default',
      });
      queryClient.invalidateQueries({queryKey: ['/api/user/settings']});
    },
    onError: (error) => {
      toast({
        title: 'Error updating settings',
        description: error.message || 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Category-specific update mutation
  const updateCategorySettingsMutation = useMutation({
    mutationFn: async ({ category, settings }: { category: string, settings: any }) => {
      const res = await apiRequest('PATCH', `/api/user/settings/${category}`, settings);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Settings updated',
        description: `Your ${variables.category} settings have been saved successfully.`,
        variant: 'default',
      });
      queryClient.invalidateQueries({queryKey: ['/api/user/settings']});
    },
    onError: (error, variables) => {
      toast({
        title: 'Error updating settings',
        description: `Failed to update ${variables.category} settings: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Helper to determine tab title style based on persona
  const getTabStyle = (persona: string | undefined) => {
    if (!persona) return '';
    
    switch (persona) {
      case 'developer':
        return 'text-blue-600 dark:text-blue-400';
      case 'designer':
        return 'text-orange-600 dark:text-orange-400';
      case 'influencer':
        return 'text-green-600 dark:text-green-400';
      default:
        return '';
    }
  };

  // Determine the active tab style
  const tabStyle = getTabStyle(settings?.persona?.primary);

  // Handler for category settings update
  const handleCategoryUpdate = (category: string, newSettings: any) => {
    updateCategorySettingsMutation.mutate({ category, settings: newSettings });
  };

  if (isLoadingSettings) {
    return (
      <Layout>
        <div className="container max-w-4xl py-6 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </Layout>
    );
  }

  if (settingsError) {
    return (
      <Layout>
        <div className="container max-w-4xl py-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>There was an error loading your settings. Please try again later.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  const defaultSettings = settings || {};

  return (
    <Layout>
      <div className="container max-w-4xl py-6">
      <h1 className={`text-3xl font-bold mb-6 ${tabStyle}`}>User Settings</h1>
      <p className="text-muted-foreground mb-6">Customize your HyperDAG experience with these comprehensive settings.</p>
      
      <Tabs defaultValue="privacy" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap mb-4 w-full">
          <TabsTrigger value="privacy" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">Privacy</TabsTrigger>
          <TabsTrigger value="communication" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">Alerts</TabsTrigger>
          <TabsTrigger value="wallet" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">Wallet</TabsTrigger>
          <TabsTrigger value="collaboration" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">Collab</TabsTrigger>
          <TabsTrigger value="grants" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">Grants</TabsTrigger>
          <TabsTrigger value="teams" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">Teams</TabsTrigger>
          <TabsTrigger value="persona" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">Persona</TabsTrigger>
          <TabsTrigger value="reputation" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">Rep</TabsTrigger>
          <TabsTrigger value="interface" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">UI</TabsTrigger>
          <TabsTrigger value="language" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">Lang</TabsTrigger>
          <TabsTrigger value="accessibility" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">A11y</TabsTrigger>
          <TabsTrigger value="data" className="flex-grow basis-1/3 md:basis-1/6 text-xs sm:text-sm py-1 px-1 sm:px-2">Data</TabsTrigger>
        </TabsList>
        
        <div className="p-1">
          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control how your information is shared and who can see it</CardDescription>
              </CardHeader>
              <CardContent>
                <PrivacySettingsForm 
                  settings={defaultSettings.privacy} 
                  onSave={(values) => handleCategoryUpdate('privacy', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communication Settings */}
          <TabsContent value="communication">
            <Card>
              <CardHeader>
                <CardTitle>Communication Settings</CardTitle>
                <CardDescription>Manage how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <CommunicationSettingsForm 
                  settings={defaultSettings.communication} 
                  onSave={(values) => handleCategoryUpdate('communication', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Settings */}
          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Settings</CardTitle>
                <CardDescription>Configure your blockchain wallet preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <WalletSettingsForm 
                  settings={defaultSettings.wallet} 
                  onSave={(values) => handleCategoryUpdate('wallet', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collaboration Settings */}
          <TabsContent value="collaboration">
            <Card>
              <CardHeader>
                <CardTitle>Collaboration Settings</CardTitle>
                <CardDescription>Configure how you work with others on projects</CardDescription>
              </CardHeader>
              <CardContent>
                <CollaborationSettingsForm 
                  settings={defaultSettings.collaboration} 
                  onSave={(values) => handleCategoryUpdate('collaboration', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grant Preferences */}
          <TabsContent value="grants">
            <Card>
              <CardHeader>
                <CardTitle>Grant Preferences</CardTitle>
                <CardDescription>Set your preferences for grant matching and suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <GrantPreferencesForm 
                  settings={defaultSettings.grantPreferences} 
                  onSave={(values) => handleCategoryUpdate('grantPreferences', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Formation Settings */}
          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>Team Formation Settings</CardTitle>
                <CardDescription>Configure how you join and participate in teams</CardDescription>
              </CardHeader>
              <CardContent>
                <TeamFormationSettingsForm 
                  settings={defaultSettings.teamFormation} 
                  onSave={(values) => handleCategoryUpdate('teamFormation', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Persona Settings */}
          <TabsContent value="persona">
            <Card>
              <CardHeader>
                <CardTitle>Persona Settings</CardTitle>
                <CardDescription>Manage your developer, designer, or influencer profile</CardDescription>
              </CardHeader>
              <CardContent>
                <PersonaSettingsForm 
                  settings={defaultSettings.persona} 
                  onSave={(values) => handleCategoryUpdate('persona', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reputation Settings */}
          <TabsContent value="reputation">
            <Card>
              <CardHeader>
                <CardTitle>Reputation Settings</CardTitle>
                <CardDescription>Control how your reputation metrics are displayed</CardDescription>
              </CardHeader>
              <CardContent>
                <ReputationSettingsForm 
                  settings={defaultSettings.reputation} 
                  onSave={(values) => handleCategoryUpdate('reputation', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interface Settings */}
          <TabsContent value="interface">
            <Card>
              <CardHeader>
                <CardTitle>Interface Settings</CardTitle>
                <CardDescription>Customize the look and feel of your HyperDAG experience</CardDescription>
              </CardHeader>
              <CardContent>
                <InterfaceSettingsForm 
                  settings={defaultSettings.interface} 
                  onSave={(values) => handleCategoryUpdate('interface', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language Settings */}
          <TabsContent value="language">
            <Card>
              <CardHeader>
                <CardTitle>Language Settings</CardTitle>
                <CardDescription>Set your preferred language and localization options</CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageSettingsForm 
                  settings={defaultSettings.language} 
                  onSave={(values) => handleCategoryUpdate('language', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Settings */}
          <TabsContent value="accessibility">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Settings</CardTitle>
                <CardDescription>Customize accessibility features for your needs</CardDescription>
              </CardHeader>
              <CardContent>
                <AccessibilitySettingsForm 
                  settings={defaultSettings.accessibility} 
                  onSave={(values) => handleCategoryUpdate('accessibility', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Settings */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Manage your data and export options</CardDescription>
              </CardHeader>
              <CardContent>
                <DataManagementSettingsForm 
                  settings={defaultSettings.dataManagement} 
                  onSave={(values) => handleCategoryUpdate('dataManagement', values)} 
                  isSubmitting={updateCategorySettingsMutation.isPending} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;