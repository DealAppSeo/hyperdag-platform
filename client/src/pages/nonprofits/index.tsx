import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

// Import lazy loading to prevent cyclic dependencies
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load the nonprofit components to prevent circular references
// We're creating simple mobile-friendly versions of these components
// to work around any potential loading issues on mobile devices

// Simple mobile-friendly directory page
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
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Convoy of Hope</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Humanitarian Aid</span>
        </div>
        <p className="text-xs mt-1">A humanitarian organization providing food, shelter, and other essential resources to those in need, with a history of consistent four-star ratings from Charity Navigator.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Christian Blind Mission International</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Disability & Inclusion</span>
        </div>
        <p className="text-xs mt-1">This charity is known for allocating 100% of donations to the cause.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Direct Relief</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Healthcare</span>
        </div>
        <p className="text-xs mt-1">Healthy People. Better world. All people.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">FaithTech</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Technology</span>
        </div>
        <p className="text-xs mt-1">Bridging the gap between faith and technology.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Samaritan's Purse</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Disaster Relief</span>
        </div>
        <p className="text-xs mt-1">An international relief organization providing disaster relief and humanitarian aid, also known for its high ratings.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">World Vision</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Child Welfare</span>
        </div>
        <p className="text-xs mt-1">A global organization focused on child welfare, with a strong track record and a 94% score from Charity Navigator.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Living Water International</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Clean Water</span>
        </div>
        <p className="text-xs mt-1">Providing clean water and sharing God's love.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Mercy Ships</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Healthcare</span>
        </div>
        <p className="text-xs mt-1">A Christian charity that uses hospital ships to provide healthcare to those in need in developing countries.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">The Water Project</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Clean Water</span>
        </div>
        <p className="text-xs mt-1">Providing reliable water projects for communities in sub-Saharan Africa who suffer needlessly from a lack of access to clean water.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Good 360</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Humanitarian Aid</span>
        </div>
        <p className="text-xs mt-1">Closing the need gap to create opportunity for all.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Healing Hands International</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>International Aid</span>
        </div>
        <p className="text-xs mt-1">Giving hope to a hurting world.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Heart to Heart International</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Humanitarian Aid</span>
        </div>
        <p className="text-xs mt-1">This charity is known for allocating 100% of donations to the cause.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Matthew 25 Ministries</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Humanitarian Aid</span>
        </div>
        <p className="text-xs mt-1">A Christian charity focused on helping those in need, with a focus on practical solutions.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">VETS Veterans Exploring Treatment Solutions</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Veterans Support</span>
        </div>
        <p className="text-xs mt-1">This charity provides mental health support, resources, and community for veterans healing from trauma and PTSD.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Four Square Missions Press</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Faith-Based Education</span>
        </div>
        <p className="text-xs mt-1">Publishing and distributing literature for spiritual education and ministry.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Christian Health Service Corps</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Healthcare</span>
        </div>
        <p className="text-xs mt-1">A ministry of Christian doctors, health professionals and health educators serving the poor in developing countries.</p>
      </div>
      
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Midwest Food Bank</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Food Security</span>
        </div>
        <p className="text-xs mt-1">This charity is known for allocating 100% of donations to the cause.</p>
      </div>
    </div>
  </div>
);

// Simple mobile-friendly methodology page
const MobileNonprofitMethodologyPage = () => (
  <div className="p-2">
    <h2 className="text-lg font-semibold mb-3">Our Verification Methodology</h2>
    <p className="text-sm mb-3">We use a rigorous process to verify nonprofits based on these key categories:</p>
    <div className="space-y-3">
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Accountability & Finance</h3>
        <p className="text-xs">Assessment of financial health, transparency in reporting, and responsible use of funds.</p>
      </div>
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Impact & Results</h3>
        <p className="text-xs">Evaluation of measurable outcomes and effectiveness of programs.</p>
      </div>
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Leadership & Structure</h3>
        <p className="text-xs">Review of organizational governance, board composition, and ethical practices.</p>
      </div>
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Web3 Integration</h3>
        <p className="text-xs">Assessment of blockchain technology use for transparency and data ownership.</p>
      </div>
    </div>
  </div>
);

// Simple mobile-friendly submit page
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
      <div>
        <label className="text-sm font-medium">Category</label>
        <select className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
          <option>Education</option>
          <option>Healthcare</option>
          <option>Environment</option>
          <option>Humanitarian</option>
          <option>Arts & Culture</option>
          <option>Other</option>
        </select>
      </div>
      <button className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium">Submit for Verification</button>
    </form>
  </div>
);

// Simple mobile-friendly referral page
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
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Share via</h3>
        <div className="grid grid-cols-4 gap-2 mt-2">
          <button className="flex flex-col items-center text-xs">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mb-1">T</div>
            Twitter
          </button>
          <button className="flex flex-col items-center text-xs">
            <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center text-white mb-1">F</div>
            Facebook
          </button>
          <button className="flex flex-col items-center text-xs">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white mb-1">L</div>
            LinkedIn
          </button>
          <button className="flex flex-col items-center text-xs">
            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white mb-1">E</div>
            Email
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Simple mobile-friendly sharing documentation
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
      <div className="bg-card rounded-lg p-3 border">
        <h3 className="font-medium">Verification Process</h3>
        <ol className="text-xs list-decimal list-inside mt-2 space-y-1">
          <li>Submit your organization's information</li>
          <li>Complete documentation requirements</li>
          <li>Undergo review and verification</li>
          <li>Receive your SBT and join the ecosystem</li>
        </ol>
      </div>
    </div>
  </div>
);

// Use these mobile-friendly components on small screens, and load the full versions on larger screens
const NonprofitDirectoryPage = lazy(() => import('../nonprofit-directory-page'));
const NonprofitMethodologyPage = lazy(() => import('../nonprofit-methodology-page'));
const NonprofitSubmitPage = lazy(() => import('../nonprofit-submit-page'));
const NonprofitReferralPage = lazy(() => import('../nonprofit-referral-page'));
const NonprofitSharingDoc = lazy(() => import('../nonprofit-sharing-doc'));

// Loading component for lazy-loaded content
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const NonprofitsPage = () => {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('directory');

  // Extract the tab from the URL if it exists
  const tabFromUrl = location.split('/')[2];
  
  // Set the active tab based on the URL or default to 'directory'
  useEffect(() => {
    if (tabFromUrl) {
      switch (tabFromUrl) {
        case 'methodology':
          setActiveTab('methodology');
          break;
        case 'submit':
          setActiveTab('submit');
          break;
        case 'refer':
          setActiveTab('refer');
          break;
        case 'sharing':
          setActiveTab('sharing');
          break;
        default:
          setActiveTab('directory');
      }
    }
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update the URL to reflect the current tab
    switch (value) {
      case 'methodology':
        navigate('/nonprofits/methodology');
        break;
      case 'submit':
        navigate('/nonprofits/submit');
        break;
      case 'refer':
        navigate('/nonprofits/refer');
        break;
      case 'sharing':
        navigate('/nonprofits/sharing');
        break;
      default:
        navigate('/nonprofits');
    }
  };

  return (
    <div className="px-3 py-4 mx-auto bg-white max-w-full">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="sm" className="px-2 py-1 h-8" asChild>
            <Link to="/">
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
  );
};

export default NonprofitsPage;