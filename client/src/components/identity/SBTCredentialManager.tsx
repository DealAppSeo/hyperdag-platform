import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Upload, 
  Share, 
  Lock,
  FileText,
  Heart,
  Briefcase,
  Globe,
  CreditCard,
  Users,
  Plus,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface Credential {
  id: string;
  type: CredentialType;
  title: string;
  description: string;
  encryptedDataHash: string;
  ipfsHash: string;
  issuedAt: Date;
  expiresAt?: Date;
  issuer: string;
  isRevoked: boolean;
  isMonetizable: boolean;
  accessCount?: number;
  pricePerAccess?: number;
  maxAccesses?: number;
}

enum CredentialType {
  IDENTITY = 'identity',
  FINANCIAL = 'financial',
  HEALTH = 'health',
  DIGITAL = 'digital',
  PROFESSIONAL = 'professional',
  SOCIAL = 'social'
}

const credentialTypeConfig = {
  [CredentialType.IDENTITY]: {
    icon: Shield,
    label: 'Identity',
    color: 'bg-blue-500',
    examples: ['Driver\'s License', 'Passport', 'ID Card', 'Birth Certificate']
  },
  [CredentialType.FINANCIAL]: {
    icon: CreditCard,
    label: 'Financial',
    color: 'bg-green-500',
    examples: ['Bank Statements', 'Credit Reports', 'Crypto Wallets', 'Tax Documents']
  },
  [CredentialType.HEALTH]: {
    icon: Heart,
    label: 'Health',
    color: 'bg-red-500',
    examples: ['Medical Records', 'Vaccination Cards', 'Fitness Data', 'Genetic Reports']
  },
  [CredentialType.DIGITAL]: {
    icon: Globe,
    label: 'Digital',
    color: 'bg-purple-500',
    examples: ['Browser History', 'Social Media', 'Search Patterns', 'Digital Footprint']
  },
  [CredentialType.PROFESSIONAL]: {
    icon: Briefcase,
    label: 'Professional',
    color: 'bg-orange-500',
    examples: ['Degrees', 'Certifications', 'Work History', 'Professional References']
  },
  [CredentialType.SOCIAL]: {
    icon: Users,
    label: 'Social',
    color: 'bg-indigo-500',
    examples: ['Referrals', 'Reviews', 'Reputation Scores', 'Community Badges']
  }
};

export default function SBTCredentialManager() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [activeTab, setActiveTab] = useState<CredentialType>(CredentialType.IDENTITY);
  const [isAddingCredential, setIsAddingCredential] = useState(false);
  const [newCredential, setNewCredential] = useState({
    type: CredentialType.IDENTITY,
    title: '',
    description: '',
    file: null as File | null,
    expiresAt: '',
    isMonetizable: false,
    pricePerAccess: '',
    maxAccesses: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUserCredentials();
  }, []);

  const loadUserCredentials = async () => {
    try {
      const response = await fetch('/api/sbt/credentials');
      const data = await response.json();
      setCredentials(data.credentials || []);
    } catch (error) {
      console.error('Error loading credentials:', error);
      toast({
        title: "Error",
        description: "Failed to load credentials",
        variant: "destructive",
      });
    }
  };

  const handleAddCredential = async () => {
    if (!newCredential.title || !newCredential.file) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and file",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', newCredential.file);
      formData.append('type', newCredential.type);
      formData.append('title', newCredential.title);
      formData.append('description', newCredential.description);
      formData.append('expiresAt', newCredential.expiresAt);
      formData.append('isMonetizable', newCredential.isMonetizable.toString());
      
      if (newCredential.isMonetizable) {
        formData.append('pricePerAccess', newCredential.pricePerAccess);
        formData.append('maxAccesses', newCredential.maxAccesses);
      }

      const response = await fetch('/api/sbt/credentials/mint', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({
          title: "Credential Added",
          description: "Your credential has been securely stored and minted as an SBT",
        });
        setIsAddingCredential(false);
        setNewCredential({
          type: CredentialType.IDENTITY,
          title: '',
          description: '',
          file: null,
          expiresAt: '',
          isMonetizable: false,
          pricePerAccess: '',
          maxAccesses: ''
        });
        loadUserCredentials();
      } else {
        throw new Error('Failed to add credential');
      }
    } catch (error) {
      console.error('Error adding credential:', error);
      toast({
        title: "Error",
        description: "Failed to add credential",
        variant: "destructive",
      });
    }
  };

  const toggleMonetization = async (credentialId: string, enable: boolean) => {
    try {
      const response = await fetch(`/api/sbt/credentials/${credentialId}/monetization`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enable })
      });

      if (response.ok) {
        toast({
          title: enable ? "Monetization Enabled" : "Monetization Disabled",
          description: `Credential monetization has been ${enable ? 'enabled' : 'disabled'}`,
        });
        loadUserCredentials();
      }
    } catch (error) {
      console.error('Error toggling monetization:', error);
      toast({
        title: "Error",
        description: "Failed to update monetization settings",
        variant: "destructive",
      });
    }
  };

  const getCredentialsByType = (type: CredentialType) => {
    return credentials.filter(cred => cred.type === type && !cred.isRevoked);
  };

  const CredentialCard = ({ credential }: { credential: Credential }) => {
    const config = credentialTypeConfig[credential.type];
    const Icon = config.icon;
    const isExpired = credential.expiresAt && new Date(credential.expiresAt) < new Date();

    return (
      <Card className="w-full mb-4 touch-manipulation">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${config.color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{credential.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{credential.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {credential.isMonetizable && (
                <Badge variant="secondary">
                  <DollarSign className="h-3 w-3 mr-1" />
                  ${credential.pricePerAccess}
                </Badge>
              )}
              {isExpired && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Expired
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <span>Issued: {credential.issuedAt.toLocaleDateString()}</span>
            {credential.expiresAt && (
              <span>Expires: {credential.expiresAt.toLocaleDateString()}</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor={`monetize-${credential.id}`} className="text-sm">
                Monetize
              </Label>
              <Switch
                id={`monetize-${credential.id}`}
                checked={credential.isMonetizable}
                onCheckedChange={(checked) => toggleMonetization(credential.id, checked)}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Lock className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {credential.isMonetizable && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Access Count: {credential.accessCount || 0}/{credential.maxAccesses}</span>
                <span>Revenue: ${((credential.accessCount || 0) * (credential.pricePerAccess || 0)).toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SBT Credential Manager</h1>
          <p className="text-muted-foreground">Manage your decentralized identity credentials</p>
        </div>
        
        <Dialog open={isAddingCredential} onOpenChange={setIsAddingCredential}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Credential</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Credential</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Credential Type</Label>
                <Select value={newCredential.type} onValueChange={(value) => 
                  setNewCredential(prev => ({ ...prev, type: value as CredentialType }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CredentialType).map(type => {
                      const config = credentialTypeConfig[type];
                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center space-x-2">
                            <config.icon className="h-4 w-4" />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newCredential.title}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Driver's License"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCredential.description}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the credential"
                />
              </div>

              <div>
                <Label htmlFor="file">Upload File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setNewCredential(prev => ({ 
                    ...prev, 
                    file: e.target.files?.[0] || null 
                  }))}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>

              <div>
                <Label htmlFor="expires">Expiration Date (Optional)</Label>
                <Input
                  id="expires"
                  type="date"
                  value={newCredential.expiresAt}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="monetizable"
                  checked={newCredential.isMonetizable}
                  onCheckedChange={(checked) => setNewCredential(prev => ({ ...prev, isMonetizable: checked }))}
                />
                <Label htmlFor="monetizable">Enable Monetization</Label>
              </div>

              {newCredential.isMonetizable && (
                <div className="space-y-3 p-3 bg-muted rounded-lg">
                  <div>
                    <Label htmlFor="price">Price per Access ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newCredential.pricePerAccess}
                      onChange={(e) => setNewCredential(prev => ({ ...prev, pricePerAccess: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAccesses">Maximum Accesses</Label>
                    <Input
                      id="maxAccesses"
                      type="number"
                      value={newCredential.maxAccesses}
                      onChange={(e) => setNewCredential(prev => ({ ...prev, maxAccesses: e.target.value }))}
                      placeholder="100"
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleAddCredential} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as CredentialType)}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
          {Object.values(CredentialType).map(type => {
            const config = credentialTypeConfig[type];
            const count = getCredentialsByType(type).length;
            return (
              <TabsTrigger key={type} value={type} className="flex flex-col items-center space-y-1 p-3">
                <config.icon className="h-4 w-4" />
                <span className="text-xs">{config.label}</span>
                {count > 0 && <Badge variant="secondary" className="text-xs">{count}</Badge>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.values(CredentialType).map(type => (
          <TabsContent key={type} value={type} className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{credentialTypeConfig[type].label} Credentials</h2>
                <Badge variant="outline">
                  {getCredentialsByType(type).length} credentials
                </Badge>
              </div>

              <div className="grid gap-4">
                {getCredentialsByType(type).length === 0 ? (
                  <Card className="p-8 text-center">
                    <div className="space-y-3">
                      {React.createElement(credentialTypeConfig[type].icon, { className: "h-12 w-12 mx-auto text-muted-foreground" })}
                      <h3 className="text-lg font-medium">No {credentialTypeConfig[type].label} Credentials</h3>
                      <p className="text-muted-foreground">
                        Add your first {credentialTypeConfig[type].label.toLowerCase()} credential to get started.
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <p>Examples:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {credentialTypeConfig[type].examples.map((example, index) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                ) : (
                  getCredentialsByType(type).map(credential => (
                    <CredentialCard key={credential.id} credential={credential} />
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}