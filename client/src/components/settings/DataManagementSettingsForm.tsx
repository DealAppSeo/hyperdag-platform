import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DataManagementSettings, dataManagementSettingsSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Database, Download, Trash2 } from 'lucide-react';

interface DataManagementSettingsFormProps {
  settings?: DataManagementSettings;
  onSave: (values: DataManagementSettings) => void;
  isSubmitting: boolean;
}

const DataManagementSettingsForm = ({ settings, onSave, isSubmitting }: DataManagementSettingsFormProps) => {
  // Set default values based on provided settings or schema defaults
  const defaultValues: DataManagementSettings = settings || {
    dataRetention: 'standard',
    downloadData: false,
    deleteData: false
  };

  const form = useForm<DataManagementSettings>({
    resolver: zodResolver(dataManagementSettingsSchema),
    defaultValues,
  });

  const handleSubmit = (values: DataManagementSettings) => {
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Data Retention */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Database className="mr-2 h-5 w-5" /> Data Retention</h3>
              
              <FormField
                control={form.control}
                name="dataRetention"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Retention Policy</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select data retention policy" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal (Essential Data Only)</SelectItem>
                        <SelectItem value="standard">Standard (Default)</SelectItem>
                        <SelectItem value="extended">Extended (Keep All History)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Controls how long we retain your personal data and activity history
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Data Export & Deletion */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Data Export & Deletion</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="text-base font-medium flex items-center"><Download className="mr-2 h-4 w-4" /> Export Your Data</h4>
                    <p className="text-sm text-muted-foreground mt-1">Download a copy of all your personal data</p>
                  </div>
                  <Button variant="outline" type="button">
                    Export Data
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                  <div>
                    <h4 className="text-base font-medium text-destructive flex items-center"><Trash2 className="mr-2 h-4 w-4" /> Delete Account</h4>
                    <p className="text-sm text-muted-foreground mt-1">Permanently delete your account and all associated data</p>
                  </div>
                  <Button variant="destructive" type="button">
                    Delete Account
                  </Button>
                </div>
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
              <>Save Data Settings</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DataManagementSettingsForm;