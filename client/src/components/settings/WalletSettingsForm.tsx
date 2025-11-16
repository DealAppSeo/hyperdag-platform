import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WalletSettings, walletSettingsSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Wallet, Network, Gauge } from 'lucide-react';

interface WalletSettingsFormProps {
  settings?: WalletSettings;
  onSave: (values: WalletSettings) => void;
  isSubmitting: boolean;
}

const WalletSettingsForm = ({ settings, onSave, isSubmitting }: WalletSettingsFormProps) => {
  // Set default values based on provided settings or schema defaults
  const defaultValues: WalletSettings = settings || {
    defaultWallet: '',
    autoConnect: false,
    revealAddress: false,
    transactionNotifications: true,
    networkPreference: 'polygon',
    gasPreference: 'standard'
  };

  const form = useForm<WalletSettings>({
    resolver: zodResolver(walletSettingsSchema),
    defaultValues,
  });

  const handleSubmit = (values: WalletSettings) => {
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Wallet Preferences */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Wallet className="mr-2 h-5 w-5" /> Wallet Preferences</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="defaultWallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Wallet Address</FormLabel>
                      <FormControl>
                        <input
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Enter your default wallet address"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The wallet address to use by default for transactions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoConnect"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-Connect Wallet</FormLabel>
                        <FormDescription>
                          Automatically connect your wallet when visiting the site
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
                  name="revealAddress"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Reveal Wallet Address</FormLabel>
                        <FormDescription>
                          Show your wallet address to other users on your profile
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
                  name="transactionNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Transaction Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications for transactions and wallet activity
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

        {/* Network Preferences */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Network className="mr-2 h-5 w-5" /> Network Preferences</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="networkPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Network</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="polygon">Polygon</SelectItem>
                          <SelectItem value="ethereum">Ethereum</SelectItem>
                          <SelectItem value="optimism">Optimism</SelectItem>
                          <SelectItem value="arbitrum">Arbitrum</SelectItem>
                          <SelectItem value="zkSync">zkSync</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Your preferred blockchain network for transactions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gasPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gas Preference</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gas preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low (Slower)</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="fast">Fast (Higher Cost)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Your preferred gas setting for transactions
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
              <>Save Wallet Settings</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default WalletSettingsForm;