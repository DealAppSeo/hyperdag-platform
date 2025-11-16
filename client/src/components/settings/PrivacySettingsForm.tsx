import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PrivacySettings, privacySettingsSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';

interface PrivacySettingsFormProps {
  settings?: PrivacySettings;
  onSave: (values: PrivacySettings) => void;
  isSubmitting: boolean;
}

const PrivacySettingsForm = ({ settings, onSave, isSubmitting }: PrivacySettingsFormProps) => {
  // Set default values based on provided settings or schema defaults
  const defaultValues: PrivacySettings = settings || {
    profileVisibility: 'public',
    skillsVisibility: 'public',
    interestsVisibility: 'public', 
    historyVisibility: 'public',
    zkpPreferences: {
      useZkpForReputation: true,
      useZkpForCredentials: true,
      useZkpForIdentity: true
    }
  };

  const form = useForm<PrivacySettings>({
    resolver: zodResolver(privacySettingsSchema),
    defaultValues,
  });

  const handleSubmit = (values: PrivacySettings) => {
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Profile Visibility */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Eye className="mr-2 h-5 w-5" /> Profile Visibility</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="profileVisibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Profile</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public (Everyone)</SelectItem>
                          <SelectItem value="connections">Connections Only</SelectItem>
                          <SelectItem value="private">Private (Only Me)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Who can see your main profile information
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skillsVisibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills Visibility</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public (Everyone)</SelectItem>
                          <SelectItem value="connections">Connections Only</SelectItem>
                          <SelectItem value="private">Private (Only Me)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Who can see your skills and expertise
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interestsVisibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interests Visibility</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public (Everyone)</SelectItem>
                          <SelectItem value="connections">Connections Only</SelectItem>
                          <SelectItem value="private">Private (Only Me)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Who can see your interests and preferences
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="historyVisibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity History</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public (Everyone)</SelectItem>
                          <SelectItem value="connections">Connections Only</SelectItem>
                          <SelectItem value="private">Private (Only Me)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Who can see your contribution history
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ZKP Preferences */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Shield className="mr-2 h-5 w-5" /> Zero-Knowledge Proof Preferences</h3>
              <p className="text-sm text-muted-foreground mb-4">Zero-Knowledge Proofs allow you to verify credentials without revealing sensitive information.</p>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="zkpPreferences.useZkpForReputation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use ZKP for Reputation</FormLabel>
                        <FormDescription>
                          Verify reputation metrics privately using ZKP technology
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zkpPreferences.useZkpForCredentials"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use ZKP for Credentials</FormLabel>
                        <FormDescription>
                          Verify educational and professional credentials privately
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zkpPreferences.useZkpForIdentity"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use ZKP for Identity</FormLabel>
                        <FormDescription>
                          Verify identity attributes without revealing personal data
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Privacy Settings</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PrivacySettingsForm;