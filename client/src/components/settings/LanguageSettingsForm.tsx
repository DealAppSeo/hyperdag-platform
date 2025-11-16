import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LanguageSettings, languageSettingsSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Languages } from 'lucide-react';

interface LanguageSettingsFormProps {
  settings?: LanguageSettings;
  onSave: (values: LanguageSettings) => void;
  isSubmitting: boolean;
}

const LanguageSettingsForm = ({ settings, onSave, isSubmitting }: LanguageSettingsFormProps) => {
  // Set default values based on provided settings or schema defaults
  const defaultValues: LanguageSettings = settings || {
    preferredLanguage: 'en',
    contentLanguages: ['en']
  };

  const form = useForm<LanguageSettings>({
    resolver: zodResolver(languageSettingsSchema),
    defaultValues,
  });

  const handleSubmit = (values: LanguageSettings) => {
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Language Settings */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Languages className="mr-2 h-5 w-5" /> Language Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">Configure your language preferences</p>
              
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="ko">Korean</SelectItem>
                          <SelectItem value="ru">Russian</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The main language for the user interface
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <p className="text-sm text-muted-foreground mt-6 mb-2">Multi-language content preferences coming soon</p>
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
              <>Save Language Settings</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LanguageSettingsForm;