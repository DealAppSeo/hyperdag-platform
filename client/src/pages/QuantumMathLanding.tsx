import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Brain, Zap, Target, TrendingUp, Star, CheckCircle, Timer, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const subscribeSchema = z.object({
  email: z.string().email('Valid email required'),
  name: z.string().optional()
});

const orderSchema = z.object({
  customerEmail: z.string().email('Valid email required'),
  customerName: z.string().min(1, 'Name required'),
  companyName: z.string().optional(),
  serviceType: z.enum(['breakthrough_insight', 'continuous_discovery', 'custom_modeling']),
  problemDescription: z.string().min(50, 'Please provide detailed description (min 50 characters)'),
  mathDomain: z.enum(['number_theory', 'optimization', 'graph_theory', 'topology', 'analysis']),
  urgencyLevel: z.enum(['low', 'normal', 'high', 'critical']).default('normal')
});

type SubscribeForm = z.infer<typeof subscribeSchema>;
type OrderForm = z.infer<typeof orderSchema>;

export default function QuantumMathLanding() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const subscribeForm = useForm<SubscribeForm>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { email: '', name: '' }
  });

  const orderForm = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      serviceType: 'breakthrough_insight',
      mathDomain: 'optimization',
      urgencyLevel: 'normal'
    }
  });

  // Fetch recent insights for social proof (NO POLLING)
  const { data: insights, refetch: refetchInsights } = useQuery({
    queryKey: ['/api/quantummath/insights'],
    refetchInterval: false // ❌ NO POLLING - use manual refresh
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: SubscribeForm) => {
      const response = await fetch('/api/quantummath/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'landing_page' })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: 'Success!', description: data.message });
        subscribeForm.reset();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    }
  });

  const orderMutation = useMutation({
    mutationFn: async (data: OrderForm) => {
      const pricing = {
        breakthrough_insight: 500,
        continuous_discovery: 99,
        custom_modeling: 1000
      };
      
      const response = await fetch('/api/quantummath/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, amount: pricing[data.serviceType] })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: 'Order Created!', description: data.message });
        orderForm.reset();
        setShowOrderForm(false);
        queryClient.invalidateQueries({ queryKey: ['/api/quantummath/insights'] });
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            QuantumMath.ai
          </h1>
          <p className="text-2xl mb-8 text-gray-200">
            AI Agents That Discover Mathematical Breakthroughs For Your R&D
          </p>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
            Proven Unity Scores 0.596-0.972 • Zero Human Intervention • Real Mathematical Discoveries
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>$0 Operational Costs</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-full">
              <Timer className="w-5 h-5 text-blue-400" />
              <span>4-72 Hour Delivery</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full">
              <Brain className="w-5 h-5 text-purple-400" />
              <span>Trinity Symphony AI</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setShowOrderForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Zap className="w-5 h-5 mr-2" />
              Get Mathematical Breakthrough
            </Button>
          </div>
        </div>

        {/* Live Insights Feed */}
        {insights?.success && insights.insights.length > 0 && (
          <Card className="mb-16 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Live Mathematical Discoveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.insights.slice(0, 6).map((insight: any, idx: number) => (
                  <div key={idx} className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">Unity Score: {insight.unityScore}</span>
                    </div>
                    <p className="text-white font-medium">{insight.anonymizedDescription}</p>
                    <p className="text-sm text-gray-400">Agent: {insight.agentUsed}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-cyan-400" />
                Breakthrough Insight
              </CardTitle>
              <CardDescription className="text-gray-300">
                Single mathematical breakthrough or theorem proof
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <div className="text-3xl font-bold mb-2 text-cyan-400">$500</div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• AI agent analysis</li>
                <li>• Unity score calculation</li>
                <li>• Breakthrough documentation</li>
                <li>• 4-72 hour delivery</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-400" />
                Continuous Discovery
              </CardTitle>
              <CardDescription className="text-gray-300">
                Monthly mathematical analysis subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <div className="text-3xl font-bold mb-2 text-purple-400">$99<span className="text-lg">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Weekly breakthrough attempts</li>
                <li>• Pattern recognition analysis</li>
                <li>• Progress tracking</li>
                <li>• Priority support</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-400" />
                Custom Modeling
              </CardTitle>
              <CardDescription className="text-gray-300">
                Specialized mathematical modeling for R&D
              </CardDescription>
            </CardHeader>
            <CardContent className="text-white">
              <div className="text-3xl font-bold mb-2 text-green-400">$1000+</div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Custom problem formulation</li>
                <li>• Multi-agent collaboration</li>
                <li>• Detailed methodology</li>
                <li>• Enterprise consultation</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Email Capture */}
        <Card className="max-w-lg mx-auto bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Stay Updated on Mathematical Breakthroughs</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...subscribeForm}>
              <form onSubmit={subscribeForm.handleSubmit((data) => subscribeMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={subscribeForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="your@email.com" className="bg-gray-700 border-gray-600 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={subscribeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Name (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your name" className="bg-gray-700 border-gray-600 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  disabled={subscribeMutation.isPending}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500"
                >
                  {subscribeMutation.isPending ? 'Subscribing...' : 'Get Mathematical Updates'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white">Order Mathematical Discovery Service</CardTitle>
              <CardDescription className="text-gray-300">
                Describe your mathematical challenge and our AI agents will work on a breakthrough
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...orderForm}>
                <form onSubmit={orderForm.handleSubmit((data) => orderMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={orderForm.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Name *</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-gray-700 border-gray-600 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orderForm.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="bg-gray-700 border-gray-600 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={orderForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Company (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-gray-700 border-gray-600 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={orderForm.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Service Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="breakthrough_insight">Breakthrough Insight ($500)</SelectItem>
                              <SelectItem value="continuous_discovery">Continuous Discovery ($99/mo)</SelectItem>
                              <SelectItem value="custom_modeling">Custom Modeling ($1000+)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={orderForm.control}
                      name="mathDomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Math Domain</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="number_theory">Number Theory</SelectItem>
                              <SelectItem value="optimization">Optimization</SelectItem>
                              <SelectItem value="graph_theory">Graph Theory</SelectItem>
                              <SelectItem value="topology">Topology</SelectItem>
                              <SelectItem value="analysis">Analysis</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={orderForm.control}
                      name="urgencyLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Urgency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low (72h)</SelectItem>
                              <SelectItem value="normal">Normal (24h)</SelectItem>
                              <SelectItem value="high">High (12h)</SelectItem>
                              <SelectItem value="critical">Critical (4h)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={orderForm.control}
                    name="problemDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Problem Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={6}
                            placeholder="Describe your mathematical challenge, research goal, or problem you need solved. Be as specific as possible about what breakthrough you're seeking..."
                            className="bg-gray-700 border-gray-600 text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowOrderForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={orderMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500"
                    >
                      {orderMutation.isPending ? 'Creating Order...' : 'Create Order'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}