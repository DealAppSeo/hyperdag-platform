import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, Award, Building2, CheckCircle, Globe, Heart, Info, ShieldCheck, Star, Users, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

// Types for non-profit organizations
interface NonProfit {
  id: number;
  name: string;
  type: string;
  description: string;
  mission: string;
  verified: boolean;
  verificationDate: string;
  verificationMethod: string;
  website: string;
  reputationScore: number;
  profileImageUrl: string;
  coverImageUrl: string;
  categories: string[];
  sbtId: string;
  transparencyScore: number;
  impactScore: number;
  governanceScore: number;
  financialScore: number;
}

// Mobile-optimized NonProfit Card Component
const NonProfitCard: React.FC<{ nonprofit: NonProfit; index: number }> = ({ nonprofit, index }) => {
  const { toast } = useToast();

  const handleDonate = () => {
    toast({
      title: "Donation Feature",
      description: `Coming soon! You'll be able to donate HyperDAG tokens to ${nonprofit.name}.`,
    });
  };

  const handleVisitWebsite = () => {
    window.open(nonprofit.website, '_blank');
  };

  // Calculate overall score
  const overallScore = Math.round(
    (nonprofit.transparencyScore + nonprofit.impactScore + 
     nonprofit.governanceScore + nonprofit.financialScore) / 4
  );

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div 
        className="h-24 sm:h-32 bg-cover bg-center" 
        style={{ 
          backgroundImage: nonprofit.coverImageUrl 
            ? `url(${nonprofit.coverImageUrl})` 
            : 'linear-gradient(to right, #4f46e5, #8b5cf6)'
        }}
      />
      <CardHeader className="relative pb-2 px-3 sm:px-6">
        <div className="absolute -top-12 sm:-top-16 left-3 sm:left-4 rounded-full border-4 border-white bg-white">
          <img 
            src={nonprofit.profileImageUrl} 
            alt={nonprofit.name} 
            className="h-16 w-16 sm:h-24 sm:w-24 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nonprofit.name)}&background=4f46e5&color=ffffff&size=96`;
            }}
          />
        </div>
        <div className="ml-16 sm:ml-24 pt-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg sm:text-xl leading-tight">{nonprofit.name}</CardTitle>
            {nonprofit.verified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0 text-xs">
                <CheckCircle className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 capitalize">{nonprofit.type}</p>
          <CardDescription className="truncate text-xs sm:text-sm mt-1">{nonprofit.mission}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="mb-4 flex flex-wrap gap-1 sm:gap-2">
          {nonprofit.categories.map((category, categoryIndex) => (
            <Badge key={`org-${nonprofit.id}-cat-${categoryIndex}-${category}`} variant="secondary" className="text-xs">
              {category}
            </Badge>
          ))}
        </div>
        
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium">Overall Beacon Score</span>
            <span className="text-xs sm:text-sm font-semibold">{overallScore}/100</span>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-center text-xs sm:text-sm">
          <div className="rounded-md bg-blue-50 p-2">
            <div className="font-semibold text-blue-700">Impact</div>
            <div className="text-xs text-blue-600">{nonprofit.impactScore}/100</div>
          </div>
          <div className="rounded-md bg-amber-50 p-2">
            <div className="font-semibold text-amber-700">Financial</div>
            <div className="text-xs text-amber-600">{nonprofit.financialScore}/100</div>
          </div>
          <div className="rounded-md bg-emerald-50 p-2">
            <div className="font-semibold text-emerald-700">Governance</div>
            <div className="text-xs text-emerald-600">{nonprofit.governanceScore}/100</div>
          </div>
          <div className="rounded-md bg-purple-50 p-2">
            <div className="font-semibold text-purple-700">Transparency</div>
            <div className="text-xs text-purple-600">{nonprofit.transparencyScore}/100</div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-500" />
            <span className="text-xs">Rep: {nonprofit.reputationScore}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            <span className="text-xs">SBT Protected</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 bg-muted/20 pt-3 px-3 sm:px-6">
        <Button variant="default" className="flex-1 text-xs sm:text-sm" onClick={handleDonate}>
          <Heart className="mr-2 h-4 w-4" />
          Donate
        </Button>
        <Button variant="outline" className="flex-1 text-xs sm:text-sm" onClick={handleVisitWebsite}>
          <Globe className="mr-2 h-4 w-4" />
          Visit
        </Button>
      </CardFooter>
    </Card>
  );
};

const NonProfitDirectoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');

  // Fetch non-profit organizations
  const { data: nonprofits = [], isLoading, error } = useQuery<NonProfit[]>({
    queryKey: ['/api/nonprofits'],
    queryFn: () => {
      // Mock data for demonstration
      return Promise.resolve([
        {
          id: 1,
          name: "CodePath",
          type: "non-profit",
          description: "Transforming the tech industry by diversifying the next generation of software engineers",
          mission: "To transform the tech industry by diversifying the next generation of software engineers",
          verified: true,
          verificationDate: "2025-01-01",
          verificationMethod: "tax_document",
          website: "https://codepath.org",
          reputationScore: 95,
          profileImageUrl: "https://codepath.org/favicon.ico",
          coverImageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60",
          categories: ["Education", "Technology", "Diversity"],
          sbtId: "sbt-codepath-verified",
          transparencyScore: 98,
          impactScore: 95,
          governanceScore: 92,
          financialScore: 94
        },
        {
          id: 2,
          name: "Khan Academy",
          type: "non-profit",
          description: "Free, world-class education for anyone, anywhere",
          mission: "Provide a free, world-class education for anyone, anywhere",
          verified: true,
          verificationDate: "2025-01-15",
          verificationMethod: "legal_entity",
          website: "https://khanacademy.org",
          reputationScore: 98,
          profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=60",
          categories: ["Education", "Technology", "Global Access"],
          sbtId: "sbt-khan-academy",
          transparencyScore: 100,
          impactScore: 98,
          governanceScore: 96,
          financialScore: 92
        },
        {
          id: 3,
          name: "GiveDirectly",
          type: "non-profit",
          description: "Direct cash transfers to people living in poverty",
          mission: "Give money directly to people living in extreme poverty",
          verified: true,
          verificationDate: "2025-02-01",
          verificationMethod: "charity_navigator",
          website: "https://givedirectly.org",
          reputationScore: 96,
          profileImageUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60",
          categories: ["Poverty Alleviation", "Direct Aid", "Global Development"],
          sbtId: "sbt-givedirectly",
          transparencyScore: 97,
          impactScore: 96,
          governanceScore: 94,
          financialScore: 98
        }
      ]);
    }
  });

  // Get unique categories for filter
  const categories = Array.from(
    new Set(nonprofits.flatMap(np => np.categories))
  ).sort();

  // Filter non-profits based on search and filters
  const filteredNonProfits = nonprofits.filter(nonprofit => {
    const matchesSearch = nonprofit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nonprofit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nonprofit.mission.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           nonprofit.categories.includes(selectedCategory);
    
    const matchesVerification = verificationFilter === 'all' ||
                               (verificationFilter === 'verified' && nonprofit.verified) ||
                               (verificationFilter === 'unverified' && !nonprofit.verified);
    
    return matchesSearch && matchesCategory && matchesVerification;
  });

  // Sort non-profits by reputation score (highest first)
  const sortedNonProfits = filteredNonProfits?.sort((a, b) => b.reputationScore - a.reputationScore);

  return (
    <div className="container mx-auto p-3 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Verified Non-Profit Directory</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Discover trusted organizations with verified SBTs. Donate tokens you've earned on HyperDAG to support their causes.
            </p>
          </div>
          <Button size="sm" className="shrink-0 w-full sm:w-auto" asChild>
            <Link to="/nonprofits/submit">
              <Building2 className="mr-2 h-4 w-4" />
              Submit Organization
            </Link>
          </Button>
        </div>
        
        <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
            <span className="font-semibold text-sm sm:text-base text-blue-800">Join HyperDAG with Referral Code: 836277C0</span>
          </div>
          <p className="text-xs sm:text-sm text-blue-700 mt-1">
            Use this code to join our platform and help support these worthy causes through our token ecosystem.
          </p>
        </div>
      </div>
      
      <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="rounded-full bg-blue-600 p-2 text-white">
            <Search className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Find Organizations</h2>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Search by name, category, or filter by verification status</p>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, loadingIndex) => (
            <Card key={`loading-card-${loadingIndex}`} className="overflow-hidden">
              <div className="h-24 sm:h-32 animate-pulse bg-gray-200" />
              <CardHeader className="relative pb-2">
                <div className="absolute -top-12 sm:-top-16 left-3 sm:left-4 h-16 w-16 sm:h-24 sm:w-24 animate-pulse rounded-full bg-gray-300" />
                <div className="ml-16 sm:ml-24 pt-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  {Array.from({ length: 3 }, (_, badgeIndex) => (
                    <div key={`loading-badge-${loadingIndex}-${badgeIndex}`} className="h-5 w-16 animate-pulse rounded bg-gray-200" />
                  ))}
                </div>
                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-10 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="h-2 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }, (_, gridIndex) => (
                    <div key={`loading-grid-${loadingIndex}-${gridIndex}`} className="h-12 animate-pulse rounded bg-gray-100" />
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 bg-muted/20 pt-3">
                <div className="h-9 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-9 w-full animate-pulse rounded bg-gray-200" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Error loading non-profits</h3>
          <p className="mt-2 text-sm text-red-600">Please try again later or contact support if the problem persists.</p>
        </div>
      ) : sortedNonProfits.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-6 text-center">
          <h3 className="text-lg font-medium text-gray-800">No organizations found</h3>
          <p className="mt-2 text-sm text-gray-600">
            Try adjusting your filters or search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {sortedNonProfits.map((nonprofit, mapIndex) => (
            <NonProfitCard key={`nonprofit-main-${nonprofit.id}-${mapIndex}`} nonprofit={nonprofit} index={mapIndex} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NonProfitDirectoryPage;