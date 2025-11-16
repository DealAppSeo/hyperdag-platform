import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Users, Briefcase, Gift, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Define mobile components directly in this file
const FindTeamMobile = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  const roleSkills = {
    Developer: ['Smart Contracts', 'Front-end', 'Back-end', 'Solidity', 'Rust', 'ZK Circuits', 'React', 'Node.js', 'TypeScript', 'Python'],
    Designer: ['UI/UX', 'Figma', 'Graphic Design', 'Visual Identity', 'Animation', 'Prototyping', 'Design Systems'],
    'Growth Hacker': ['Marketing', 'Community Building', 'Analytics', 'Content Creation', 'Social Media', 'SEO', 'User Acquisition'],
    'Project Lead': ['Project Management', 'Agile', 'Team Coordination', 'Strategy', 'Budgeting', 'Resource Planning']
  };
  
  const handleRoleSelection = (role: string) => {
    setSelectedRole(role);
    setSelectedSkills([]);
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };
  
  return (
    <div className="p-2">
      <h2 className="text-lg font-semibold mb-3">Find Your Team</h2>
      <p className="text-sm mb-3">Connect with collaborators who share your vision.</p>
      
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Select your role:</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(roleSkills).map(role => (
            <button
              key={role}
              className={`p-2 border rounded-md text-sm ${selectedRole === role ? 'bg-primary text-primary-foreground' : 'bg-card'}`}
              onClick={() => handleRoleSelection(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
      
      {selectedRole && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Select your skills:</h3>
          <div className="flex flex-wrap gap-1">
            {roleSkills[selectedRole as keyof typeof roleSkills].map(skill => (
              <button
                key={skill}
                className={`px-2 py-1 text-xs rounded-full ${
                  selectedSkills.includes(skill) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <Button className="w-full" disabled={!selectedRole || selectedSkills.length === 0}>
          Find Matching Projects
        </Button>
      </div>
      
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Featured Projects Seeking {selectedRole || 'Team Members'}</h3>
        <div className="space-y-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm">AI-Enhanced Privacy Platform</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">ZK Proofs</Badge>
                    <Badge variant="outline" className="text-xs">Smart Contracts</Badge>
                  </div>
                  <p className="text-xs mt-2">Looking for developers, designers, and a project lead.</p>
                </div>
                <Button size="sm" variant="ghost">View</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm">DAG-Based Storage Solution</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">IPFS</Badge>
                    <Badge variant="outline" className="text-xs">Back-end</Badge>
                  </div>
                  <p className="text-xs mt-2">Seeking developers with experience in distributed systems.</p>
                </div>
                <Button size="sm" variant="ghost">View</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ProjectsMobile = () => {
  return (
    <div className="p-2">
      <h2 className="text-lg font-semibold mb-3">Browse Projects</h2>
      <p className="text-sm mb-3">Discover and join Web3 and AI projects looking for collaborators.</p>
      
      <div className="flex items-center mb-3">
        <input 
          type="text" 
          placeholder="Search projects..." 
          className="flex-1 px-3 py-2 rounded-l-md border text-sm focus:outline-none"
        />
        <Button className="rounded-l-none">Search</Button>
      </div>
      
      <div className="space-y-3">
        <Card>
          <CardContent className="p-3">
            <h3 className="font-medium">Cross-Chain Identity Verification</h3>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Badge className="mr-2">Web3</Badge>
              <Badge variant="outline">In Progress</Badge>
            </div>
            <p className="text-xs mt-2">Building a decentralized identity solution that works across multiple blockchains using zero-knowledge proofs.</p>
            <div className="mt-2 flex justify-between items-center">
              <div className="flex -space-x-2">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback>SK</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback>+3</AvatarFallback>
                </Avatar>
              </div>
              <Button size="sm" variant="outline">View Details</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <h3 className="font-medium">Privacy-Preserving Analytics Dashboard</h3>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Badge className="mr-2">AI</Badge>
              <Badge variant="outline">Seeking Team</Badge>
            </div>
            <p className="text-xs mt-2">Creating a dashboard that provides insights from data without compromising user privacy.</p>
            <div className="mt-2 flex justify-between items-center">
              <div className="flex -space-x-2">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback>MJ</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback>+2</AvatarFallback>
                </Avatar>
              </div>
              <Button size="sm" variant="outline">View Details</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const GrantsMobile = () => {
  return (
    <div className="p-2">
      <h2 className="text-lg font-semibold mb-3">Available Grants</h2>
      <p className="text-sm mb-3">Discover funding opportunities for your Web3 and AI projects.</p>
      
      <div className="space-y-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Polygon Ecosystem Fund</h3>
              <Badge>$50K-$250K</Badge>
            </div>
            <p className="text-xs mt-2">Supporting projects building on Polygon with a focus on scalability, privacy, and user experience.</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">DeFi</Badge>
              <Badge variant="outline" className="text-xs">NFT</Badge>
              <Badge variant="outline" className="text-xs">Infrastructure</Badge>
            </div>
            <Button size="sm" className="w-full mt-3">Apply Now</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">AI Privacy Initiative</h3>
              <Badge>$25K-$100K</Badge>
            </div>
            <p className="text-xs mt-2">Funding projects that combine AI capabilities with strong privacy guarantees and data minimization.</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">AI</Badge>
              <Badge variant="outline" className="text-xs">Privacy</Badge>
              <Badge variant="outline" className="text-xs">ZKP</Badge>
            </div>
            <Button size="sm" className="w-full mt-3">Apply Now</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ResourcesMobile = () => {
  return (
    <div className="p-2">
      <h2 className="text-lg font-semibold mb-3">Resources</h2>
      <p className="text-sm mb-3">Educational materials and tools to help your team succeed.</p>
      
      <div className="space-y-3">
        <Card>
          <CardContent className="p-3">
            <h3 className="font-medium">Team Formation Guide</h3>
            <p className="text-xs mt-1">Best practices for building effective Web3 project teams and managing remote collaboration.</p>
            <Button size="sm" variant="outline" className="mt-2">Read Guide</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <h3 className="font-medium">Grant Application Templates</h3>
            <p className="text-xs mt-1">Ready-to-use templates for common grant applications with tips for success.</p>
            <Button size="sm" variant="outline" className="mt-2">Download Templates</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <h3 className="font-medium">Web3 Project Management Tools</h3>
            <p className="text-xs mt-1">Curated list of tools and services for managing decentralized teams and projects.</p>
            <Button size="sm" variant="outline" className="mt-2">View Tools</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// For desktop components, we'll use the same mobile components for now
// until we create separate desktop versions
const FindTeamDesktop = FindTeamMobile;
const ProjectsDesktop = ProjectsMobile;
const GrantsDesktop = GrantsMobile;
const ResourcesDesktop = ResourcesMobile;

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin w-10 h-10 border-t-2 border-b-2 border-primary rounded-full"></div>
  </div>
);

export default function HyperCrowdPage() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('find-team');
  const { toast } = useToast();
  
  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL without navigation for better sharing
    const baseUrl = '/hypercrowd';
    const newPath = value === 'find-team' ? baseUrl : `${baseUrl}/${value}`;
    window.history.replaceState(null, '', newPath);
  };

  return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-3">HyperCrowd</h1>
          <p className="text-muted-foreground text-xs max-w-3xl">
            Find collaborators, join projects, and discover grants for Web3 and AI initiatives.
          </p>
        </div>

        <div className="border-b border-gray-200 mb-4"></div>

        <Tabs defaultValue="find-team" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-4 flex w-full overflow-x-auto space-x-1 justify-between bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="find-team" className="flex-1 py-1.5 text-xs rounded-md">
              <Users className="h-3 w-3 mr-1" />
              Find Team
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex-1 py-1.5 text-xs rounded-md">
              <Briefcase className="h-3 w-3 mr-1" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="grants" className="flex-1 py-1.5 text-xs rounded-md">
              <Gift className="h-3 w-3 mr-1" />
              Grants
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex-1 py-1.5 text-xs rounded-md">
              <FileText className="h-3 w-3 mr-1" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="find-team" className="mt-2">
            <div className="block md:hidden">
              <FindTeamMobile />
            </div>
            <div className="hidden md:block">
              <Suspense fallback={<LoadingFallback />}>
                <FindTeamDesktop />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-2">
            <div className="block md:hidden">
              <ProjectsMobile />
            </div>
            <div className="hidden md:block">
              <Suspense fallback={<LoadingFallback />}>
                <ProjectsDesktop />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="grants" className="mt-2">
            <div className="block md:hidden">
              <GrantsMobile />
            </div>
            <div className="hidden md:block">
              <Suspense fallback={<LoadingFallback />}>
                <GrantsDesktop />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="mt-2">
            <div className="block md:hidden">
              <ResourcesMobile />
            </div>
            <div className="hidden md:block">
              <Suspense fallback={<LoadingFallback />}>
                <ResourcesDesktop />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}