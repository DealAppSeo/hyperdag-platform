import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  Loader2,
  ExternalLink
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Types for platform compatibility checking
interface PlatformFeature {
  id: string;
  name: string;
  description: string;
  compatibility: "full" | "partial" | "none" | "unknown";
  notes?: string;
}

interface Platform {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  features: PlatformFeature[];
  overallCompatibility: number;
  integrationComplexity: "easy" | "moderate" | "complex";
  verified: boolean;
}

// Sample platform data (would come from API in production)
const platforms: Platform[] = [
  {
    id: "huggingface",
    name: "Hugging Face",
    logo: "https://huggingface.co/favicon.ico",
    website: "https://huggingface.co",
    description: "AI community hub with models, datasets and applications for machine learning",
    features: [
      {
        id: "sbt-verification",
        name: "SBT Verification",
        description: "Verify Soulbound Tokens (SBT) issued on HyperDAG",
        compatibility: "full",
        notes: "Full support via API with sample code available"
      },
      {
        id: "reputation-score",
        name: "Reputation Score",
        description: "Access and verify reputation scores with ZKPs",
        compatibility: "full",
        notes: "Full support for reading and verifying reputation metrics"
      },
      {
        id: "cross-platform-auth",
        name: "Cross-Platform Auth",
        description: "Single sign-on with HyperDAG credentials",
        compatibility: "partial",
        notes: "Works through OAuth flow but requires additional configuration"
      },
      {
        id: "data-sharing",
        name: "Secure Data Sharing",
        description: "Share data securely between platforms",
        compatibility: "partial",
        notes: "Limited to certain data types, full integration coming soon"
      }
    ],
    overallCompatibility: 85,
    integrationComplexity: "easy",
    verified: true
  },
  {
    id: "lovable",
    name: "Lovable.dev",
    logo: "https://lovable.dev/favicon.ico",
    website: "https://lovable.dev",
    description: "Developer platform for building and sharing AI-powered apps",
    features: [
      {
        id: "sbt-verification",
        name: "SBT Verification",
        description: "Verify Soulbound Tokens (SBT) issued on HyperDAG",
        compatibility: "full",
        notes: "Native integration with all SBT features"
      },
      {
        id: "reputation-score",
        name: "Reputation Score",
        description: "Access and verify reputation scores with ZKPs",
        compatibility: "full",
        notes: "Comprehensive support for all reputation metrics"
      },
      {
        id: "cross-platform-auth",
        name: "Cross-Platform Auth",
        description: "Single sign-on with HyperDAG credentials",
        compatibility: "full",
        notes: "Seamless authentication between platforms"
      },
      {
        id: "data-sharing",
        name: "Secure Data Sharing",
        description: "Share data securely between platforms",
        compatibility: "full",
        notes: "End-to-end encrypted data sharing with permission controls"
      }
    ],
    overallCompatibility: 95,
    integrationComplexity: "easy",
    verified: true
  },
  {
    id: "cursor",
    name: "Cursor",
    logo: "https://cursor.sh/favicon.ico",
    website: "https://cursor.sh",
    description: "AI-powered code editor for faster code completion and refactoring",
    features: [
      {
        id: "sbt-verification",
        name: "SBT Verification",
        description: "Verify Soulbound Tokens (SBT) issued on HyperDAG",
        compatibility: "partial",
        notes: "Basic verification supported, advanced features in development"
      },
      {
        id: "reputation-score",
        name: "Reputation Score",
        description: "Access and verify reputation scores with ZKPs",
        compatibility: "partial",
        notes: "Can read basic metrics but limited verification capabilities"
      },
      {
        id: "cross-platform-auth",
        name: "Cross-Platform Auth",
        description: "Single sign-on with HyperDAG credentials",
        compatibility: "none",
        notes: "Not yet implemented, planned for future release"
      },
      {
        id: "data-sharing",
        name: "Secure Data Sharing",
        description: "Share data securely between platforms",
        compatibility: "partial",
        notes: "Limited to code snippets and small datasets"
      }
    ],
    overallCompatibility: 60,
    integrationComplexity: "moderate",
    verified: true
  },
  {
    id: "zencoder",
    name: "Zencoder",
    logo: "https://zencoder.ai/favicon.ico",
    website: "https://zencoder.ai",
    description: "AI-powered code completion and analysis tool",
    features: [
      {
        id: "sbt-verification",
        name: "SBT Verification",
        description: "Verify Soulbound Tokens (SBT) issued on HyperDAG",
        compatibility: "partial",
        notes: "Basic implementation available through SDK"
      },
      {
        id: "reputation-score",
        name: "Reputation Score",
        description: "Access and verify reputation scores with ZKPs",
        compatibility: "partial",
        notes: "Read-only access to reputation data"
      },
      {
        id: "cross-platform-auth",
        name: "Cross-Platform Auth",
        description: "Single sign-on with HyperDAG credentials",
        compatibility: "partial",
        notes: "Beta implementation available"
      },
      {
        id: "data-sharing",
        name: "Secure Data Sharing",
        description: "Share data securely between platforms",
        compatibility: "none",
        notes: "Not currently supported"
      }
    ],
    overallCompatibility: 55,
    integrationComplexity: "moderate",
    verified: false
  },
  {
    id: "replit",
    name: "Replit",
    logo: "https://replit.com/favicon.ico",
    website: "https://replit.com",
    description: "Collaborative browser-based IDE for coding and development",
    features: [
      {
        id: "sbt-verification",
        name: "SBT Verification",
        description: "Verify Soulbound Tokens (SBT) issued on HyperDAG",
        compatibility: "full",
        notes: "Comprehensive integration with all verification features"
      },
      {
        id: "reputation-score",
        name: "Reputation Score",
        description: "Access and verify reputation scores with ZKPs",
        compatibility: "full",
        notes: "Full support for reputation verification and utilization"
      },
      {
        id: "cross-platform-auth",
        name: "Cross-Platform Auth",
        description: "Single sign-on with HyperDAG credentials",
        compatibility: "full",
        notes: "Seamless authentication between platforms"
      },
      {
        id: "data-sharing",
        name: "Secure Data Sharing",
        description: "Share data securely between platforms",
        compatibility: "partial",
        notes: "Works for most data types with some limitations"
      }
    ],
    overallCompatibility: 90,
    integrationComplexity: "easy",
    verified: true
  }
];

export default function PlatformCompatibilityPage() {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  
  // Filter platforms based on user selections
  const filteredPlatforms = platforms.filter(platform => {
    if (showVerifiedOnly && !platform.verified) return false;
    if (filter === "all") return true;
    if (filter === "high" && platform.overallCompatibility >= 80) return true;
    if (filter === "medium" && platform.overallCompatibility >= 50 && platform.overallCompatibility < 80) return true;
    if (filter === "low" && platform.overallCompatibility < 50) return true;
    return false;
  });
  
  // Mutation for running compatibility check (simulated)
  const checkMutation = useMutation({
    mutationFn: async (platformId: string) => {
      // Simulate API request
      setIsChecking(true);
      
      // In a real implementation, this would be an API call
      const response = await new Promise(resolve => {
        setTimeout(() => {
          const platform = platforms.find(p => p.id === platformId);
          resolve({
            success: true,
            platformId,
            timestamp: new Date().toISOString(),
            results: {
              connection: { status: "success", latency: "54ms" },
              authFlow: { status: "success", notes: "Authentication flow completed successfully" },
              dataExchange: { status: "success", bytesTransferred: "1.2KB" },
              verificationTest: { status: "success", tokensVerified: 1 }
            },
            recommendations: [
              "Implement caching for reputation scores to improve performance",
              "Update to the latest SDK version for enhanced security",
              "Enable webhook notifications for real-time updates"
            ]
          });
        }, 1500);
      });
      
      setIsChecking(false);
      return response;
    },
    onSuccess: (data) => {
      setCheckResults(data);
      toast({
        title: "Compatibility check completed",
        description: "The platform compatibility check was successful.",
      });
    },
    onError: (error) => {
      toast({
        title: "Compatibility check failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Get badge color based on compatibility level
  const getCompatibilityColor = (level: "full" | "partial" | "none" | "unknown") => {
    switch (level) {
      case "full": return "bg-green-100 text-green-800 border-green-200";
      case "partial": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "none": return "bg-red-100 text-red-800 border-red-200";
      case "unknown": 
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  // Get icon based on compatibility level
  const getCompatibilityIcon = (level: "full" | "partial" | "none" | "unknown") => {
    switch (level) {
      case "full": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "partial": return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "none": return <XCircle className="h-5 w-5 text-red-600" />;
      case "unknown":
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };
  
  const handleCheckCompatibility = (platform: Platform) => {
    setSelectedPlatform(platform);
    setActiveTab("check");
    setCheckResults(null);
    checkMutation.mutate(platform.id);
  };
  
  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Platform Compatibility</h1>
        <p className="text-gray-600 mb-6">
          Check how well HyperDAG integrates with your favorite development platforms and tools.
        </p>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center">
          <div className="w-full md:w-auto">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by compatibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="high">High Compatibility (80%+)</SelectItem>
                <SelectItem value="medium">Medium Compatibility (50-79%)</SelectItem>
                <SelectItem value="low">Low Compatibility (Less than 50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="verified-only"
              checked={showVerifiedOnly}
              onCheckedChange={setShowVerifiedOnly}
            />
            <Label htmlFor="verified-only">Show verified platforms only</Label>
          </div>
        </div>
        
        {/* Platform cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {filteredPlatforms.map(platform => (
            <Card key={platform.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <img 
                      src={platform.logo} 
                      alt={`${platform.name} logo`} 
                      className="w-8 h-8 mr-3 rounded"
                      onError={(e) => {
                        // Use fallback icon if image fails to load
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='2' width='20' height='20' rx='5' ry='5'%3E%3C/rect%3E%3Cpath d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'%3E%3C/path%3E%3Cline x1='17.5' y1='6.5' x2='17.51' y2='6.5'%3E%3C/line%3E%3C/svg%3E";
                      }}
                    />
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                  </div>
                  {platform.verified && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                      Verified
                    </Badge>
                  )}
                </div>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Compatibility</span>
                    <span className="text-sm font-bold">{platform.overallCompatibility}%</span>
                  </div>
                  <Progress value={platform.overallCompatibility} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Key Features</div>
                  <ul className="space-y-1">
                    {platform.features.slice(0, 2).map(feature => (
                      <li key={feature.id} className="flex items-center text-sm">
                        <span className="mr-1.5">
                          {getCompatibilityIcon(feature.compatibility)}
                        </span>
                        {feature.name}
                      </li>
                    ))}
                    {platform.features.length > 2 && (
                      <li className="text-sm text-gray-500">
                        +{platform.features.length - 2} more features
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="mt-3 text-sm">
                  <span className="font-medium">Integration complexity: </span>
                  <span className={
                    platform.integrationComplexity === "easy" ? "text-green-600" :
                    platform.integrationComplexity === "moderate" ? "text-amber-600" :
                    "text-red-600"
                  }>
                    {platform.integrationComplexity}
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={platform.website} target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <span>Visit</span>
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </Button>
                <Button 
                  onClick={() => handleCheckCompatibility(platform)}
                  size="sm"
                >
                  Check Compatibility
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {/* Detailed view when platform is selected */}
        {selectedPlatform && (
          <Card className="mb-10">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <img 
                    src={selectedPlatform.logo} 
                    alt={`${selectedPlatform.name} logo`} 
                    className="w-10 h-10 mr-3 rounded"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='2' width='20' height='20' rx='5' ry='5'%3E%3C/rect%3E%3Cpath d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'%3E%3C/path%3E%3Cline x1='17.5' y1='6.5' x2='17.51' y2='6.5'%3E%3C/line%3E%3C/svg%3E";
                    }}
                  />
                  <div>
                    <CardTitle className="text-2xl">{selectedPlatform.name}</CardTitle>
                    <CardDescription>{selectedPlatform.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedPlatform.verified && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                      Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className={
                    selectedPlatform.overallCompatibility >= 80 ? "bg-green-50 text-green-800 border-green-200" :
                    selectedPlatform.overallCompatibility >= 50 ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
                    "bg-red-50 text-red-800 border-red-200"
                  }>
                    {selectedPlatform.overallCompatibility}% Compatible
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <div className="px-6">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="check">Live Check</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="overview" className="px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Integration Overview</h3>
                    <p className="text-gray-600">
                      HyperDAG offers {selectedPlatform.overallCompatibility >= 80 ? "excellent" : 
                        selectedPlatform.overallCompatibility >= 50 ? "good" : "basic"} compatibility 
                      with {selectedPlatform.name}. The integration process is rated 
                      as <span className="font-medium">{selectedPlatform.integrationComplexity}</span>.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Compatibility Score</h3>
                    <div className="flex items-center mb-4">
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Overall Compatibility</span>
                          <span className="text-sm font-bold">{selectedPlatform.overallCompatibility}%</span>
                        </div>
                        <Progress value={selectedPlatform.overallCompatibility} className="h-3" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">What works well:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {selectedPlatform.features
                            .filter(f => f.compatibility === "full")
                            .map(feature => (
                              <li key={feature.id}>{feature.name}</li>
                            ))}
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Limitations:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {selectedPlatform.features
                            .filter(f => f.compatibility === "partial" || f.compatibility === "none")
                            .map(feature => (
                              <li key={feature.id}>{feature.name} ({feature.compatibility === "partial" ? "partial support" : "not supported"})</li>
                            ))}
                          {selectedPlatform.features.filter(f => f.compatibility === "partial" || f.compatibility === "none").length === 0 && (
                            <li>No significant limitations identified</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="mb-3">
                        Follow these steps to integrate HyperDAG with {selectedPlatform.name}:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Install the HyperDAG SDK for {selectedPlatform.name}</li>
                        <li>Configure your API keys in the settings panel</li>
                        <li>Initialize the HyperDAG client in your application</li>
                        <li>Test authentication and verify SBT verification</li>
                        <li>Implement reputation score verification</li>
                      </ol>
                      <div className="mt-4">
                        <Button variant="outline" size="sm">
                          View Documentation
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="px-6 pb-6">
                <Table>
                  <TableCaption>Detailed compatibility for each feature</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Compatibility</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="hidden md:table-cell">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPlatform.features.map(feature => (
                      <TableRow key={feature.id}>
                        <TableCell className="font-medium">
                          {feature.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getCompatibilityColor(feature.compatibility)}>
                            {feature.compatibility === "full" ? "Full Support" : 
                             feature.compatibility === "partial" ? "Partial Support" : 
                             feature.compatibility === "none" ? "Not Supported" : "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>{feature.description}</TableCell>
                        <TableCell className="hidden md:table-cell">{feature.notes || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Compatibility Details</h3>
                  <div className="space-y-4">
                    {selectedPlatform.features.map(feature => (
                      <Card key={feature.id} className="overflow-hidden">
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {getCompatibilityIcon(feature.compatibility)}
                              <CardTitle className="text-base ml-2">{feature.name}</CardTitle>
                            </div>
                            <Badge variant="outline" className={getCompatibilityColor(feature.compatibility)}>
                              {feature.compatibility === "full" ? "Full Support" : 
                               feature.compatibility === "partial" ? "Partial Support" : 
                               feature.compatibility === "none" ? "Not Supported" : "Unknown"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-3">
                          <p className="text-sm mb-2">{feature.description}</p>
                          {feature.notes && (
                            <div className="text-sm bg-gray-50 p-3 rounded border border-gray-200">
                              <span className="font-medium">Notes: </span>
                              {feature.notes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="check" className="px-6 pb-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-2">Live Compatibility Check</h3>
                    <p className="text-gray-600 mb-4">
                      This tool will perform a live check of your current environment's compatibility with {selectedPlatform.name}.
                      It verifies connectivity, authentication flows, and the ability to exchange data between platforms.
                    </p>
                    
                    <Button 
                      onClick={() => checkMutation.mutate(selectedPlatform.id)}
                      disabled={isChecking || checkMutation.isPending}
                      className="flex items-center"
                    >
                      {(isChecking || checkMutation.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Running check...
                        </>
                      ) : (
                        <>
                          {checkResults ? "Run Check Again" : "Run Compatibility Check"}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {isChecking || checkMutation.isPending ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-gray-600">Running compatibility check...</p>
                      <p className="text-sm text-gray-500">This may take a few moments</p>
                    </div>
                  ) : checkResults ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Test Results</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-base flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                Connection Test
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                              <p className="text-sm">Status: <span className="text-green-600 font-medium">Success</span></p>
                              <p className="text-sm">Latency: {checkResults.results.connection.latency}</p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-base flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                Authentication Flow
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                              <p className="text-sm">Status: <span className="text-green-600 font-medium">Success</span></p>
                              <p className="text-sm">{checkResults.results.authFlow.notes}</p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-base flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                Data Exchange
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                              <p className="text-sm">Status: <span className="text-green-600 font-medium">Success</span></p>
                              <p className="text-sm">Data Transferred: {checkResults.results.dataExchange.bytesTransferred}</p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-base flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                Token Verification
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                              <p className="text-sm">Status: <span className="text-green-600 font-medium">Success</span></p>
                              <p className="text-sm">Tokens Verified: {checkResults.results.verificationTest.tokensVerified}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                        <Card>
                          <CardContent className="py-4">
                            <ul className="space-y-2">
                              {checkResults.recommendations.map((rec: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-lg font-semibold mb-2 text-blue-800">Next Steps</h3>
                        <p className="text-blue-700 mb-3">
                          Your environment is compatible with {selectedPlatform.name}. Here's what you can do next:
                        </p>
                        <ul className="space-y-2 text-blue-700">
                          <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Follow our integration guide to fully set up {selectedPlatform.name} with HyperDAG</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Implement the recommended optimizations above</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Test SBT verification with your actual tokens</span>
                          </li>
                        </ul>
                        <div className="mt-4">
                          <Button size="sm">View Integration Guide</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <Info className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-2">No check results available</h3>
                      <p className="text-gray-600 mb-4">
                        Run a compatibility check to see detailed results and recommendations.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
    </Layout>
  );
}