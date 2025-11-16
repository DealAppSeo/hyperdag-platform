import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Users, 
  MapPin, 
  Briefcase, 
  Award, 
  Star, 
  ExternalLink, 
  MessageCircle,
  Filter,
  Brain,
  Zap,
  DollarSign,
  Trophy,
  Heart,
  Code,
  Lightbulb
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUpWithPurposeHub } from '@/components/common/ThumbsUpWithPurposeHub';

interface UserProfile {
  id: number;
  username: string;
  repId: string;
  currentRole: string;
  experience: string;
  industry: string;
  location: string;
  bio: string;
  technicalSkills: string[];
  softSkills: string[];
  domainExpertise: string[];
  grantExperience: Array<{
    name: string;
    amount: number;
    year: number;
    status: string;
  }>;
  hackathonExperience: Array<{
    name: string;
    year: number;
    position: string;
    prize?: number;
  }>;
  nonprofitAffiliations: Array<{
    name: string;
    role: string;
    years: number;
  }>;
  lookingForCofounder?: boolean;
  lookingForTeam?: boolean;
  lookingForMentor?: boolean;
  lookingForMentee?: boolean;
  profileCompleteness: number;
  matchScore?: number;
}

const HyperCrowdPage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [hasGrantExp, setHasGrantExp] = useState('');
  const [hasHackathonExp, setHasHackathonExp] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch users with search filters
  const { data: searchResults, isLoading } = useQuery<{users: UserProfile[], pagination: any}>({
    queryKey: ['/api/hypercrowd/search', searchQuery, selectedSkills, selectedLocation, selectedIndustry, lookingFor, hasGrantExp, hasHackathonExp],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedSkills) params.append('skills', selectedSkills);
      if (selectedLocation) params.append('location', selectedLocation);
      if (selectedIndustry) params.append('industry', selectedIndustry);
      if (lookingFor) params.append('lookingFor', lookingFor);
      if (hasGrantExp) params.append('grantExperience', hasGrantExp);
      if (hasHackathonExp) params.append('hackathonExperience', hasHackathonExp);
      
      const response = await fetch(`/api/hypercrowd/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to search users');
      const result = await response.json();
      return result.data;
    }
  });

  const users = searchResults?.users || [];

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSkills('');
    setSelectedLocation('');
    setSelectedIndustry('');
    setLookingFor('');
    setHasGrantExp('');
    setHasHackathonExp('');
  };

  const getUserInitials = (username: string) => {
    return username.split('_').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };

  const getExperienceIcon = (user: UserProfile) => {
    if (user.grantExperience.length > 2) return <Award className="h-4 w-4 text-yellow-500" />;
    if (user.hackathonExperience.length > 2) return <Trophy className="h-4 w-4 text-purple-500" />;
    if (user.nonprofitAffiliations.length > 0) return <Heart className="h-4 w-4 text-red-500" />;
    return <Code className="h-4 w-4 text-blue-500" />;
  };

  const getTotalFunding = (grantExp: any[]) => {
    return grantExp.reduce((total, grant) => total + (grant.amount || 0), 0);
  };

  const getTotalPrizes = (hackathonExp: any[]) => {
    return hackathonExp.reduce((total, hack) => total + (hack.prize || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            HyperCrowd Directory
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover talented professionals in AI, Web3, and social impact. Find co-founders, team members, mentors, and collaborators.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Your Perfect Match
            </CardTitle>
            <CardDescription>
              Search by skills, location, experience, or what they're looking for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Input
                  placeholder="Search by name, role, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <Input
                  placeholder="Skills (e.g., Python, React)"
                  value={selectedSkills}
                  onChange={(e) => setSelectedSkills(e.target.value)}
                />
              </div>
              
              <div>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Location</SelectItem>
                    <SelectItem value="San Francisco">San Francisco</SelectItem>
                    <SelectItem value="New York">New York</SelectItem>
                    <SelectItem value="Boston">Boston</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Industry</SelectItem>
                    <SelectItem value="Healthcare">Healthcare Technology</SelectItem>
                    <SelectItem value="Financial">Financial Technology</SelectItem>
                    <SelectItem value="Social">Social Innovation</SelectItem>
                    <SelectItem value="Education">Education Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={lookingFor} onValueChange={setLookingFor}>
                <SelectTrigger>
                  <SelectValue placeholder="Looking For" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not Specified</SelectItem>
                  <SelectItem value="cofounder">Co-founder</SelectItem>
                  <SelectItem value="team">Team Members</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="mentee">Mentee</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={hasGrantExp} onValueChange={setHasGrantExp}>
                <SelectTrigger>
                  <SelectValue placeholder="Grant Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="true">Has Grant Experience</SelectItem>
                  <SelectItem value="false">No Grant Experience</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={hasHackathonExp} onValueChange={setHasHackathonExp}>
                <SelectTrigger>
                  <SelectValue placeholder="Hackathon Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="true">Has Hackathon Experience</SelectItem>
                  <SelectItem value="false">No Hackathon Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              
              <div className="text-sm text-gray-500">
                {users.length} professionals found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Searching professionals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                        <AvatarFallback>{getUserInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{user.username.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-gray-600">{user.currentRole}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          RepID: {user.repId.slice(-8)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getExperienceIcon(user)}
                      {user.matchScore && user.matchScore > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {user.matchScore}% match
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-700 line-clamp-3">{user.bio}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {user.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="h-4 w-4" />
                      {user.experience} in {user.industry}
                    </div>
                  </div>
                  
                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Top Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {user.technicalSkills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {user.technicalSkills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.technicalSkills.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Experience Highlights */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 rounded p-2">
                      <div className="text-lg font-bold text-green-600">
                        ${Math.round(getTotalFunding(user.grantExperience) / 1000)}K
                      </div>
                      <div className="text-xs text-gray-600">Grants</div>
                    </div>
                    <div className="bg-purple-50 rounded p-2">
                      <div className="text-lg font-bold text-purple-600">
                        {user.hackathonExperience.length}
                      </div>
                      <div className="text-xs text-gray-600">Hackathons</div>
                    </div>
                    <div className="bg-blue-50 rounded p-2">
                      <div className="text-lg font-bold text-blue-600">
                        {user.nonprofitAffiliations.length}
                      </div>
                      <div className="text-xs text-gray-600">Nonprofits</div>
                    </div>
                  </div>
                  
                  {/* Looking For */}
                  <div className="flex flex-wrap gap-2">
                    {user.lookingForCofounder && (
                      <Badge className="bg-orange-100 text-orange-700">
                        <Users className="h-3 w-3 mr-1" />
                        Seeking Co-founder
                      </Badge>
                    )}
                    {user.lookingForTeam && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Lightbulb className="h-3 w-3 mr-1" />
                        Joining Teams
                      </Badge>
                    )}
                    {user.lookingForMentor && (
                      <Badge className="bg-green-100 text-green-700">
                        <Brain className="h-3 w-3 mr-1" />
                        Seeking Mentor
                      </Badge>
                    )}
                    {user.lookingForMentee && (
                      <Badge className="bg-purple-100 text-purple-700">
                        <Star className="h-3 w-3 mr-1" />
                        Mentoring Others
                      </Badge>
                    )}
                  </div>
                  
                  {/* Profile Completeness */}
                  <div className="bg-gray-50 rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Profile Completeness</span>
                      <span className="text-xs font-medium">{user.profileCompleteness}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                        style={{ width: `${user.profileCompleteness}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <ThumbsUpWithPurposeHub
                      item={{
                        id: user.id,
                        name: user.username,
                        description: user.bio,
                        category: `${user.currentRole} • ${user.industry}`
                      }}
                      sourceType="hypercrowd"
                      size="sm"
                      variant="outline"
                    />
                    <Button size="sm" className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {users.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No professionals found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or clearing filters</p>
            <Button onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HyperCrowdPage;