import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Heart, Database, Users, Bot, Building, Info, Settings } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import SBTPrivacyControls from '@/components/sbt/SBTPrivacyControls';
import { FileUpload } from '@/components/ui/file-upload';

export default function ZKPCredentials() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCredentialForPrivacy, setSelectedCredentialForPrivacy] = useState(null);
  const [sbtFormData, setSbtFormData] = useState({
    type: '',
    title: '',
    description: '',
    evidence: '',
    evidenceFiles: [] as File[]
  });
  const [cbtFormData, setCbtFormData] = useState({
    name: '',
    type: 'non-profit',
    taxId: '',
    website: '',
    description: '',
    mission: '',
    email: ''
  });
  const [dbtFormData, setDbtFormData] = useState({
    entityName: '',
    entityType: 'ai_agent',
    description: '',
    website: '',
    capabilities: '',
    walletAddress: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for user authentication status
  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  // Check if user meets SBT creation requirements
  const canCreateSBT = user?.twoFactorEnabled && user?.walletAddress;
  const missingRequirements = [];
  if (!user?.twoFactorEnabled) missingRequirements.push('2FA authentication');
  if (!user?.walletAddress) missingRequirements.push('wallet connection');

  // SBT Registration Mutation
  const sbtRequestMutation = useMutation({
    mutationFn: async (formData: typeof sbtFormData) => {
      if (!canCreateSBT) {
        throw new Error('Please enable 2FA and connect a wallet before creating SBT credentials');
      }

      const requestData = new FormData();
      requestData.append('type', formData.type);
      requestData.append('title', formData.title);
      requestData.append('description', formData.description);
      requestData.append('evidence', formData.evidence);
      
      formData.evidenceFiles.forEach((file, index) => {
        requestData.append(`evidenceFiles`, file);
      });

      const response = await fetch('/api/credentials/sbt/register', {
        method: 'POST',
        body: requestData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to submit SBT request');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SBT Request Submitted",
        description: "Your Soulbound Token request has been submitted for verification."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/sbt'] });
      setSbtFormData({ type: '', title: '', description: '', evidence: '', evidenceFiles: [] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // CBT Registration Mutation
  const cbtRegisterMutation = useMutation({
    mutationFn: async (formData: typeof cbtFormData) => {
      return apiRequest('/api/credentials/cbt/register', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "CBT Registration Submitted",
        description: "Your nonprofit organization has been submitted for transparency verification."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/cbt'] });
      setCbtFormData({ name: '', type: 'non-profit', taxId: '', website: '', description: '', mission: '', email: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // DBT Registration Mutation
  const dbtRegisterMutation = useMutation({
    mutationFn: async (formData: typeof dbtFormData) => {
      return apiRequest('/api/credentials/dbt/register', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "DBT Registration Complete",
        description: "Your AI agent/digital entity has been registered for performance tracking."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/dbt'] });
      setDbtFormData({ entityName: '', entityType: 'ai_agent', description: '', website: '', capabilities: '', walletAddress: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Query existing credentials
  const { data: sbtCredentials } = useQuery({
    queryKey: ['/api/credentials/sbt'],
    enabled: !!user
  });

  const { data: cbtCredentials } = useQuery({
    queryKey: ['/api/credentials/cbt'],
    enabled: !!user
  });

  const { data: dbtCredentials } = useQuery({
    queryKey: ['/api/credentials/dbt'],
    enabled: !!user
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Main content with mobile-optimized tabs */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            ZKP Identity Credentials
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Secure, private, and verifiable digital identity management
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="sbt" className="text-xs sm:text-sm">SBT</TabsTrigger>
            <TabsTrigger value="cbt" className="text-xs sm:text-sm">CBT</TabsTrigger>
            <TabsTrigger value="dbt" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">AI/Digital</span>
              <span className="sm:hidden">DBT</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 sm:gap-6">
              {/* SBT Overview Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">SBT - Human Identity</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Soulbound NFT for verified human credentials
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={canCreateSBT ? "default" : "secondary"} className="text-xs">
                      {canCreateSBT ? "Ready" : "Setup Required"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="text-xs sm:text-sm text-gray-600">
                      {sbtCredentials?.length || 0} credentials • Privacy-first verification
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('sbt')}
                      className="w-full sm:w-auto"
                    >
                      {canCreateSBT ? "Manage" : "Setup"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* CBT Overview Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Heart className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">CBT - Nonprofit ID</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Charity transparency and impact verification
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {cbtCredentials?.length || 0} orgs
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="text-xs sm:text-sm text-gray-600">
                      Decentralized charity navigator • Impact tracking
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setActiveTab('cbt')}
                      className="w-full sm:w-auto"
                    >
                      Register Org
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* DBT Overview Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Bot className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">DBT - AI/Digital IDs</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Digital entity performance tracking
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {dbtCredentials?.length || 0} entities
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="text-xs sm:text-sm text-gray-600">
                      AI agents • Bots • Digital services performance
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setActiveTab('dbt')}
                      className="w-full sm:w-auto"
                    >
                      Register Entity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Your ZKP Identity Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {(sbtCredentials?.length || 0) + (cbtCredentials?.length || 0) + (dbtCredentials?.length || 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Credentials</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {user?.reputationScore || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Reputation Score</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      {canCreateSBT ? "✓" : "✗"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Security Status</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sbt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Soulbound Token Credentials (SBT)
                </CardTitle>
                <CardDescription>
                  Verify your human identity with privacy-preserving ZKP credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing SBT Credentials */}
                {sbtCredentials && sbtCredentials.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Your Verified Credentials</h3>
                    <div className="grid gap-4">
                      {sbtCredentials.map((credential: any) => (
                        <Card key={credential.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={credential.status === 'verified' ? 'default' : 'secondary'}>
                                {credential.status}
                              </Badge>
                              <span className="font-medium">{credential.title}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCredentialForPrivacy(credential)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{credential.description}</p>
                          
                          {/* Privacy and Data Sovereignty Controls */}
                          {selectedCredentialForPrivacy?.id === credential.id && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <SBTPrivacyControls
                                credential={credential}
                                onUpdate={(updatedCredential) => {
                                  toast({
                                    title: "Privacy Settings Updated",
                                    description: "Your data sovereignty preferences have been saved."
                                  });
                                  queryClient.invalidateQueries({ queryKey: ['/api/credentials/sbt'] });
                                  setSelectedCredentialForPrivacy(null);
                                }}
                                onClose={() => setSelectedCredentialForPrivacy(null)}
                              />
                            </div>
                          )}
                          
                          {/* Data Growth and Selective Disclosure Summary */}
                          <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                            <div className="font-medium text-blue-900 mb-1">Data Sovereignty Status</div>
                            <div className="text-blue-700">
                              • Privacy Level: {credential.privacyLevel || 'Standard'}
                              • Selective Disclosure: {credential.selectiveDisclosure ? 'Enabled' : 'Disabled'}
                              • Zero-Knowledge Proofs: Active
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Authentication Requirements Check */}
                {!canCreateSBT && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-900 mb-2">Security Requirements</h4>
                          <p className="text-sm text-orange-800 mb-3">
                            To create Soulbound Token credentials, you need:
                          </p>
                          <ul className="text-sm text-orange-800 space-y-1">
                            {missingRequirements.map((req, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                                {req}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 flex gap-2">
                            <Link href="/security">
                              <Button size="sm" variant="outline">
                                Complete Setup
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SBT Request Form */}
                {canCreateSBT && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Request New SBT Credential</h3>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <Shield className="h-4 w-4 mr-2" />
                          Create New SBT Credential
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Create Soulbound Token Credential</DialogTitle>
                          <DialogDescription>
                            Submit verifiable credentials for your human identity
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="sbt-type">Credential Type</Label>
                            <Select 
                              value={sbtFormData.type}
                              onValueChange={(value) => setSbtFormData(prev => ({ ...prev, type: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select credential type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="education">Educational Achievement</SelectItem>
                                <SelectItem value="professional">Professional Certification</SelectItem>
                                <SelectItem value="skill">Skill Verification</SelectItem>
                                <SelectItem value="identity">Identity Document</SelectItem>
                                <SelectItem value="achievement">Personal Achievement</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="sbt-title">Credential Title</Label>
                            <Input
                              id="sbt-title"
                              value={sbtFormData.title}
                              onChange={(e) => setSbtFormData(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="e.g., Bachelor's Degree in Computer Science"
                            />
                          </div>
                          <div>
                            <Label htmlFor="sbt-description">Description</Label>
                            <Textarea
                              id="sbt-description"
                              value={sbtFormData.description}
                              onChange={(e) => setSbtFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Detailed description of the credential..."
                              className="min-h-20"
                            />
                          </div>
                          <div>
                            <Label htmlFor="sbt-evidence">Evidence/Documentation</Label>
                            <Textarea
                              id="sbt-evidence"
                              value={sbtFormData.evidence}
                              onChange={(e) => setSbtFormData(prev => ({ ...prev, evidence: e.target.value }))}
                              placeholder="Provide details about supporting documentation..."
                              className="min-h-16"
                            />
                          </div>
                          <div>
                            <Label>Supporting Files</Label>
                            <FileUpload
                              onFilesSelected={(files) => setSbtFormData(prev => ({ ...prev, evidenceFiles: files }))}
                              maxFiles={5}
                              maxFileSize={10 * 1024 * 1024} // 10MB
                              acceptedFileTypes={["image/*", ".pdf", ".doc", ".docx"]}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Upload images of certificates, transcripts, diplomas, or other supporting documentation. 
                              Maximum 5 files, 10MB each.
                            </p>
                          </div>
                          <Button 
                            onClick={() => sbtRequestMutation.mutate(sbtFormData)}
                            disabled={sbtRequestMutation.isPending || !sbtFormData.type || !sbtFormData.title}
                            className="w-full"
                          >
                            {sbtRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cbt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-green-600" />
                  Nonprofit Transparency Credentials (CBT)
                </CardTitle>
                <CardDescription>
                  Charity Bound NFT credentials for nonprofit accountability and impact verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing CBT Credentials */}
                {cbtCredentials && cbtCredentials.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Registered Organizations</h3>
                    <div className="grid gap-4">
                      {cbtCredentials.map((credential: any) => (
                        <Card key={credential.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={credential.verified ? 'default' : 'secondary'}>
                                {credential.verified ? 'Verified' : 'Pending'}
                              </Badge>
                              <span className="font-medium">{credential.name}</span>
                            </div>
                            <Badge variant="outline">{credential.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{credential.description}</p>
                          
                          {credential.verified && (
                            <div className="grid grid-cols-3 gap-2 text-xs text-center mt-3">
                              <div>Transparency: {credential.transparency_rating}/100</div>
                              <div>Impact: {credential.impact_rating}/100</div>
                              <div>Efficiency: {credential.financial_efficiency_rating}/100</div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* CBT Registration Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Register Nonprofit Organization</h3>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Heart className="h-4 w-4 mr-2" />
                        Register New Organization
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Register Nonprofit Organization</DialogTitle>
                        <DialogDescription>
                          Submit your organization for transparency verification
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cbt-name">Organization Name</Label>
                          <Input
                            id="cbt-name"
                            value={cbtFormData.name}
                            onChange={(e) => setCbtFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Your organization's legal name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cbt-type">Organization Type</Label>
                          <Select 
                            value={cbtFormData.type}
                            onValueChange={(value) => setCbtFormData(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="non-profit">501(c)(3) Non-Profit</SelectItem>
                              <SelectItem value="charity">Charitable Organization</SelectItem>
                              <SelectItem value="foundation">Foundation</SelectItem>
                              <SelectItem value="social-enterprise">Social Enterprise</SelectItem>
                              <SelectItem value="ngo">NGO</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="cbt-taxid">Tax ID / EIN</Label>
                          <Input
                            id="cbt-taxid"
                            value={cbtFormData.taxId}
                            onChange={(e) => setCbtFormData(prev => ({ ...prev, taxId: e.target.value }))}
                            placeholder="Tax identification number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cbt-website">Website</Label>
                          <Input
                            id="cbt-website"
                            value={cbtFormData.website}
                            onChange={(e) => setCbtFormData(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://yourorganization.org"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cbt-mission">Mission Statement</Label>
                          <Textarea
                            id="cbt-mission"
                            value={cbtFormData.mission}
                            onChange={(e) => setCbtFormData(prev => ({ ...prev, mission: e.target.value }))}
                            placeholder="Your organization's mission and goals..."
                            className="min-h-20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cbt-description">Description</Label>
                          <Textarea
                            id="cbt-description"
                            value={cbtFormData.description}
                            onChange={(e) => setCbtFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Detailed description of your organization's work..."
                            className="min-h-20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cbt-email">Contact Email</Label>
                          <Input
                            id="cbt-email"
                            type="email"
                            value={cbtFormData.email}
                            onChange={(e) => setCbtFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="contact@yourorganization.org"
                          />
                        </div>
                        <Button 
                          onClick={() => cbtRegisterMutation.mutate(cbtFormData)}
                          disabled={cbtRegisterMutation.isPending || !cbtFormData.name || !cbtFormData.taxId}
                          className="w-full"
                        >
                          {cbtRegisterMutation.isPending ? 'Registering...' : 'Register Organization'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dbt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  Digital Entity Credentials (DBT)
                </CardTitle>
                <CardDescription>
                  Digital Bound NFT credentials for AI agents, bots, and digital services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing DBT Credentials */}
                {dbtCredentials && dbtCredentials.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Registered Digital Entities</h3>
                    <div className="grid gap-4">
                      {dbtCredentials.map((credential: any) => (
                        <Card key={credential.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={credential.active ? 'default' : 'secondary'}>
                                {credential.active ? 'Active' : 'Inactive'}
                              </Badge>
                              <span className="font-medium">{credential.entityName}</span>
                            </div>
                            <Badge variant="outline">{credential.entityType}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{credential.description}</p>
                          
                          {credential.active && (
                            <div className="grid grid-cols-3 gap-2 text-xs text-center mt-3">
                              <div>Performance: {credential.performance_rating}/100</div>
                              <div>Reliability: {credential.reliability_rating}/100</div>
                              <div>Security: {credential.security_rating}/100</div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* No credentials message */}
                {(!dbtCredentials || dbtCredentials.length === 0) && (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No AI/digital credentials found</p>
                  </div>
                )}

                {/* DBT Registration Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Register Digital Entity</h3>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Bot className="h-4 w-4 mr-2" />
                        Register AI/Digital Entity
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Register AI/Digital Entity</DialogTitle>
                        <DialogDescription>
                          Track performance and reliability of your AI agents or digital services with built-in anti-gaming protections
                        </DialogDescription>
                      </DialogHeader>
                      
                      {/* Anti-Gaming Security Information */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Security & Anti-Gaming Measures
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Unique wallet address required for each AI agent</li>
                          <li>• Activity pattern analysis prevents coordinated gaming</li>
                          <li>• Human oversight verification for high-value activities</li>
                          <li>• External validation required for grant applications</li>
                          <li>• Reputation quarantine for suspicious behavior</li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="dbt-name">Entity Name</Label>
                          <Input
                            id="dbt-name"
                            value={dbtFormData.entityName}
                            onChange={(e) => setDbtFormData(prev => ({ ...prev, entityName: e.target.value }))}
                            placeholder="Your AI agent or service name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dbt-type">Entity Type</Label>
                          <Select 
                            value={dbtFormData.entityType}
                            onValueChange={(value) => setDbtFormData(prev => ({ ...prev, entityType: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select entity type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ai_agent">AI Agent</SelectItem>
                              <SelectItem value="chatbot">Chatbot</SelectItem>
                              <SelectItem value="api_service">API Service</SelectItem>
                              <SelectItem value="automation_bot">Automation Bot</SelectItem>
                              <SelectItem value="ai_model">AI Model</SelectItem>
                              <SelectItem value="digital_assistant">Digital Assistant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="dbt-website">Website/Documentation</Label>
                          <Input
                            id="dbt-website"
                            value={dbtFormData.website}
                            onChange={(e) => setDbtFormData(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://docs.yourai.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dbt-description">Description</Label>
                          <Textarea
                            id="dbt-description"
                            value={dbtFormData.description}
                            onChange={(e) => setDbtFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Detailed description of your AI agent or digital service..."
                            className="min-h-20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dbt-capabilities">Capabilities</Label>
                          <Input
                            id="dbt-capabilities"
                            value={dbtFormData.capabilities}
                            onChange={(e) => setDbtFormData(prev => ({ ...prev, capabilities: e.target.value }))}
                            placeholder="natural language processing, data analysis, automation"
                          />
                          <p className="text-xs text-gray-500 mt-1">Comma-separated list of capabilities</p>
                        </div>
                        <div>
                          <Label htmlFor="dbt-wallet">Wallet Address</Label>
                          <Input
                            id="dbt-wallet"
                            value={dbtFormData.walletAddress || ''}
                            onChange={(e) => setDbtFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                            placeholder="0x..."
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Required: Unique wallet address for your AI agent</p>
                        </div>
                        <Button 
                          onClick={() => dbtRegisterMutation.mutate(dbtFormData)}
                          disabled={dbtRegisterMutation.isPending || !dbtFormData.entityName || !dbtFormData.description}
                          className="w-full"
                        >
                          {dbtRegisterMutation.isPending ? 'Registering...' : 'Register Entity'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}