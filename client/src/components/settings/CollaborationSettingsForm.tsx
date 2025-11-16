import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CollaborationSettings, collaborationSettingsSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, Clock, Video } from 'lucide-react';

interface CollaborationSettingsFormProps {
  settings?: CollaborationSettings;
  onSave: (values: CollaborationSettings) => void;
  isSubmitting: boolean;
}

const CollaborationSettingsForm = ({ settings, onSave, isSubmitting }: CollaborationSettingsFormProps) => {
  // Set default values based on provided settings or schema defaults
  const defaultValues: CollaborationSettings = settings || {
    openToCollaboration: true,
    preferredTeamSize: 'medium',
    remoteCollaboration: true,
    availabilityHours: 20,
    communicationPreference: 'chat'
  };

  const form = useForm<CollaborationSettings>({
    resolver: zodResolver(collaborationSettingsSchema),
    defaultValues,
  });

  const handleSubmit = (values: CollaborationSettings) => {
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Collaboration Preferences */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Users className="mr-2 h-5 w-5" /> Collaboration Preferences</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="openToCollaboration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Open to Collaboration</FormLabel>
                        <FormDescription>
                          Allow others to invite you to collaborate on projects
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
                  name="preferredTeamSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Team Size</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">Small (2-3 people)</SelectItem>
                          <SelectItem value="medium">Medium (4-6 people)</SelectItem>
                          <SelectItem value="large">Large (7+ people)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Your preferred team size for collaboration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remoteCollaboration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Remote Collaboration</FormLabel>
                        <FormDescription>
                          You're open to collaborate remotely with team members
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
                  name="availabilityHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekly Availability (Hours)</FormLabel>
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">0 hours</span>
                          <span className="font-medium">{field.value} hours</span>
                          <span className="text-sm text-muted-foreground">40+ hours</span>
                        </div>
                        <FormControl>
                          <Slider
                            min={0}
                            max={40}
                            step={1}
                            value={[field.value]}
                            onValueChange={(values) => field.onChange(values[0])}
                            className="w-full"
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        How many hours per week you can dedicate to collaboration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="communicationPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Communication Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select communication method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="chat">Chat (Discord, Slack, etc.)</SelectItem>
                          <SelectItem value="video">Video Calls</SelectItem>
                          <SelectItem value="inPerson">In-person Meetings</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Your preferred method of team communication
                      </FormDescription>
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
              <>Save Collaboration Settings</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CollaborationSettingsForm;