import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GrantPreferences, grantPreferencesSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, DollarSign } from 'lucide-react';

interface GrantPreferencesFormProps {
  settings?: GrantPreferences;
  onSave: (values: GrantPreferences) => void;
  isSubmitting: boolean;
}

const GrantPreferencesForm = ({ settings, onSave, isSubmitting }: GrantPreferencesFormProps) => {
  // Set default values based on provided settings or schema defaults
  const defaultValues: GrantPreferences = settings || {
    preferredGrantTypes: [],
    automaticMatching: true,
    minimumGrantAmount: 0,
    preferredCategories: [],
    openToPublicGrants: true
  };

  const form = useForm<GrantPreferences>({
    resolver: zodResolver(grantPreferencesSchema),
    defaultValues,
  });

  const handleSubmit = (values: GrantPreferences) => {
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Grant Preferences */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><DollarSign className="mr-2 h-5 w-5" /> Grant Preferences</h3>
              <p className="text-sm text-muted-foreground mb-4">Configure your preferences for grant matching and opportunities</p>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="automaticMatching"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Automatic Grant Matching</FormLabel>
                        <FormDescription>
                          Allow the system to automatically match you with relevant grants
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
                  name="openToPublicGrants"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Open to Public Grants</FormLabel>
                        <FormDescription>
                          Receive notifications about public grant opportunities
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
              
              <p className="text-sm text-muted-foreground mt-6 mb-2">More detailed grant preferences will be available soon</p>
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
              <>Save Grant Preferences</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default GrantPreferencesForm;