import React, { Suspense, useState, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/layout';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { ChevronLeft, Heart } from 'lucide-react';
import { Link } from 'wouter';

// Define mobile components directly in this file - reusing from index.tsx
// These are extracted from nonprofits/index.tsx
const MobileNonprofitDirectoryPage = () => (
  <div className="p-2">
    <h2 className="text-lg font-semibold mb-3">Verified Nonprofits Directory</h2>
    <p className="text-sm mb-3">Browse our directory of verified nonprofit organizations that use Web3 technology for data ownership and transparency.</p>
    <div className="space-y-3">
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Accord Network</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Christian Faith-Based</span>
        </div>
        <p className="text-xs mt-1">A place to connect with like-minded organizations in pursuit of being the hands and feet of Christ around the world.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Compassion International</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Child Development</span>
        </div>
        <p className="text-xs mt-1">A Christian child development organization working to release children from poverty in Jesus' name, with a focus on long-term solutions.</p>
      </div>
    </div>
  </div>
);

const MobileNonprofitMethodologyPage = () => (
  <div className="p-2">
    <h2 className="text-lg font-semibold mb-3">Our Verification Methodology</h2>
    <p className="text-sm mb-3">We use a rigorous process to verify nonprofits based on these key categories:</p>
    <div className="space-y-3">
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Accountability & Finance</h3>
        <p className="text-xs mt-1">Assessment of financial health, transparency in reporting, and responsible use of funds.</p>
      </div>
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Impact & Results</h3>
        <p className="text-xs mt-1">Evaluation of measurable outcomes and effectiveness of programs.</p>
      </div>
    </div>
  </div>
);

const MobileNonprofitSubmitPage = () => (
  <div className="p-2">
    <h2 className="text-lg font-semibold mb-3">Submit a Nonprofit</h2>
    <p className="text-sm mb-3">Help us grow our directory by submitting a nonprofit organization for verification.</p>
    <form className="space-y-3">
      <div>
        <label className="text-sm font-medium">Organization Name</label>
        <input type="text" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" placeholder="Enter nonprofit name" />
      </div>
      <div>
        <label className="text-sm font-medium">Website</label>
        <input type="url" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" placeholder="https://..." />
      </div>
      <button className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium">Submit for Verification</button>
    </form>
  </div>
);

const MobileNonprofitReferralPage = () => (
  <div className="p-2">
    <h2 className="text-lg font-semibold mb-3">Share & Refer Nonprofits</h2>
    <p className="text-sm mb-3">Help nonprofits join our ecosystem and receive tokens for your referrals.</p>
    <div className="space-y-3">
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Your Referral Code</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="bg-muted px-3 py-1 rounded-md text-sm font-mono">836277C0</span>
          <button className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md">Copy</button>
        </div>
      </div>
    </div>
  </div>
);

const MobileNonprofitSharingDoc = () => (
  <div className="p-2">
    <h2 className="text-lg font-semibold mb-3">Nonprofit Documentation</h2>
    <p className="text-sm mb-3">Resources and documentation to help nonprofits understand our verification process and benefits.</p>
    <div className="space-y-3">
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Benefits of Verification</h3>
        <ul className="text-xs list-disc list-inside mt-2 space-y-1">
          <li>Receive Soulbound Tokens (SBTs) as proof of verification</li>
          <li>Gain access to Web3 funding opportunities</li>
          <li>Maintain ownership of your organization's data</li>
          <li>Increase transparency for donors and supporters</li>
        </ul>
      </div>
    </div>
  </div>
);

// Lazy load full desktop components
const NonprofitDirectoryPage = lazy(() => import('../nonprofit-directory-page'));
const NonprofitMethodologyPage = lazy(() => import('../nonprofit-methodology-page'));
const NonprofitSubmitPage = lazy(() => import('../nonprofit-submit-page'));
const NonprofitReferralPage = lazy(() => import('../nonprofit-referral-page'));
const NonprofitSharingDoc = lazy(() => import('../nonprofit-sharing-doc'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin w-10 h-10 border-t-2 border-b-2 border-primary rounded-full"></div>
  </div>
);

export default function NonprofitHubPage() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('directory');
  
  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL without navigation for better sharing
    const baseUrl = '/nonprofits';
    const newPath = value === 'directory' ? baseUrl : `${baseUrl}/${value}`;
    window.history.replaceState(null, '', newPath);
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" className="px-2 py-1 h-8" asChild>
              <Link href="/">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Nonprofit Hub</h1>
          </div>
          <p className="text-muted-foreground text-xs max-w-3xl">
            Helping nonprofits build reputation, receive donations, and maintain data ownership through Web3.
          </p>
        </div>

        <div className="border-b border-gray-200 mb-4"></div>

        <Tabs defaultValue="directory" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-4 flex w-full overflow-x-auto space-x-1 justify-between bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="directory" className="flex-1 py-1.5 text-xs rounded-md">Directory</TabsTrigger>
            <TabsTrigger value="methodology" className="flex-1 py-1.5 text-xs rounded-md">Methods</TabsTrigger>
            <TabsTrigger value="submit" className="flex-1 py-1.5 text-xs rounded-md">Submit</TabsTrigger>
            <TabsTrigger value="refer" className="flex-1 py-1.5 text-xs rounded-md">Refer</TabsTrigger>
            <TabsTrigger value="sharing" className="flex-1 py-1.5 text-xs rounded-md">Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="mt-2">
            {/* Use mobile components on small screens and regular components on larger screens */}
            <div className="block md:hidden">
              <MobileNonprofitDirectoryPage />
            </div>
            <div className="hidden md:block">
              <Suspense fallback={<LoadingFallback />}>
                <NonprofitDirectoryPage />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="methodology" className="mt-2">
            <div className="block md:hidden">
              <MobileNonprofitMethodologyPage />
            </div>
            <div className="hidden md:block">
              <Suspense fallback={<LoadingFallback />}>
                <NonprofitMethodologyPage />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="submit" className="mt-2">
            <div className="block md:hidden">
              <MobileNonprofitSubmitPage />
            </div>
            <div className="hidden md:block">
              <Suspense fallback={<LoadingFallback />}>
                <NonprofitSubmitPage />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="refer" className="mt-2">
            <div className="block md:hidden">
              <MobileNonprofitReferralPage />
            </div>
            <div className="hidden md:block">
              <Suspense fallback={<LoadingFallback />}>
                <NonprofitReferralPage />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="sharing" className="mt-2">
            <div className="block md:hidden">
              <MobileNonprofitSharingDoc />
            </div>
            <div className="hidden md:block">
              <Suspense fallback={<LoadingFallback />}>
                <NonprofitSharingDoc />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}