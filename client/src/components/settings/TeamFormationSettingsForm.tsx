import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TeamFormationSettings, teamFormationSettingsSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';

interface TeamFormationSettingsFormProps {
  settings?: TeamFormationSettings;
  onSave: (values: TeamFormationSettings) => void;
  isSubmitting: boolean;
}

const TeamFormationSettingsForm = ({ settings, onSave, isSubmitting }: TeamFormationSettingsFormProps) => {
  // Set default values based on provided settings or schema defaults
  const defaultValues: TeamFormationSettings = settings || {
    joinTeamsAutomatically: false,
    notifyNewTeamOpportunities: true,
    preferredRoles: [],
    includeInTeamSuggestions: true
  };

  const form = useForm<TeamFormationSettings>({
    resolver: zodResolver(teamFormationSettingsSchema),
    defaultValues,
  });

  const handleSubmit = (values: TeamFormationSettings) => {
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Team Formation Settings */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Users className="mr-2 h-5 w-5" /> Team Formation Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">Configure how you join and participate in teams</p>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="notifyNewTeamOpportunities"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Team Opportunity Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications about new team opportunities
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
                  name="includeInTeamSuggestions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Include in Team Suggestions</FormLabel>
                        <FormDescription>
                          Allow the system to suggest you as a potential team member
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
                  name="joinTeamsAutomatically"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Join Teams Automatically</FormLabel>
                        <FormDescription>
                          Automatically accept team invitations that match your skills
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
              
              <p className="text-sm text-muted-foreground mt-6 mb-2">Preferred roles and advanced team settings coming soon</p>
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
              <>Save Team Settings</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TeamFormationSettingsForm;