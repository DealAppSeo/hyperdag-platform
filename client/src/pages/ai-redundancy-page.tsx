/**
 * AI Redundancy Page
 * 
 * This page displays the AI redundancy system dashboard and test panel, 
 * allowing users to monitor and test the AI service redundancy features.
 */

import { 
  Settings, 
  BarChart3, 
  History, 
  Activity, 
  Server, 
  AlertCircle,
  Shield,
  Network
} from 'lucide-react';
import { AIRedundancyDashboard } from '@/components/ai-redundancy/dashboard';
import { AIRedundancyTestPanel } from '@/components/ai-redundancy/test-panel';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function AIRedundancyPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Redundancy System</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and test the multi-provider AI redundancy layer
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/documentation/ai">
                Documentation
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/api/docs/ai">
                API Reference
              </Link>
            </Button>
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Redundancy Enabled</AlertTitle>
          <AlertDescription>
            The AI redundancy system automatically routes requests to available providers 
            when a primary provider is unavailable. This ensures high availability and 
            service reliability for all AI-dependent features.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="rounded-lg border bg-card text-card-foreground shadow p-4 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">System Status</p>
            <p className="text-2xl font-bold">Operational</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow p-4 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Response Time</p>
            <p className="text-2xl font-bold">230ms</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow p-4 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Availability</p>
            <p className="text-2xl font-bold">99.9%</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow p-4 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Network className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Providers</p>
            <p className="text-2xl font-bold">3 Active</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="dashboard">
            <Settings className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="test">
            <History className="h-4 w-4 mr-2" />
            Test Panel
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-4">
          <AIRedundancyDashboard />
        </TabsContent>
        <TabsContent value="test" className="space-y-4">
          <AIRedundancyTestPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}