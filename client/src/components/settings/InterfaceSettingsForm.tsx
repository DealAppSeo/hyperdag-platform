import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InterfaceSettings, interfaceSettingsSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Palette, MonitorSmartphone, Sidebar, SunMoon } from 'lucide-react';

interface InterfaceSettingsFormProps {
  settings?: InterfaceSettings;
  onSave: (values: InterfaceSettings) => void;
  isSubmitting: boolean;
}

const InterfaceSettingsForm = ({ settings, onSave, isSubmitting }: InterfaceSettingsFormProps) => {
  // Set default values based on provided settings or schema defaults
  const defaultValues: InterfaceSettings = settings || {
    theme: 'system',
    colorScheme: 'default',
    compactMode: false,
    animationsEnabled: true,
    sidebarPosition: 'left'
  };

  const form = useForm<InterfaceSettings>({
    resolver: zodResolver(interfaceSettingsSchema),
    defaultValues,
  });

  const handleSubmit = (values: InterfaceSettings) => {
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Theme Settings */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><SunMoon className="mr-2 h-5 w-5" /> Theme Settings</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Mode</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System (Auto)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose between light, dark, or system-based theme
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="colorScheme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Scheme</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select color scheme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="blue" className="text-blue-600">Blue (Developer)</SelectItem>
                          <SelectItem value="orange" className="text-orange-600">Orange (Designer)</SelectItem>
                          <SelectItem value="green" className="text-green-600">Green (Influencer)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose your preferred color scheme
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout Preferences */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Palette className="mr-2 h-5 w-5" /> Layout Preferences</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="compactMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Compact Mode</FormLabel>
                        <FormDescription>
                          Use a more compact layout to fit more content on screen
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
                  name="animationsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Animations</FormLabel>
                        <FormDescription>
                          Show animations and transitions in the interface
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
                  name="sidebarPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sidebar Position</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sidebar position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Position of the navigation sidebar
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
              <>Save Interface Settings</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default InterfaceSettingsForm;