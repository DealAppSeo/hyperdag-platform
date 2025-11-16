import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Briefcase, 
  MapPin, 
  Trophy, 
  DollarSign, 
  Heart, 
  Users, 
  Star, 
  Shield, 
  Brain,
  Code,
  Lightbulb,
  Target,
  Globe,
  Mail,
  Phone,
  Plus,
  X,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ProfileFormData {
  // Basic Information
  username: string;
  email: string;
  currentRole: string;
  experience: string;
  industry: string;
  location: string;
  bio: string;
  
  // Skills & Expertise
  technicalSkills: string[];
  softSkills: string[];
  domainExpertise: string[];
  languages: string[];
  
  // Experience & Background
  workHistory: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  projectHistory: Array<{
    name: string;
    role: string; // founder, co-founder, core-contributor, lead-developer, etc.
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    technologies: string[];
    impact: string;
    url?: string;
  }>;
  grantExperience: Array<{
    name: string;
    amount: number;
    year: number;
    status: string;
    description?: string;
  }>;
  hackathonExperience: Array<{
    name: string;
    year: number;
    position: string;
    prize?: number;
    description?: string;
  }>;
  nonprofitAffiliations: Array<{
    name: string;
    role: string;
    years: number;
    description?: string;
  }>;
  
  // Networking & Goals
  lookingForCofounder: boolean;
  lookingForTeam: boolean;
  lookingForMentor: boolean;
  lookingForMentee: boolean;
  socialImpactAreas: string[];
  
  // Contact & Portfolio
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  discordHandle?: string;
  telegramHandle?: string;
  personalWebsite?: string;
  publicProfile: boolean;
  contactEnabled: boolean;
}

const ProfileCreationPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [newSkill, setNewSkill] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    currentRole: '',
    experience: '',
    industry: '',
    location: '',
    bio: '',
    technicalSkills: [],
    softSkills: [],
    domainExpertise: [],
    languages: [],
    workHistory: [],
    projectHistory: [],
    grantExperience: [],
    hackathonExperience: [],
    nonprofitAffiliations: [],
    lookingForCofounder: false,
    lookingForTeam: false,
    lookingForMentor: false,
    lookingForMentee: false,
    socialImpactAreas: [],
    publicProfile: true,
    contactEnabled: true
  });

  // Profile creation mutation
  const createProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileFormData) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (!response.ok) throw new Error('Failed to create profile');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Created Successfully!",
        description: `Your RepID: ${data.data.repId}. Profile is ${data.data.profileCompleteness}% complete.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Profile Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const steps = [
    { id: 'basic', title: 'Basic Info', icon: User },
    { id: 'skills', title: 'Skills & Expertise', icon: Code },
    { id: 'work', title: 'Work & Projects', icon: Briefcase },
    { id: 'experience', title: 'Grants & Events', icon: Trophy },
    { id: 'networking', title: 'Networking Goals', icon: Users },
    { id: 'portfolio', title: 'Portfolio & Contact', icon: Globe }
  ];

  const calculateCompleteness = () => {
    const fields = [
      formData.username, formData.email, formData.currentRole, formData.experience,
      formData.industry, formData.location, formData.bio,
      formData.technicalSkills.length > 0,
      formData.softSkills.length > 0,
      formData.domainExpertise.length > 0
    ];
    
    const completedFields = fields.filter(field => 
      typeof field === 'boolean' ? field : (field && field.length > 0)
    ).length;
    
    return Math.round((completedFields / fields.length) * 100);
  };

  const addSkill = (type: 'technical' | 'soft' | 'domain' | 'language') => {
    let skill = '';
    let targetArray: string[] = [];
    
    switch (type) {
      case 'technical':
        skill = newSkill;
        targetArray = formData.technicalSkills;
        break;
      case 'soft':
        skill = newSkill;
        targetArray = formData.softSkills;
        break;
      case 'domain':
        skill = newDomain;
        targetArray = formData.domainExpertise;
        break;
      case 'language':
        skill = newLanguage;
        targetArray = formData.languages;
        break;
    }
    
    if (skill.trim() && !targetArray.includes(skill.trim())) {
      const updatedArray = [...targetArray, skill.trim()];
      setFormData(prev => ({
        ...prev,
        [type === 'technical' ? 'technicalSkills' : 
         type === 'soft' ? 'softSkills' :
         type === 'domain' ? 'domainExpertise' : 'languages']: updatedArray
      }));
      
      if (type === 'domain') setNewDomain('');
      else if (type === 'language') setNewLanguage('');
      else setNewSkill('');
    }
  };

  const removeSkill = (type: 'technical' | 'soft' | 'domain' | 'language', index: number) => {
    const fieldName = 
      type === 'technical' ? 'technicalSkills' : 
      type === 'soft' ? 'softSkills' :
      type === 'domain' ? 'domainExpertise' : 'languages';
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }));
  };

  const addExperience = (type: 'work' | 'project' | 'grant' | 'hackathon' | 'nonprofit') => {
    const newEntry = type === 'work'
      ? { company: '', role: '', startDate: '', endDate: '', current: false, description: '', achievements: [] }
      : type === 'project'
      ? { name: '', role: '', startDate: '', endDate: '', current: false, description: '', technologies: [], impact: '', url: '' }
      : type === 'grant' 
      ? { name: '', amount: 0, year: new Date().getFullYear(), status: 'applied', description: '' }
      : type === 'hackathon'
      ? { name: '', year: new Date().getFullYear(), position: '', prize: 0, description: '' }
      : { name: '', role: '', years: 1, description: '' };
    
    const fieldName = type === 'work' ? 'workHistory' : type === 'project' ? 'projectHistory' : `${type}Experience`;
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName as keyof ProfileFormData] as any[], newEntry]
    }));
  };

  const removeExperience = (type: 'work' | 'project' | 'grant' | 'hackathon' | 'nonprofit', index: number) => {
    const fieldName = type === 'work' ? 'workHistory' : type === 'project' ? 'projectHistory' : `${type}Experience`;
    setFormData(prev => ({
      ...prev,
      [fieldName]: (prev[fieldName as keyof ProfileFormData] as any[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    createProfileMutation.mutate(formData);
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="your_professional_name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="your@email.com"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentRole">Current Role</Label>
          <Input
            id="currentRole"
            value={formData.currentRole}
            onChange={(e) => setFormData(prev => ({ ...prev, currentRole: e.target.value }))}
            placeholder="e.g., AI Research Scientist"
          />
        </div>
        <div>
          <Label htmlFor="experience">Experience Level</Label>
          <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Entry Level (0-2 years)">Entry Level (0-2 years)</SelectItem>
              <SelectItem value="Mid Level (3-5 years)">Mid Level (3-5 years)</SelectItem>
              <SelectItem value="Senior Level (5-8 years)">Senior Level (5-8 years)</SelectItem>
              <SelectItem value="Expert Level (8+ years)">Expert Level (8+ years)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Healthcare Technology">Healthcare Technology</SelectItem>
              <SelectItem value="Financial Technology">Financial Technology</SelectItem>
              <SelectItem value="Education Technology">Education Technology</SelectItem>
              <SelectItem value="Social Innovation">Social Innovation</SelectItem>
              <SelectItem value="Environmental Technology">Environmental Technology</SelectItem>
              <SelectItem value="Artificial Intelligence">Artificial Intelligence</SelectItem>
              <SelectItem value="Blockchain & Web3">Blockchain & Web3</SelectItem>
              <SelectItem value="Nonprofit & NGO">Nonprofit & NGO</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="San Francisco, CA"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="bio">Professional Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Tell us about your background, interests, and what drives you in your professional work..."
          rows={4}
        />
      </div>
    </div>
  );

  const renderSkillsAndExpertise = () => (
    <div className="space-y-6">
      {/* Technical Skills */}
      <div>
        <Label>Technical Skills</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="e.g., Python, React, Machine Learning"
            onKeyPress={(e) => e.key === 'Enter' && addSkill('technical')}
          />
          <Button onClick={() => addSkill('technical')} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.technicalSkills.map((skill, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {skill}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill('technical', index)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Soft Skills */}
      <div>
        <Label>Soft Skills</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {['Leadership', 'Communication', 'Problem Solving', 'Team Management', 'Research', 'Grant Writing', 'Public Speaking', 'Mentoring', 'Project Management'].map((skill) => (
            <div key={skill} className="flex items-center space-x-2">
              <Checkbox
                id={skill}
                checked={formData.softSkills.includes(skill)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData(prev => ({ ...prev, softSkills: [...prev.softSkills, skill] }));
                  } else {
                    setFormData(prev => ({ ...prev, softSkills: prev.softSkills.filter(s => s !== skill) }));
                  }
                }}
              />
              <Label htmlFor={skill} className="text-sm">{skill}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Domain Expertise */}
      <div>
        <Label>Domain Expertise</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="e.g., AI Ethics, Blockchain Security, Healthcare AI"
            onKeyPress={(e) => e.key === 'Enter' && addSkill('domain')}
          />
          <Button onClick={() => addSkill('domain')} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.domainExpertise.map((domain, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1">
              {domain}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill('domain', index)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <Label>Languages</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            placeholder="e.g., English, Spanish, Mandarin"
            onKeyPress={(e) => e.key === 'Enter' && addSkill('language')}
          />
          <Button onClick={() => addSkill('language')} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.languages.map((language, index) => (
            <Badge key={index} variant="default" className="flex items-center gap-1">
              {language}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill('language', index)} />
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWorkAndProjects = () => (
    <Tabs defaultValue="work" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="work">Work History</TabsTrigger>
        <TabsTrigger value="projects">Projects</TabsTrigger>
      </TabsList>
      
      <TabsContent value="work" className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Professional Work Experience</Label>
          <Button onClick={() => addExperience('work')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </div>
        {formData.workHistory.map((work, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  placeholder="Company name"
                  value={work.company}
                  onChange={(e) => {
                    const updated = [...formData.workHistory];
                    updated[index].company = e.target.value;
                    setFormData(prev => ({ ...prev, workHistory: updated }));
                  }}
                />
                <Input
                  placeholder="Role/Position"
                  value={work.role}
                  onChange={(e) => {
                    const updated = [...formData.workHistory];
                    updated[index].role = e.target.value;
                    setFormData(prev => ({ ...prev, workHistory: updated }));
                  }}
                />
                <Input
                  type="month"
                  placeholder="Start date"
                  value={work.startDate}
                  onChange={(e) => {
                    const updated = [...formData.workHistory];
                    updated[index].startDate = e.target.value;
                    setFormData(prev => ({ ...prev, workHistory: updated }));
                  }}
                />
                <div className="flex gap-2">
                  <Input
                    type="month"
                    placeholder="End date"
                    value={work.endDate}
                    disabled={work.current}
                    onChange={(e) => {
                      const updated = [...formData.workHistory];
                      updated[index].endDate = e.target.value;
                      setFormData(prev => ({ ...prev, workHistory: updated }));
                    }}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`current-${index}`}
                      checked={work.current}
                      onCheckedChange={(checked) => {
                        const updated = [...formData.workHistory];
                        updated[index].current = !!checked;
                        if (checked) updated[index].endDate = '';
                        setFormData(prev => ({ ...prev, workHistory: updated }));
                      }}
                    />
                    <Label htmlFor={`current-${index}`} className="text-sm">Current</Label>
                  </div>
                </div>
              </div>
              <Textarea
                placeholder="Describe your role, responsibilities, and key achievements..."
                value={work.description}
                onChange={(e) => {
                  const updated = [...formData.workHistory];
                  updated[index].description = e.target.value;
                  setFormData(prev => ({ ...prev, workHistory: updated }));
                }}
                rows={3}
                className="mb-4"
              />
              <div className="flex justify-end">
                <Button onClick={() => removeExperience('work', index)} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
      
      <TabsContent value="projects" className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Projects You Founded or Contributed To</Label>
          <Button onClick={() => addExperience('project')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
        {formData.projectHistory.map((project, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  placeholder="Project name"
                  value={project.name}
                  onChange={(e) => {
                    const updated = [...formData.projectHistory];
                    updated[index].name = e.target.value;
                    setFormData(prev => ({ ...prev, projectHistory: updated }));
                  }}
                />
                <Select
                  value={project.role}
                  onValueChange={(value) => {
                    const updated = [...formData.projectHistory];
                    updated[index].role = value;
                    setFormData(prev => ({ ...prev, projectHistory: updated }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="co-founder">Co-founder</SelectItem>
                    <SelectItem value="core-contributor">Core Contributor</SelectItem>
                    <SelectItem value="lead-developer">Lead Developer</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="advisor">Advisor</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="month"
                  placeholder="Start date"
                  value={project.startDate}
                  onChange={(e) => {
                    const updated = [...formData.projectHistory];
                    updated[index].startDate = e.target.value;
                    setFormData(prev => ({ ...prev, projectHistory: updated }));
                  }}
                />
                <div className="flex gap-2">
                  <Input
                    type="month"
                    placeholder="End date"
                    value={project.endDate}
                    disabled={project.current}
                    onChange={(e) => {
                      const updated = [...formData.projectHistory];
                      updated[index].endDate = e.target.value;
                      setFormData(prev => ({ ...prev, projectHistory: updated }));
                    }}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-current-${index}`}
                      checked={project.current}
                      onCheckedChange={(checked) => {
                        const updated = [...formData.projectHistory];
                        updated[index].current = !!checked;
                        if (checked) updated[index].endDate = '';
                        setFormData(prev => ({ ...prev, projectHistory: updated }));
                      }}
                    />
                    <Label htmlFor={`project-current-${index}`} className="text-sm">Ongoing</Label>
                  </div>
                </div>
              </div>
              <Input
                placeholder="Project URL (optional)"
                value={project.url || ''}
                onChange={(e) => {
                  const updated = [...formData.projectHistory];
                  updated[index].url = e.target.value;
                  setFormData(prev => ({ ...prev, projectHistory: updated }));
                }}
                className="mb-4"
              />
              <Textarea
                placeholder="Describe the project, your contributions, and its impact..."
                value={project.description}
                onChange={(e) => {
                  const updated = [...formData.projectHistory];
                  updated[index].description = e.target.value;
                  setFormData(prev => ({ ...prev, projectHistory: updated }));
                }}
                rows={3}
                className="mb-4"
              />
              <Textarea
                placeholder="What impact did this project have? (users, funding, awards, etc.)"
                value={project.impact}
                onChange={(e) => {
                  const updated = [...formData.projectHistory];
                  updated[index].impact = e.target.value;
                  setFormData(prev => ({ ...prev, projectHistory: updated }));
                }}
                rows={2}
                className="mb-4"
              />
              <div className="flex justify-end">
                <Button onClick={() => removeExperience('project', index)} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );

  const renderGrantsAndEvents = () => (
    <Tabs defaultValue="grants" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="grants">Grants</TabsTrigger>
        <TabsTrigger value="hackathons">Hackathons</TabsTrigger>
        <TabsTrigger value="nonprofits">Nonprofits</TabsTrigger>
      </TabsList>
      
      <TabsContent value="grants" className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Grant Experience</Label>
          <Button onClick={() => addExperience('grant')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Grant
          </Button>
        </div>
        {formData.grantExperience.map((grant, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Grant name"
                  value={grant.name}
                  onChange={(e) => {
                    const updated = [...formData.grantExperience];
                    updated[index].name = e.target.value;
                    setFormData(prev => ({ ...prev, grantExperience: updated }));
                  }}
                />
                <Input
                  type="number"
                  placeholder="Amount ($)"
                  value={grant.amount}
                  onChange={(e) => {
                    const updated = [...formData.grantExperience];
                    updated[index].amount = parseInt(e.target.value);
                    setFormData(prev => ({ ...prev, grantExperience: updated }));
                  }}
                />
                <div className="flex gap-2">
                  <Select
                    value={grant.status}
                    onValueChange={(value) => {
                      const updated = [...formData.grantExperience];
                      updated[index].status = value;
                      setFormData(prev => ({ ...prev, grantExperience: updated }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awarded">Awarded</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => removeExperience('grant', index)} variant="outline" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
      
      <TabsContent value="hackathons" className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Hackathon Experience</Label>
          <Button onClick={() => addExperience('hackathon')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Hackathon
          </Button>
        </div>
        {formData.hackathonExperience.map((hackathon, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Hackathon name"
                  value={hackathon.name}
                  onChange={(e) => {
                    const updated = [...formData.hackathonExperience];
                    updated[index].name = e.target.value;
                    setFormData(prev => ({ ...prev, hackathonExperience: updated }));
                  }}
                />
                <Input
                  type="number"
                  placeholder="Year"
                  value={hackathon.year}
                  onChange={(e) => {
                    const updated = [...formData.hackathonExperience];
                    updated[index].year = parseInt(e.target.value);
                    setFormData(prev => ({ ...prev, hackathonExperience: updated }));
                  }}
                />
                <Input
                  placeholder="Position/Result"
                  value={hackathon.position}
                  onChange={(e) => {
                    const updated = [...formData.hackathonExperience];
                    updated[index].position = e.target.value;
                    setFormData(prev => ({ ...prev, hackathonExperience: updated }));
                  }}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Prize ($)"
                    value={hackathon.prize || ''}
                    onChange={(e) => {
                      const updated = [...formData.hackathonExperience];
                      updated[index].prize = parseInt(e.target.value) || 0;
                      setFormData(prev => ({ ...prev, hackathonExperience: updated }));
                    }}
                  />
                  <Button onClick={() => removeExperience('hackathon', index)} variant="outline" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
      
      <TabsContent value="nonprofits" className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Nonprofit Affiliations</Label>
          <Button onClick={() => addExperience('nonprofit')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Nonprofit
          </Button>
        </div>
        {formData.nonprofitAffiliations.map((nonprofit, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Organization name"
                  value={nonprofit.name}
                  onChange={(e) => {
                    const updated = [...formData.nonprofitAffiliations];
                    updated[index].name = e.target.value;
                    setFormData(prev => ({ ...prev, nonprofitAffiliations: updated }));
                  }}
                />
                <Input
                  placeholder="Your role"
                  value={nonprofit.role}
                  onChange={(e) => {
                    const updated = [...formData.nonprofitAffiliations];
                    updated[index].role = e.target.value;
                    setFormData(prev => ({ ...prev, nonprofitAffiliations: updated }));
                  }}
                />
                <Input
                  type="number"
                  placeholder="Years involved"
                  value={nonprofit.years}
                  onChange={(e) => {
                    const updated = [...formData.nonprofitAffiliations];
                    updated[index].years = parseInt(e.target.value);
                    setFormData(prev => ({ ...prev, nonprofitAffiliations: updated }));
                  }}
                />
                <Button onClick={() => removeExperience('nonprofit', index)} variant="outline" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );

  const renderNetworkingGoals = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">What are you looking for?</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cofounder"
              checked={formData.lookingForCofounder}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, lookingForCofounder: !!checked }))}
            />
            <Label htmlFor="cofounder" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Co-founder
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team"
              checked={formData.lookingForTeam}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, lookingForTeam: !!checked }))}
            />
            <Label htmlFor="team" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Team to Join
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mentor"
              checked={formData.lookingForMentor}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, lookingForMentor: !!checked }))}
            />
            <Label htmlFor="mentor" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Mentor
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mentee"
              checked={formData.lookingForMentee}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, lookingForMentee: !!checked }))}
            />
            <Label htmlFor="mentee" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Mentee to Guide
            </Label>
          </div>
        </div>
      </div>

      <div>
        <Label>Social Impact Areas of Interest</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {['Healthcare', 'Education', 'Environment', 'Financial Inclusion', 'Social Justice', 'Disaster Relief', 'Economic Development', 'Digital Rights', 'Mental Health'].map((area) => (
            <div key={area} className="flex items-center space-x-2">
              <Checkbox
                id={area}
                checked={formData.socialImpactAreas.includes(area)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData(prev => ({ ...prev, socialImpactAreas: [...prev.socialImpactAreas, area] }));
                  } else {
                    setFormData(prev => ({ ...prev, socialImpactAreas: prev.socialImpactAreas.filter(a => a !== area) }));
                  }
                }}
              />
              <Label htmlFor={area} className="text-sm">{area}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPortfolioAndContact = () => (
    <div className="space-y-6">
      {/* Professional Links */}
      <div>
        <Label className="text-base font-medium mb-3 block">Professional Links</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="portfolioUrl" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Portfolio Website
            </Label>
            <Input
              id="portfolioUrl"
              value={formData.portfolioUrl || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
              placeholder="https://yourportfolio.com"
            />
          </div>
          <div>
            <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              LinkedIn Profile
            </Label>
            <Input
              id="linkedinUrl"
              value={formData.linkedinUrl || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
              placeholder="https://linkedin.com/in/yourname"
            />
          </div>
          <div>
            <Label htmlFor="githubUrl" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              GitHub Profile
            </Label>
            <Input
              id="githubUrl"
              value={formData.githubUrl || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
              placeholder="https://github.com/yourusername"
            />
          </div>
          <div>
            <Label htmlFor="personalWebsite" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Personal Website
            </Label>
            <Input
              id="personalWebsite"
              value={formData.personalWebsite || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, personalWebsite: e.target.value }))}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </div>
      
      {/* Social Media */}
      <div>
        <Label className="text-base font-medium mb-3 block">Social Media (Optional)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="twitterUrl">Twitter/X Profile</Label>
            <Input
              id="twitterUrl"
              value={formData.twitterUrl || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))}
              placeholder="https://twitter.com/yourusername"
            />
          </div>
          <div>
            <Label htmlFor="discordHandle">Discord Handle</Label>
            <Input
              id="discordHandle"
              value={formData.discordHandle || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, discordHandle: e.target.value }))}
              placeholder="@yourusername#1234"
            />
          </div>
          <div>
            <Label htmlFor="telegramHandle">Telegram Handle</Label>
            <Input
              id="telegramHandle"
              value={formData.telegramHandle || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, telegramHandle: e.target.value }))}
              placeholder="@yourusername"
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div>
        <Label className="text-base font-medium mb-3 block">Privacy & Contact Settings</Label>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="publicProfile"
              checked={formData.publicProfile}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, publicProfile: !!checked }))}
            />
            <Label htmlFor="publicProfile" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Make my profile public in HyperCrowd directory
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="contactEnabled"
              checked={formData.contactEnabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, contactEnabled: !!checked }))}
            />
            <Label htmlFor="contactEnabled" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Allow others to contact me directly
            </Label>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🔒 Your Privacy Matters</h4>
            <p className="text-sm text-blue-700">
              Your profile will generate a unique RepID for secure, privacy-preserving interactions. 
              Social profiles are optional and only shared if you choose to make your profile public.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Professional Profile
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Build a comprehensive profile to unlock AI-powered opportunities and connect with like-minded professionals
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm text-gray-600">{calculateCompleteness()}%</span>
            </div>
            <Progress value={calculateCompleteness()} className="w-full" />
          </CardContent>
        </Card>

        {/* Step Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-600' : 
                    isCompleted ? 'bg-green-100 text-green-600' : 
                    'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 0 && "Tell us about your professional background"}
              {currentStep === 1 && "Showcase your technical expertise and soft skills"}
              {currentStep === 2 && "Share your grants, hackathons, and nonprofit experience"}
              {currentStep === 3 && "Define your networking and collaboration goals"}
              {currentStep === 4 && "Add your portfolio and contact preferences"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {currentStep === 0 && renderBasicInfo()}
            {currentStep === 1 && renderSkillsAndExpertise()}
            {currentStep === 2 && renderWorkAndProjects()}
            {currentStep === 3 && renderGrantsAndEvents()}
            {currentStep === 4 && renderNetworkingGoals()}
            {currentStep === 5 && renderPortfolioAndContact()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createProfileMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createProfileMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Profile...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Profile & Generate RepID
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCreationPage;