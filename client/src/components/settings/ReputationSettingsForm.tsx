import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReputationSettings, reputationSettingsSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Award } from 'lucide-react';

interface ReputationSettingsFormProps {
  settings?: ReputationSettings;
  onSave: (values: ReputationSettings) => void;
  isSubmitting: boolean;
}

const ReputationSettingsForm = ({ settings, onSave, isSubmitting }: ReputationSettingsFormProps) => {
  // Set default values based on provided settings or schema defaults
  const defaultValues: ReputationSettings = settings || {
    showReputationScore: true,
    allowEndorsements: true,
    publicCredentials: true,
    highlightedAchievements: []
  };

  const form = useForm<ReputationSettings>({
    resolver: zodResolver(reputationSettingsSchema),
    defaultValues,
  });

  const handleSubmit = (values: ReputationSettings) => {
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Reputation Settings */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Award className="mr-2 h-5 w-5" /> Reputation Display</h3>
              <p className="text-sm text-muted-foreground mb-4">Configure how your reputation and achievements are displayed</p>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="showReputationScore"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show Reputation Score</FormLabel>
                        <FormDescription>
                          Display your reputation score on your profile
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
                  name="allowEndorsements"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Endorsements</FormLabel>
                        <FormDescription>
                          Allow other users to endorse your skills and contributions
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
                  name="publicCredentials"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Credentials</FormLabel>
                        <FormDescription>
                          Make your verified credentials visible to others
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
              <>Save Reputation Settings</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ReputationSettingsForm;