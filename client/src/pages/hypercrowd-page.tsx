import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Code, Paintbrush, TrendingUp, UserPlus, ChevronLeft } from 'lucide-react';

// Mock data for team matching - will connect to actual backend API
const teamRoles = [
  { id: 1, title: 'Developer', icon: <Code className="w-4 h-4" />, description: 'Blockchain, smart contract, full-stack developers' },
  { id: 2, title: 'Designer', icon: <Paintbrush className="w-4 h-4" />, description: 'UI/UX, graphic design, brand identity' },
  { id: 3, title: 'Growth Hacker', icon: <TrendingUp className="w-4 h-4" />, description: 'Marketing, community building, user acquisition' },
  { id: 4, title: 'Project Lead', icon: <Users className="w-4 h-4" />, description: 'Project management, coordination, leadership' },
];

// Mock data for team recommendations
const recommendedTeamMembers = [
  { 
    id: 1, 
    name: 'Alex Chen', 
    role: 'Developer', 
    skills: ['Smart Contracts', 'Solidity', 'React'], 
    avatarUrl: '', 
    match: 87,
    bio: 'Full-stack developer with 4 years of experience in blockchain technologies. Passionate about ZKPs and privacy-focused applications.'
  },
  { 
    id: 2, 
    name: 'Maya Johnson', 
    role: 'Designer', 
    skills: ['UI/UX', 'Figma', 'Design Systems'], 
    avatarUrl: '', 
    match: 92,
    bio: 'Creative designer specializing in intuitive interfaces for Web3 applications. Has worked on 12+ launched products.'
  },
  { 
    id: 3, 
    name: 'Eric Rodriguez', 
    role: 'Growth Hacker', 
    skills: ['Marketing', 'Community Building', 'Analytics'], 
    avatarUrl: '', 
    match: 79,
    bio: 'Growth specialist with experience driving adoption for early-stage crypto projects. Expert in community engagement and tokenomics.'
  },
  { 
    id: 4, 
    name: 'Sarah Williams', 
    role: 'Project Lead', 
    skills: ['Agile', 'Team Management', 'Strategy'], 
    avatarUrl: '', 
    match: 85,
    bio: 'Experienced project manager who has led multiple Web3 projects from concept to launch. Strong technical background with MBA.'
  },
];

// Mock data for active projects that need team members
const activeGrants = [
  {
    id: 1,
    title: 'Privacy-First DeFi Analytics Dashboard',
    description: 'Building a ZKP-powered analytics platform for DeFi protocols that preserves user privacy while providing valuable insights.',
    budget: '$25,000',
    deadline: '30 days',
    roles: ['Developer', 'Designer'],
    tags: ['DeFi', 'ZKP', 'Analytics'],
    teamSize: 4,
    currentTeam: 2
  },
  {
    id: 2,
    title: 'Cross-Chain NFT Marketplace',
    description: 'Create a marketplace that allows seamless trading of NFTs across multiple blockchains with unified liquidity.',
    budget: '$40,000',
    deadline: '60 days',
    roles: ['Developer', 'Designer', 'Growth Hacker'],
    tags: ['NFT', 'Cross-chain', 'Marketplace'],
    teamSize: 5,
    currentTeam: 3
  },
  {
    id: 3,
    title: 'Decentralized Identity Verification System',
    description: 'Build a self-sovereign identity system using Zero-Knowledge Proofs for selective disclosure of personal information.',
    budget: '$35,000',
    deadline: '45 days',
    roles: ['Developer', 'Project Lead'],
    tags: ['Identity', 'ZKP', 'Privacy'],
    teamSize: 4,
    currentTeam: 1
  }
];

// Define the skills for each role (for the skill selection UI)
const roleSkills = {
  Developer: ['Smart Contracts', 'Front-end', 'Back-end', 'Solidity', 'Rust', 'ZK Circuits', 'React', 'Node.js', 'TypeScript', 'Python'],
  Designer: ['UI/UX', 'Figma', 'Graphic Design', 'Visual Identity', 'Animation', 'Prototyping', 'Design Systems'],
  'Growth Hacker': ['Marketing', 'Community Building', 'Analytics', 'Content Creation', 'Social Media', 'SEO', 'User Acquisition'],
  'Project Lead': ['Project Management', 'Agile', 'Team Coordination', 'Strategy', 'Budgeting', 'Resource Planning']
};

export default function HyperCrowdPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('find-team');

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

  const findMatches = () => {
    setIsLoading(true);
    // In a real implementation, this would call an API endpoint
    setTimeout(() => {
      setIsLoading(false);
      setActiveTab('recommended');
      toast({
        title: "Team matching complete!",
        description: "We've found several potential team members based on your criteria.",
      });
    }, 1500);
  };

  const applyToProject = (projectId: number) => {
    toast({
      title: "Application submitted!",
      description: "The project team has been notified of your interest.",
    });
  };

  const inviteToTeam = (memberId: number) => {
    toast({
      title: "Invitation sent!",
      description: "They'll be notified of your interest in collaborating.",
    });
  };

  return (
    <div className="container py-6 max-w-6xl">
      <nav className="flex items-center mb-4">
        <Button variant="ghost" size="sm" className="gap-1">
          <Link href="/">
            <div className="flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </div>
          </Link>
        </Button>
      </nav>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-primary/10 p-3 rounded-full">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <PageHeader 
          title="HyperCrowd" 
          description="Connect with builders, designers, and growth hackers to form your dream Web3 team"
        />
      </div>

      <Tabs defaultValue="find-team" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="find-team">Find Team Members</TabsTrigger>
          <TabsTrigger value="recommended">Recommended Matches</TabsTrigger>
          <TabsTrigger value="grants">Active Grants</TabsTrigger>
        </TabsList>

        <TabsContent value="find-team">
          <Card>
            <CardHeader>
              <CardTitle>What's your role in the project?</CardTitle>
              <CardDescription>
                Select your primary role to help us match you with complementary team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {teamRoles.map(role => (
                  <Card 
                    key={role.id} 
                    className={`cursor-pointer transition-all ${selectedRole === role.title ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground'}`}
                    onClick={() => handleRoleSelection(role.title)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                          {role.icon}
                        </div>
                        <h3 className="font-semibold text-lg">{role.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">{role.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedRole && (
                <>
                  <h3 className="font-semibold text-lg mb-4">Select your skills</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {roleSkills[selectedRole as keyof typeof roleSkills].map(skill => (
                      <Badge
                        key={skill}
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6">
              <Button 
                onClick={findMatches} 
                disabled={!selectedRole || selectedSkills.length === 0 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding matches...
                  </>
                ) : (
                  'Find Team Matches'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="recommended">
          <div className="grid grid-cols-1 gap-6">
            {recommendedTeamMembers.map(member => (
              <Card key={member.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 p-6 flex flex-col items-center justify-center bg-muted/20">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-xl mb-1">{member.name}</h3>
                    <Badge variant="outline" className="mb-3">{member.role}</Badge>
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">Match Score</span>
                      <div className="font-bold text-2xl text-primary">{member.match}%</div>
                    </div>
                  </div>
                  
                  <div className="md:w-3/4 p-6">
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Bio</h4>
                      <p className="text-muted-foreground">{member.bio}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {member.skills.map(skill => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button onClick={() => inviteToTeam(member.id)} className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Invite to Team
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grants">
          <div className="grid grid-cols-1 gap-6">
            {activeGrants.map(grant => (
              <Card key={grant.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{grant.title}</CardTitle>
                      <CardDescription className="mt-1">{grant.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2 whitespace-nowrap">
                      Team: {grant.currentTeam}/{grant.teamSize}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Budget</h4>
                      <p className="font-semibold">{grant.budget}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Deadline</h4>
                      <p className="font-semibold">{grant.deadline}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Needed Roles</h4>
                      <div className="flex flex-wrap gap-1">
                        {grant.roles.map(role => (
                          <Badge key={role} variant="secondary">{role}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {grant.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6">
                  <Button onClick={() => applyToProject(grant.id)}>
                    Apply to Join
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}