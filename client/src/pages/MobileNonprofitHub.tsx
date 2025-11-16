import { useState } from 'react';
import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Simple mobile-friendly directory page with updated Christian organizations in alphabetical order
const MobileDirectoryView = () => (
  <div className="p-3">
    <h2 className="text-lg font-semibold mb-3">Verified Nonprofits Directory</h2>
    <p className="text-sm mb-4">Browse our directory of verified nonprofit organizations that we have invited to use Web3 technology for data ownership and transparency. To invite your favorite nonprofit now click the submit button above or if you have a contact send them your referral link.</p>
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Accord Network</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Christian Faith-Based</span>
        </div>
        <p className="text-xs mt-2">A place to connect with like-minded organizations in pursuit of being the hands and feet of Christ around the world.</p>
        <a href="https://accordnetwork.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Christian Blind Mission International</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Disability & Inclusion</span>
        </div>
        <p className="text-xs mt-2">This charity is known for allocating 100% of donations to the cause.</p>
        <a href="https://www.cbm.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Christian Health Service Corps</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Healthcare</span>
        </div>
        <p className="text-xs mt-2">A ministry of Christian doctors, health professionals and health educators serving the poor in developing countries.</p>
        <a href="https://www.healthservicecorps.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Compassion International</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Child Development</span>
        </div>
        <p className="text-xs mt-2">A Christian child development organization working to release children from poverty in Jesus' name, with a focus on long-term solutions.</p>
        <a href="https://www.compassion.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Convoy of Hope</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Humanitarian Aid</span>
        </div>
        <p className="text-xs mt-2">A humanitarian organization providing food, shelter, and other essential resources to those in need, with a history of consistent four-star ratings from Charity Navigator.</p>
        <a href="https://www.convoyofhope.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Direct Relief</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Healthcare</span>
        </div>
        <p className="text-xs mt-2">Healthy People. Better world. All people.</p>
        <a href="https://www.directrelief.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">FaithTech</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Technology</span>
        </div>
        <p className="text-xs mt-2">Bridging the gap between faith and technology.</p>
        <a href="https://faithtech.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Good 360</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Humanitarian Aid</span>
        </div>
        <p className="text-xs mt-2">Closing the need gap to create opportunity for all.</p>
        <a href="https://good360.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Helping Hands Medical Missions</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Healthcare</span>
        </div>
        <p className="text-xs mt-2">Faith-based medical missions providing healthcare services and spiritual support to underserved communities around the world.</p>
        <a href="https://hhmm.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Living Water International</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Clean Water</span>
        </div>
        <p className="text-xs mt-2">Providing clean water and sharing God's love.</p>
        <a href="https://water.cc" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Matthew 25 Ministries</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Humanitarian Aid</span>
        </div>
        <p className="text-xs mt-2">A Christian charity focused on helping those in need, with a focus on practical solutions.</p>
        <a href="https://m25m.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Mercy Ships</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Healthcare</span>
        </div>
        <p className="text-xs mt-2">A Christian charity that uses hospital ships to provide healthcare to those in need in developing countries.</p>
        <a href="https://www.mercyships.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Samaritan's Purse</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Disaster Relief</span>
        </div>
        <p className="text-xs mt-2">An international relief organization providing disaster relief and humanitarian aid, also known for its high ratings.</p>
        <a href="https://www.samaritanspurse.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">The Water Project</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Clean Water</span>
        </div>
        <p className="text-xs mt-2">Providing reliable water projects for communities in sub-Saharan Africa who suffer needlessly from a lack of access to clean water.</p>
        <a href="https://thewaterproject.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
      
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">World Vision</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mr-2">Verified</span>
          <span>Child Welfare</span>
        </div>
        <p className="text-xs mt-2">A global organization focused on child welfare, with a strong track record and a 94% score from Charity Navigator.</p>
        <a href="https://www.worldvision.org" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Visit Website →
        </a>
      </div>
    </div>
  </div>
);

// Simple mobile-friendly methodology page
const MobileMethodologyView = () => (
  <div className="p-3">
    <h2 className="text-lg font-semibold mb-3">Our Verification Methodology</h2>
    <p className="text-sm mb-4">We use a rigorous process to verify nonprofits based on these key categories:</p>
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Accountability & Finance</h3>
        <p className="text-xs mt-2">Assessment of financial health, transparency in reporting, and responsible use of funds.</p>
      </div>
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Impact & Results</h3>
        <p className="text-xs mt-2">Evaluation of measurable outcomes and effectiveness of programs.</p>
      </div>
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Leadership & Structure</h3>
        <p className="text-xs mt-2">Review of organizational governance, board composition, and ethical practices.</p>
      </div>
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Web3 Integration</h3>
        <p className="text-xs mt-2">Assessment of blockchain technology use for transparency and data ownership.</p>
      </div>
    </div>
  </div>
);

// Simple mobile-friendly submit page
const MobileSubmitView = () => (
  <div className="p-3">
    <h2 className="text-lg font-semibold mb-3">Submit a Nonprofit</h2>
    <p className="text-sm mb-4">Help us grow our directory by submitting a nonprofit organization for verification.</p>
    <form className="space-y-4">
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
      <button className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium">Submit for Verification</button>
    </form>
  </div>
);

// Simple mobile-friendly referral page
const MobileReferView = () => (
  <div className="p-3">
    <h2 className="text-lg font-semibold mb-3">Share & Refer Nonprofits</h2>
    <p className="text-sm mb-4">Help nonprofits join our ecosystem and receive tokens for your referrals.</p>
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Your Referral Code</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="bg-gray-100 px-3 py-1 rounded-md text-sm font-mono">836277C0</span>
          <button className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md">Copy</button>
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Share via</h3>
        <div className="grid grid-cols-4 gap-2 mt-3">
          <button className="flex flex-col items-center text-xs">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mb-1">T</div>
            Twitter
          </button>
          <button className="flex flex-col items-center text-xs">
            <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center text-white mb-1">F</div>
            Facebook
          </button>
          <button className="flex flex-col items-center text-xs">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white mb-1">L</div>
            LinkedIn
          </button>
          <button className="flex flex-col items-center text-xs">
            <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white mb-1">E</div>
            Email
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Simple mobile-friendly sharing page
const MobileSharingView = () => (
  <div className="p-3">
    <h2 className="text-lg font-semibold mb-3">Sharing Documentation</h2>
    <p className="text-sm mb-4">Use these resources to help explain HyperDAG benefits to nonprofits.</p>
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Why Web3 for Nonprofits</h3>
        <p className="text-xs mt-2 mb-2">A simple explanation of how blockchain technology helps nonprofits with transparency and engagement.</p>
        <button className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md">Download PDF</button>
      </div>
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">HyperDAG Benefits Guide</h3>
        <p className="text-xs mt-2 mb-2">Detailed overview of features available to nonprofits in our ecosystem.</p>
        <button className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md">Download PDF</button>
      </div>
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-medium">Getting Started Deck</h3>
        <p className="text-xs mt-2 mb-2">Presentation slides to help explain HyperDAG to nonprofit leadership.</p>
        <button className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md">Download PPTX</button>
      </div>
    </div>
  </div>
);

// Main component
export default function MobileNonprofitHub() {
  const [view, setView] = useState<'directory' | 'methodology' | 'submit' | 'refer' | 'sharing'>('directory');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="icon" className="mr-2">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">Nonprofit Hub</h1>
          </div>
        </div>
        <div className="flex overflow-x-auto pb-2 px-2 space-x-2">
          <Button 
            variant={view === 'directory' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('directory')}
          >
            Directory
          </Button>
          <Button 
            variant={view === 'methodology' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('methodology')}
          >
            Methodology
          </Button>
          <Button 
            variant={view === 'submit' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('submit')}
          >
            Submit
          </Button>
          <Button 
            variant={view === 'refer' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('refer')}
          >
            Refer
          </Button>
          <Button 
            variant={view === 'sharing' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('sharing')}
          >
            Sharing
          </Button>
        </div>
      </div>
      
      {view === 'directory' && <MobileDirectoryView />}
      {view === 'methodology' && <MobileMethodologyView />}
      {view === 'submit' && <MobileSubmitView />}
      {view === 'refer' && <MobileReferView />}
      {view === 'sharing' && <MobileSharingView />}
    </div>
  );
}