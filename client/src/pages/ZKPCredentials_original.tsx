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
import { Shield, Heart, Database, Users, Bot, Building, ArrowLeft, Home, Info, Settings } from 'lucide-react';
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
    capabilities: ''
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

  // Mutation for SBT verification request
  const sbtRequestMutation = useMutation({
    mutationFn: async (data: typeof sbtFormData) => {
      const formData = new FormData();
      
      // Add text fields
      formData.append('type', data.type);
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('evidence', data.evidence);
      
      // Add evidence files
      data.evidenceFiles.forEach((file, index) => {
        formData.append(`evidenceFiles`, file);
      });
      
      const response = await fetch('/api/credentials/sbt/register', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Failed to submit verification request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification Request Submitted",
        description: "Your credential verification request has been submitted for review."
      });
      setSbtFormData({ type: '', title: '', description: '', evidence: '', evidenceFiles: [] });
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/sbt'] });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit verification request",
        variant: "destructive"
      });
    }
  });

  // Mutation for nonprofit registration
  const cbtRegisterMutation = useMutation({
    mutationFn: async (data: typeof cbtFormData) => {
      return apiRequest('/api/credentials/cbt/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Organization Registered",
        description: "Your nonprofit has been registered and is pending verification."
      });
      setCbtFormData({
        name: '', type: 'non-profit', taxId: '', website: '', 
        description: '', mission: '', email: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/cbt'] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register nonprofit",
        variant: "destructive"
      });
    }
  });

  // Mutation for AI/digital entity registration
  const dbtRegisterMutation = useMutation({
    mutationFn: async (data: typeof dbtFormData) => {
      return apiRequest('/api/credentials/dbt/register', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          capabilities: data.capabilities.split(',').map(c => c.trim())
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Digital Entity Registered",
        description: "Your AI agent/digital entity has been registered for performance tracking."
      });
      setDbtFormData({
        entityName: '', entityType: 'ai_agent', description: '',
        website: '', capabilities: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/dbt'] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register digital entity",
        variant: "destructive"
      });
    }
  });

  // Query for SBT credentials (for humans)
  const { data: sbtCredentials, isLoading: sbtLoading } = useQuery({
    queryKey: ['/api/credentials/sbt'],
    enabled: activeTab === 'sbt'
  });

  // Query for CBT credentials (for nonprofits)
  const { data: cbtCredentials, isLoading: cbtLoading } = useQuery({
    queryKey: ['/api/credentials/cbt'],
    enabled: activeTab === 'cbt'
  });

  // Query for DBT credentials (for AI/digital entities)
  const { data: dbtCredentials, isLoading: dbtLoading } = useQuery({
    queryKey: ['/api/credentials/dbt'],
    enabled: activeTab === 'dbt'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-4">
      {/* Mobile-first header with minimal navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/my-dashboard">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">ZKP NFT IDs</h1>
        <div className="w-20"> {/* Spacer for balance */}</div>
      </div>

      {/* Main content with mobile-optimized tabs */}
      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              <Info className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sbt" className="text-xs sm:text-sm">
              <Shield className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Human</span>
            </TabsTrigger>
            <TabsTrigger value="cbt" className="text-xs sm:text-sm">
              <Heart className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Nonprofit</span>
            </TabsTrigger>
            <TabsTrigger value="dbt" className="text-xs sm:text-sm">
              <Database className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">AI/Digital</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Zero-Knowledge Proof NFT Identity System</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Secure, privacy-first digital identity credentials using blockchain technology
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <p className="text-gray-600 text-sm sm:text-base">
                  Our ZKP NFT ID system provides three distinct types of non-fungible identity credentials 
                  that prove authenticity while preserving privacy through zero-knowledge proofs.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        <CardTitle className="text-base sm:text-lg">SBT - Human IDs</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-3">
                        Soulbound NFT credentials for verified human identity and achievements
                      </p>
                      <ul className="text-xs space-y-1 text-gray-600">
                        <li>• Educational degrees & certifications</li>
                        <li>• Professional qualifications</li>
                        <li>• Identity verification (KYC)</li>
                        <li>• Skill assessments</li>
                      </ul>
                      <Button 
                        onClick={() => setActiveTab('sbt')} 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3 text-purple-600 border-purple-200"
                      >
                        View Human Credentials
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-base sm:text-lg">CBT - Nonprofit IDs</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-3">
                        Charity Bound NFT credentials for transparent nonprofit accountability
                      </p>
                      <ul className="text-xs space-y-1 text-gray-600">
                        <li>• Financial transparency ratings</li>
                        <li>• Impact measurement verification</li>
                        <li>• Governance compliance</li>
                        <li>• Audit certifications</li>
                      </ul>
                      <Button 
                        onClick={() => setActiveTab('cbt')} 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3 text-green-600 border-green-200"
                      >
                        View Nonprofit Credentials
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-base sm:text-lg">DBT - AI/Digital IDs</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-3">
                        Digital Bound NFT credentials for AI agents and automated systems
                      </p>
                      <ul className="text-xs space-y-1 text-gray-600">
                        <li>• AI model performance metrics</li>
                        <li>• System reliability verification</li>
                        <li>• Security audit compliance</li>
                        <li>• Energy efficiency ratings</li>
                      </ul>
                      <Button 
                        onClick={() => setActiveTab('dbt')} 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3 text-blue-600 border-blue-200"
                      >
                        View AI/Digital Credentials
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Complete Data Sovereignty</h3>
                  <div className="space-y-3 text-xs sm:text-sm text-gray-700">
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <strong className="text-blue-800">Immutable Growth:</strong> As you add information to your SBT, all data remains permanently yours and cannot be altered by others. Your credential grows with your achievements while preserving authenticity.
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-green-500">
                      <strong className="text-green-800">Selective Disclosure:</strong> You control exactly which portions of your SBT to share with whom. Choose specific data fields for verification, monetization, or public viewing while keeping sensitive information private.
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                      <strong className="text-purple-800">Anonymization & Monetization:</strong> Depersonalize your data before monetizing it. Earn revenue from your anonymized information while maintaining complete privacy about your identity.
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                      <strong className="text-orange-800">Zero-Knowledge Verification:</strong> Prove credentials without revealing the underlying data. Others can verify your qualifications without seeing personal details.
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Your Data, Your Rules</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-blue-800">
                    <div>
                      <strong>✓ You Own It:</strong> All data belongs to you permanently, stored with cryptographic proof of ownership
                    </div>
                    <div>
                      <strong>✓ You Control It:</strong> Granular permissions for every piece of information in your credential
                    </div>
                    <div>
                      <strong>✓ You Monetize It:</strong> Set your own prices and revenue sharing when you choose to anonymize and sell data
                    </div>
                    <div>
                      <strong>✓ You Protect It:</strong> Advanced anonymization techniques (K-anonymity, L-diversity, T-closeness) keep you safe
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sbt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Human Identity Credentials (SBT)
                </CardTitle>
                <CardDescription>
                  Soulbound NFT credentials for verified human achievements and identity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sbtLoading ? (
                  <div className="text-center py-8">Loading credentials...</div>
                ) : sbtCredentials?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sbtCredentials.map((credential: any) => (
                      <Card key={credential.id} className="border-purple-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-purple-600 border-purple-200">
                              {credential.type}
                            </Badge>
                            <Badge variant={credential.is_revoked ? "destructive" : "default"}>
                              {credential.is_revoked ? "Revoked" : "Active"}
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{credential.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-600 mb-2">{credential.description}</p>
                          <p className="text-xs text-gray-500">Issued by: {credential.issuer}</p>
                          <p className="text-xs text-gray-500">
                            Expires: {credential.expires_at ? new Date(credential.expires_at).toLocaleDateString() : 'Never'}
                          </p>
                          
                          {/* Privacy and Data Sovereignty Controls */}
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-700">Data Controls</span>
                              <div className="flex gap-1">
                                {credential.privacySettings?.allowPublicView && (
                                  <Badge variant="outline" className="text-xs">Public</Badge>
                                )}
                                {credential.isMonetizable && (
                                  <Badge variant="outline" className="text-xs text-green-600">Monetizable</Badge>
                                )}
                                {credential.anonymizationSettings?.isAnonymized && (
                                  <Badge variant="outline" className="text-xs text-blue-600">Anonymous</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                                    <Settings className="h-3 w-3 mr-1" />
                                    Privacy
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Data Privacy & Control Settings</DialogTitle>
                                    <DialogDescription>
                                      Manage how your SBT data is shared, monetized, and anonymized
                                    </DialogDescription>
                                  </DialogHeader>
                                  <SBTPrivacyControls
                                    credential={credential}
                                    onUpdate={(updated) => {
                                      // Refresh the credentials list
                                      queryClient.invalidateQueries({ queryKey: ['/api/credentials/sbt'] });
                                    }}
                                  />
                                </DialogContent>
                              </Dialog>
                              
                              <Button variant="outline" size="sm" className="text-xs">
                                Share
                              </Button>
                            </div>
                            
                            {/* Data Growth and Selective Disclosure Summary */}
                            <div className="mt-2 text-xs text-gray-500">
                              <div className="flex justify-between">
                                <span>Fields: {Object.keys(credential.fieldPermissions || {}).length}</span>
                                <span>Revenue: ${credential.accessCount || 0 * parseFloat(credential.pricePerAccess || '0')}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No human credentials found</p>
                    
                    {/* Authentication Requirements Check */}
                    {!canCreateSBT ? (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h3 className="font-semibold text-amber-800 mb-2">Complete Setup Required</h3>
                        <p className="text-sm text-amber-700 mb-3">
                          To ensure credential security and integrity, please complete:
                        </p>
                        <div className="space-y-2 text-sm">
                          {!user?.twoFactorEnabled && (
                            <div className="flex items-center gap-2 text-amber-700">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span>Enable 2FA Authentication</span>
                            </div>
                          )}
                          {!user?.walletAddress && (
                            <div className="flex items-center gap-2 text-amber-700">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span>Connect Web3 Wallet</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 space-x-2">
                          {!user?.twoFactorEnabled && (
                            <Link href="/settings">
                              <Button size="sm" variant="outline">
                                Setup 2FA
                              </Button>
                            </Link>
                          )}
                          {!user?.walletAddress && (
                            <Link href="/profile">
                              <Button size="sm" variant="outline">
                                Connect Wallet
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="mt-4" variant="outline">
                            Request Verification
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Request SBT Verification</DialogTitle>
                          <DialogDescription>
                            Submit a request for human identity credential verification
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="sbt-type">Credential Type</Label>
                            <Select value={sbtFormData.type} onValueChange={(value) => 
                              setSbtFormData(prev => ({ ...prev, type: value }))
                            }>
                              <SelectTrigger>
                                <SelectValue placeholder="Select credential type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="identity">Identity Verification</SelectItem>
                                <SelectItem value="skill">Skill Assessment</SelectItem>
                                <SelectItem value="achievement">Achievement</SelectItem>
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
                              placeholder="Provide details about your credential"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="sbt-evidence">Evidence/Documentation</Label>
                            <Textarea
                              id="sbt-evidence"
                              value={sbtFormData.evidence}
                              onChange={(e) => setSbtFormData(prev => ({ ...prev, evidence: e.target.value }))}
                              placeholder="Links to certificates, documents, or other proof"
                              rows={2}
                            />
                          </div>
                          
                          <div>
                            <Label>Upload Supporting Documents</Label>
                            <FileUpload
                              onFilesChange={(files) => setSbtFormData(prev => ({ ...prev, evidenceFiles: files }))}
                              acceptedTypes={['image/*', '.pdf', '.doc', '.docx', '.txt']}
                              maxFiles={5}
                              maxSize={10}
                              className="mt-2"
                            />
                            <p className="text-xs text-gray-500 mt-2">
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
              <CardContent>
                {cbtLoading ? (
                  <div className="text-center py-8">Loading credentials...</div>
                ) : cbtCredentials?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cbtCredentials.map((credential: any) => (
                      <Card key={credential.id} className="border-green-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              {credential.entity_type}
                            </Badge>
                            <Badge variant={credential.overall_rating >= 90 ? "default" : "secondary"}>
                              {credential.overall_rating}/100
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{credential.entity_name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-600 mb-2">{credential.entity_description}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Transparency: {credential.transparency_rating}/100</div>
                            <div>Impact: {credential.impact_rating}/100</div>
                            <div>Efficiency: {credential.financial_efficiency_rating}/100</div>
                            <div>Served: {credential.beneficiaries_served?.toLocaleString()}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No nonprofit credentials found</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="mt-4" variant="outline">
                          Register Nonprofit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Register Nonprofit Organization</DialogTitle>
                          <DialogDescription>
                            Register your nonprofit for transparency credentials and accountability tracking
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="cbt-name">Organization Name</Label>
                            <Input
                              id="cbt-name"
                              value={cbtFormData.name}
                              onChange={(e) => setCbtFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter organization name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cbt-type">Organization Type</Label>
                            <Select value={cbtFormData.type} onValueChange={(value) => 
                              setCbtFormData(prev => ({ ...prev, type: value }))
                            }>
                              <SelectTrigger>
                                <SelectValue placeholder="Select organization type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="non-profit">501(c)(3) Nonprofit</SelectItem>
                                <SelectItem value="charity">Registered Charity</SelectItem>
                                <SelectItem value="foundation">Foundation</SelectItem>
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
                              placeholder="e.g., 12-3456789"
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
                            <Label htmlFor="cbt-email">Contact Email</Label>
                            <Input
                              id="cbt-email"
                              type="email"
                              value={cbtFormData.email}
                              onChange={(e) => setCbtFormData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="contact@yourorganization.org"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cbt-mission">Mission Statement</Label>
                            <Textarea
                              id="cbt-mission"
                              value={cbtFormData.mission}
                              onChange={(e) => setCbtFormData(prev => ({ ...prev, mission: e.target.value }))}
                              placeholder="Brief description of your organization's mission"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cbt-description">Additional Details</Label>
                            <Textarea
                              id="cbt-description"
                              value={cbtFormData.description}
                              onChange={(e) => setCbtFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Programs, impact areas, or other relevant information"
                              rows={2}
                            />
                          </div>
                          <Button 
                            onClick={() => cbtRegisterMutation.mutate(cbtFormData)}
                            disabled={cbtRegisterMutation.isPending || !cbtFormData.name || !cbtFormData.email}
                            className="w-full"
                          >
                            {cbtRegisterMutation.isPending ? 'Registering...' : 'Register Organization'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dbt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  AI & Digital Entity Credentials (DBT)
                </CardTitle>
                <CardDescription>
                  Digital Bound NFT credentials for AI agents, bots, and automated systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dbtLoading ? (
                  <div className="text-center py-8">Loading credentials...</div>
                ) : dbtCredentials?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dbtCredentials.map((credential: any) => (
                      <Card key={credential.id} className="border-blue-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              {credential.entity_type}
                            </Badge>
                            <Badge variant={credential.overall_rating >= 90 ? "default" : "secondary"}>
                              {credential.overall_rating}/100
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{credential.entity_name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-600 mb-2">{credential.entity_description}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Performance: {credential.performance_rating}/100</div>
                            <div>Reliability: {credential.reliability_rating}/100</div>
                            <div>Security: {credential.security_rating}/100</div>
                            <div>Uptime: {credential.uptime_percentage}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No AI/digital credentials found</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="mt-4" variant="outline">
                          Register AI Agent
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Register AI/Digital Entity</DialogTitle>
                          <DialogDescription>
                            Register your AI agent or digital system for performance tracking and reputation metrics
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="dbt-name">Entity Name</Label>
                            <Input
                              id="dbt-name"
                              value={dbtFormData.entityName}
                              onChange={(e) => setDbtFormData(prev => ({ ...prev, entityName: e.target.value }))}
                              placeholder="e.g., ChatBot Assistant v2.0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dbt-type">Entity Type</Label>
                            <Select value={dbtFormData.entityType} onValueChange={(value) => 
                              setDbtFormData(prev => ({ ...prev, entityType: value }))
                            }>
                              <SelectTrigger>
                                <SelectValue placeholder="Select entity type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ai_agent">AI Agent</SelectItem>
                                <SelectItem value="chatbot">Chatbot</SelectItem>
                                <SelectItem value="automation">Automation System</SelectItem>
                                <SelectItem value="smart_contract">Smart Contract</SelectItem>
                                <SelectItem value="api_service">API Service</SelectItem>
                                <SelectItem value="ml_model">ML Model</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="dbt-description">Description</Label>
                            <Textarea
                              id="dbt-description"
                              value={dbtFormData.description}
                              onChange={(e) => setDbtFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Brief description of the AI/digital entity's purpose and functionality"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="dbt-website">Website/Documentation</Label>
                            <Input
                              id="dbt-website"
                              value={dbtFormData.website}
                              onChange={(e) => setDbtFormData(prev => ({ ...prev, website: e.target.value }))}
                              placeholder="https://docs.youragent.com"
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}