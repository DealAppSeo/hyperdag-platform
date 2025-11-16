import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PersonaSettings, personaSettingsSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, User, Code, PenTool, Globe } from 'lucide-react';

interface PersonaSettingsFormProps {
  settings?: PersonaSettings;
  onSave: (values: PersonaSettings) => void;
  isSubmitting: boolean;
}

const PersonaSettingsForm = ({ settings, onSave, isSubmitting }: PersonaSettingsFormProps) => {
  // Set default values based on provided settings or schema defaults
  const defaultValues: PersonaSettings = settings || {
    primary: 'developer',
    showBadges: true,
    displayProjects: true,
    displayRewards: true
  };

  const form = useForm<PersonaSettings>({
    resolver: zodResolver(personaSettingsSchema),
    defaultValues,
  });

  const handleSubmit = (values: PersonaSettings) => {
    onSave(values);
  };

  // Function to get color based on persona
  const getPersonaColor = (persona: string) => {
    switch(persona) {
      case 'developer': return 'text-blue-600 dark:text-blue-400';
      case 'designer': return 'text-orange-600 dark:text-orange-400';
      case 'influencer': return 'text-green-600 dark:text-green-400';
      default: return '';
    }
  };

  // Get selected persona color
  const personaColor = getPersonaColor(form.watch('primary'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Persona Selection */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className={`text-lg font-medium mb-4 flex items-center ${personaColor}`}>
                <User className="mr-2 h-5 w-5" /> Primary Persona
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your primary role determines how you're matched with projects and teams
              </p>
              
              <FormField
                control={form.control}
                name="primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Persona</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your primary persona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="developer" className="text-blue-600 dark:text-blue-400">
                          <div className="flex items-center">
                            <Code className="mr-2 h-4 w-4" />
                            Developer
                          </div>
                        </SelectItem>
                        <SelectItem value="designer" className="text-orange-600 dark:text-orange-400">
                          <div className="flex items-center">
                            <PenTool className="mr-2 h-4 w-4" />
                            Designer
                          </div>
                        </SelectItem>
                        <SelectItem value="influencer" className="text-green-600 dark:text-green-400">
                          <div className="flex items-center">
                            <Globe className="mr-2 h-4 w-4" />
                            Influencer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Your primary role in the HyperDAG ecosystem
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Display Preferences */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Display Preferences</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="showBadges"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show Badges</FormLabel>
                        <FormDescription>
                          Display your earned badges on your profile
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
                  name="displayProjects"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Display Projects</FormLabel>
                        <FormDescription>
                          Show your projects on your public profile
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
                  name="displayRewards"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Display Rewards</FormLabel>
                        <FormDescription>
                          Show your earned rewards and achievements
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
          <Button type="submit" disabled={isSubmitting} className={personaColor}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Persona Settings</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PersonaSettingsForm;