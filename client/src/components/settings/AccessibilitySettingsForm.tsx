import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AccessibilitySettings, accessibilitySettingsSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Accessibility } from 'lucide-react';

interface AccessibilitySettingsFormProps {
  settings?: AccessibilitySettings;
  onSave: (values: AccessibilitySettings) => void;
  isSubmitting: boolean;
}

const AccessibilitySettingsForm = ({ settings, onSave, isSubmitting }: AccessibilitySettingsFormProps) => {
  // Set default values based on provided settings or schema defaults
  const defaultValues: AccessibilitySettings = settings || {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false
  };

  const form = useForm<AccessibilitySettings>({
    resolver: zodResolver(accessibilitySettingsSchema),
    defaultValues,
  });

  const handleSubmit = (values: AccessibilitySettings) => {
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Accessibility Settings */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Accessibility className="mr-2 h-5 w-5" /> Accessibility Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">Customize accessibility features for your needs</p>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="highContrast"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">High Contrast Mode</FormLabel>
                        <FormDescription>
                          Increase contrast for better readability
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
                  name="largeText"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Large Text</FormLabel>
                        <FormDescription>
                          Increase text size for better readability
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
                  name="reducedMotion"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Reduced Motion</FormLabel>
                        <FormDescription>
                          Minimize animations and transitions
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
                  name="screenReader"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Screen Reader Optimization</FormLabel>
                        <FormDescription>
                          Optimize content for screen readers
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
              <>Save Accessibility Settings</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AccessibilitySettingsForm;