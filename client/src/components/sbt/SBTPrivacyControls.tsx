import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Eye, EyeOff, DollarSign, Lock, Unlock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SBTCredential {
  id: number;
  type: string;
  title: string;
  description: string;
  privacySettings: {
    allowPublicView: boolean;
    allowSearchIndexing: boolean;
    allowAnalytics: boolean;
    allowThirdPartyAccess: boolean;
    dataRetentionPeriod: number | null;
    autoDeleteAfterExpiry: boolean;
    requireExplicitConsent: boolean;
  };
  disclosureSettings: {
    publicFields: string[];
    verifiableFields: string[];
    monetizableFields: string[];
    personalFields: string[];
    anonymizableFields: string[];
  };
  anonymizationSettings: {
    isAnonymized: boolean;
    anonymizationLevel: number;
    pseudonymizationKey: string | null;
    hashedFields: string[];
    encryptedFields: string[];
    k_anonymity: number | null;
    l_diversity: number | null;
    t_closeness: number | null;
  };
  fieldPermissions: Record<string, {
    canView: boolean;
    canVerify: boolean;
    canMonetize: boolean;
  }>;
  revenueSharing: {
    userShare: number;
    platformShare: number;
    validatorShare: number;
    anonymizationCost: number;
  };
  isMonetizable: boolean;
  pricePerAccess: string;
}

interface SBTPrivacyControlsProps {
  credential: SBTCredential;
  onUpdate: (updatedCredential: SBTCredential) => void;
}

export default function SBTPrivacyControls({ credential, onUpdate }: SBTPrivacyControlsProps) {
  const [activeTab, setActiveTab] = useState('privacy');
  const [localCredential, setLocalCredential] = useState<SBTCredential>(credential);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Available data fields that users can control
  const availableFields = [
    'name', 'email', 'degree', 'institution', 'graduation_date', 
    'skills', 'certifications', 'work_history', 'references', 'achievements'
  ];

  const updatePrivacySettings = useMutation({
    mutationFn: async (settings: Partial<SBTCredential>) => {
      const response = await fetch(`/api/credentials/sbt/${credential.id}/privacy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Privacy Settings Updated",
        description: "Your data privacy controls have been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/sbt'] });
      onUpdate(localCredential);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update privacy settings",
        variant: "destructive"
      });
    }
  });

  const handlePrivacyUpdate = (field: string, value: any) => {
    const updatedCredential = {
      ...localCredential,
      privacySettings: {
        ...localCredential.privacySettings,
        [field]: value
      }
    };
    setLocalCredential(updatedCredential);
  };

  const handleDisclosureUpdate = (field: string, values: string[]) => {
    const updatedCredential = {
      ...localCredential,
      disclosureSettings: {
        ...localCredential.disclosureSettings,
        [field]: values
      }
    };
    setLocalCredential(updatedCredential);
  };

  const handleAnonymizationUpdate = (field: string, value: any) => {
    const updatedCredential = {
      ...localCredential,
      anonymizationSettings: {
        ...localCredential.anonymizationSettings,
        [field]: value
      }
    };
    setLocalCredential(updatedCredential);
  };

  const handleFieldPermissionUpdate = (fieldName: string, permission: string, value: boolean) => {
    const updatedCredential = {
      ...localCredential,
      fieldPermissions: {
        ...localCredential.fieldPermissions,
        [fieldName]: {
          ...localCredential.fieldPermissions[fieldName],
          [permission]: value
        }
      }
    };
    setLocalCredential(updatedCredential);
  };

  const saveSettings = () => {
    updatePrivacySettings.mutate(localCredential);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Data Privacy & Control Settings
          </CardTitle>
          <CardDescription>
            Manage your SBT credential: "{credential.title}" - Control exactly what data you share, 
            with whom, and how it's monetized while maintaining full anonymization capabilities.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-1" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="disclosure">
            <Eye className="h-4 w-4 mr-1" />
            Disclosure
          </TabsTrigger>
          <TabsTrigger value="anonymization">
            <Lock className="h-4 w-4 mr-1" />
            Anonymization
          </TabsTrigger>
          <TabsTrigger value="monetization">
            <DollarSign className="h-4 w-4 mr-1" />
            Monetization
          </TabsTrigger>
        </TabsList>

        {/* Privacy Controls */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Privacy Settings</CardTitle>
              <CardDescription>
                Control how your SBT data is accessed and used at the platform level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Public Viewing</Label>
                  <p className="text-sm text-gray-500">Allow others to view basic credential info</p>
                </div>
                <Switch
                  checked={localCredential.privacySettings.allowPublicView}
                  onCheckedChange={(value) => handlePrivacyUpdate('allowPublicView', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Search Engine Indexing</Label>
                  <p className="text-sm text-gray-500">Allow search engines to index your credential</p>
                </div>
                <Switch
                  checked={localCredential.privacySettings.allowSearchIndexing}
                  onCheckedChange={(value) => handlePrivacyUpdate('allowSearchIndexing', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Platform Analytics</Label>
                  <p className="text-sm text-gray-500">Allow anonymized analytics for platform improvement</p>
                </div>
                <Switch
                  checked={localCredential.privacySettings.allowAnalytics}
                  onCheckedChange={(value) => handlePrivacyUpdate('allowAnalytics', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Third-Party Access</Label>
                  <p className="text-sm text-gray-500">Allow verified third-party applications</p>
                </div>
                <Switch
                  checked={localCredential.privacySettings.allowThirdPartyAccess}
                  onCheckedChange={(value) => handlePrivacyUpdate('allowThirdPartyAccess', value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Retention Period (days)</Label>
                <Input
                  type="number"
                  value={localCredential.privacySettings.dataRetentionPeriod || ''}
                  onChange={(e) => handlePrivacyUpdate('dataRetentionPeriod', parseInt(e.target.value) || null)}
                  placeholder="Leave empty for permanent storage"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Delete After Expiry</Label>
                  <p className="text-sm text-gray-500">Automatically delete data when credential expires</p>
                </div>
                <Switch
                  checked={localCredential.privacySettings.autoDeleteAfterExpiry}
                  onCheckedChange={(value) => handlePrivacyUpdate('autoDeleteAfterExpiry', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Explicit Consent</Label>
                  <p className="text-sm text-gray-500">Always ask before sharing any data</p>
                </div>
                <Switch
                  checked={localCredential.privacySettings.requireExplicitConsent}
                  onCheckedChange={(value) => handlePrivacyUpdate('requireExplicitConsent', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Selective Disclosure Controls */}
        <TabsContent value="disclosure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selective Data Disclosure</CardTitle>
              <CardDescription>
                Choose exactly which data fields can be shared in different contexts. 
                You maintain full control over every piece of information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {availableFields.map((field) => (
                <div key={field} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="capitalize font-medium">{field.replace('_', ' ')}</Label>
                    <Badge variant="outline">{field}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={localCredential.fieldPermissions[field]?.canView || false}
                        onCheckedChange={(value) => handleFieldPermissionUpdate(field, 'canView', value)}
                      />
                      <Label className="text-sm">Viewable</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={localCredential.fieldPermissions[field]?.canVerify || false}
                        onCheckedChange={(value) => handleFieldPermissionUpdate(field, 'canVerify', value)}
                      />
                      <Label className="text-sm">Verifiable</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={localCredential.fieldPermissions[field]?.canMonetize || false}
                        onCheckedChange={(value) => handleFieldPermissionUpdate(field, 'canMonetize', value)}
                      />
                      <Label className="text-sm">Monetizable</Label>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    {localCredential.fieldPermissions[field]?.canView && (
                      <span className="inline-block mr-2">👁️ Visible to approved parties</span>
                    )}
                    {localCredential.fieldPermissions[field]?.canVerify && (
                      <span className="inline-block mr-2">✓ Can be verified via ZKP</span>
                    )}
                    {localCredential.fieldPermissions[field]?.canMonetize && (
                      <span className="inline-block mr-2">💰 Can generate revenue when anonymized</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anonymization Controls */}
        <TabsContent value="anonymization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Anonymization & Pseudonymization</CardTitle>
              <CardDescription>
                Protect your identity while still allowing data to be valuable. 
                Anonymized data can be safely monetized without revealing who you are.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Data Anonymization</Label>
                    <p className="text-sm text-gray-500">Transform data to remove personal identifiers</p>
                  </div>
                  <Switch
                    checked={localCredential.anonymizationSettings.isAnonymized}
                    onCheckedChange={(value) => handleAnonymizationUpdate('isAnonymized', value)}
                  />
                </div>

                {localCredential.anonymizationSettings.isAnonymized && (
                  <>
                    <div className="space-y-3">
                      <Label>Anonymization Level: {localCredential.anonymizationSettings.anonymizationLevel}</Label>
                      <Slider
                        value={[localCredential.anonymizationSettings.anonymizationLevel]}
                        onValueChange={(value) => handleAnonymizationUpdate('anonymizationLevel', value[0])}
                        max={5}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>None</span>
                        <span>Basic</span>
                        <span>Moderate</span>
                        <span>High</span>
                        <span>Maximum</span>
                        <span>Full</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>K-Anonymity</Label>
                        <Input
                          type="number"
                          value={localCredential.anonymizationSettings.k_anonymity || ''}
                          onChange={(e) => handleAnonymizationUpdate('k_anonymity', parseInt(e.target.value) || null)}
                          placeholder="e.g., 5"
                        />
                        <p className="text-xs text-gray-500">Minimum group size for identification</p>
                      </div>

                      <div className="space-y-2">
                        <Label>L-Diversity</Label>
                        <Input
                          type="number"
                          value={localCredential.anonymizationSettings.l_diversity || ''}
                          onChange={(e) => handleAnonymizationUpdate('l_diversity', parseInt(e.target.value) || null)}
                          placeholder="e.g., 3"
                        />
                        <p className="text-xs text-gray-500">Diversity in sensitive attributes</p>
                      </div>

                      <div className="space-y-2">
                        <Label>T-Closeness</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={localCredential.anonymizationSettings.t_closeness || ''}
                          onChange={(e) => handleAnonymizationUpdate('t_closeness', parseFloat(e.target.value) || null)}
                          placeholder="e.g., 0.2"
                        />
                        <p className="text-xs text-gray-500">Distribution similarity threshold</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Fields to Hash (one-way anonymization)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {availableFields.map((field) => (
                          <div key={field} className="flex items-center space-x-2">
                            <Switch
                              checked={localCredential.anonymizationSettings.hashedFields.includes(field)}
                              onCheckedChange={(checked) => {
                                const newFields = checked
                                  ? [...localCredential.anonymizationSettings.hashedFields, field]
                                  : localCredential.anonymizationSettings.hashedFields.filter(f => f !== field);
                                handleAnonymizationUpdate('hashedFields', newFields);
                              }}
                            />
                            <Label className="text-sm capitalize">{field.replace('_', ' ')}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Fields to Encrypt (reversible with your key)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {availableFields.map((field) => (
                          <div key={field} className="flex items-center space-x-2">
                            <Switch
                              checked={localCredential.anonymizationSettings.encryptedFields.includes(field)}
                              onCheckedChange={(checked) => {
                                const newFields = checked
                                  ? [...localCredential.anonymizationSettings.encryptedFields, field]
                                  : localCredential.anonymizationSettings.encryptedFields.filter(f => f !== field);
                                handleAnonymizationUpdate('encryptedFields', newFields);
                              }}
                            />
                            <Label className="text-sm capitalize">{field.replace('_', ' ')}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monetization Controls */}
        <TabsContent value="monetization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Monetization Settings</CardTitle>
              <CardDescription>
                Earn revenue from your anonymized data while maintaining complete privacy. 
                You control pricing and revenue distribution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Monetization</Label>
                  <p className="text-sm text-gray-500">Allow anonymized data to generate revenue</p>
                </div>
                <Switch
                  checked={localCredential.isMonetizable}
                  onCheckedChange={(value) => setLocalCredential(prev => ({ ...prev, isMonetizable: value }))}
                />
              </div>

              {localCredential.isMonetizable && (
                <>
                  <div className="space-y-2">
                    <Label>Price Per Access (ETH)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={localCredential.pricePerAccess}
                      onChange={(e) => setLocalCredential(prev => ({ ...prev, pricePerAccess: e.target.value }))}
                      placeholder="0.001"
                    />
                    <p className="text-xs text-gray-500">Price charged for each anonymized data access</p>
                  </div>

                  <div className="space-y-4">
                    <Label>Revenue Sharing Distribution</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Your Share: {localCredential.revenueSharing.userShare}%</Label>
                        <Slider
                          value={[localCredential.revenueSharing.userShare]}
                          onValueChange={(value) => setLocalCredential(prev => ({
                            ...prev,
                            revenueSharing: { ...prev.revenueSharing, userShare: value[0] }
                          }))}
                          max={90}
                          min={50}
                          step={5}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Platform Share: {localCredential.revenueSharing.platformShare}%</Label>
                        <Slider
                          value={[localCredential.revenueSharing.platformShare]}
                          onValueChange={(value) => setLocalCredential(prev => ({
                            ...prev,
                            revenueSharing: { ...prev.revenueSharing, platformShare: value[0] }
                          }))}
                          max={30}
                          min={10}
                          step={5}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Validator Share: {localCredential.revenueSharing.validatorShare}%</Label>
                        <Slider
                          value={[localCredential.revenueSharing.validatorShare]}
                          onValueChange={(value) => setLocalCredential(prev => ({
                            ...prev,
                            revenueSharing: { ...prev.revenueSharing, validatorShare: value[0] }
                          }))}
                          max={20}
                          min={5}
                          step={5}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Anonymization Cost: {localCredential.revenueSharing.anonymizationCost}%</Label>
                        <Slider
                          value={[localCredential.revenueSharing.anonymizationCost]}
                          onValueChange={(value) => setLocalCredential(prev => ({
                            ...prev,
                            revenueSharing: { ...prev.revenueSharing, anonymizationCost: value[0] }
                          }))}
                          max={15}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Monetization Summary</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Your data remains completely anonymous and private</li>
                      <li>• You earn {localCredential.revenueSharing.userShare}% of all revenue from your data</li>
                      <li>• Data buyers never see your identity or personal information</li>
                      <li>• You can revoke monetization permissions at any time</li>
                      <li>• All transactions are recorded on blockchain for transparency</li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => setLocalCredential(credential)}>
          Reset Changes
        </Button>
        <Button 
          onClick={saveSettings}
          disabled={updatePrivacySettings.isPending}
        >
          {updatePrivacySettings.isPending ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </div>
    </div>
  );
}