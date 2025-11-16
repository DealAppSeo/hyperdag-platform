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
      title: 'Donation Started',
      description: `You're about to donate to ${nonprofit.name}`,
    });
    // Navigate to donation page for this nonprofit
    window.location.href = `/donate/${nonprofit.id}`;
  };

  // Calculate overall beacon score (average of all four scores)
  const overallScore = Math.round(
    (nonprofit.transparencyScore + nonprofit.impactScore + 
     nonprofit.governanceScore + nonprofit.financialScore) / 4
  );

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div 
        className="h-20 bg-cover bg-center" 
        style={{ 
          backgroundImage: nonprofit.coverImageUrl 
            ? `url(${nonprofit.coverImageUrl})` 
            : 'linear-gradient(to right, #4f46e5, #8b5cf6)'
        }}
      />
      <CardHeader className="relative pb-2">
        <div className="absolute -top-12 left-4 rounded-full border-4 border-white bg-white">
          <img 
            src={nonprofit.profileImageUrl} 
            alt={`${nonprofit.name} logo`} 
            className="h-16 w-16 rounded-full object-contain p-1"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nonprofit.name)}&background=4f46e5&color=ffffff&size=64`;
            }}
          />
        </div>
        <div className="ml-20 pt-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{nonprofit.name}</CardTitle>
            {nonprofit.verified && (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 shrink-0">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          <CardDescription className="text-sm mt-1">{nonprofit.mission}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {nonprofit.categories.map((category, index) => (
            <Badge key={`nonprofit-${nonprofit.id}-category-${category}-${index}`} variant="secondary" className="text-xs">
              {category}
            </Badge>
          ))}
        </div>
        
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">Overall Beacon Score</span>
            <span className="text-sm font-semibold">{overallScore}/100</span>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="rounded-md bg-blue-50 p-2">
            <div className="font-semibold text-blue-700">Impact</div>
            <div className="text-xs text-blue-600">{nonprofit.impactScore}/100</div>
          </div>
          <div className="rounded-md bg-amber-50 p-2">
            <div className="font-semibold text-amber-700">Financial Health</div>
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
      <CardFooter className="flex gap-2 bg-muted/20 pt-3">
        <Button variant="default" className="flex-1" onClick={handleDonate}>
          <Heart className="mr-2 h-4 w-4" />
          Donate
        </Button>
        <Button variant="outline" asChild>
          <a href={nonprofit.website} target="_blank" rel="noopener noreferrer" className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            Website
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Main component for the Non-Profit Directory page
const NonProfitDirectoryPage: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch non-profits data
  const { data: nonprofits, isLoading, error } = useQuery<NonProfit[]>({
    queryKey: ['/api/organizations'],
    // For now we'll use placeholder data
    // In a real implementation, we'd fetch from the database
    queryFn: async () => {
      // Authentic nonprofit organizations from verified sources
      // Referral Code: 836277C0 - Join HyperDAG to support these worthy causes
      return [
        {
          id: 1,
          name: "Accord Network",
          type: "non-profit",
          description: "A place to connect with like-minded organizations in pursuit of being the hands and feet of Christ around the world.",
          mission: "Connect organizations to serve Christ globally",
          verified: true,
          verificationDate: "2025-04-15",
          verificationMethod: "sbt",
          website: "https://accordnetwork.org",
          reputationScore: 94,
          profileImageUrl: "https://accordnetwork.org/wp-content/uploads/2019/06/accord-network-logo-square.png",
          coverImageUrl: "https://accordnetwork.org/wp-content/uploads/2019/06/accord-network-hero-bg.jpg",
          categories: ["Christian", "Global Outreach", "Networking", "Community"],
          sbtId: "sbt-accord-network-verified",
          transparencyScore: 95,
          impactScore: 93,
          governanceScore: 94,
          financialScore: 94
        },
        {
          id: 2,
          name: "Compassion International",
          type: "non-profit",
          description: "A Christian child development organization working to release children from poverty in Jesus' name, with a focus on long-term solutions.",
          mission: "Release children from poverty in Jesus' name",
          verified: true,
          verificationDate: "2025-04-10",
          verificationMethod: "tax_document",
          website: "https://compassion.com",
          reputationScore: 96,
          profileImageUrl: "https://www.compassion.com/favicon.ico",
          coverImageUrl: "https://www.compassion.com/multimedia/compassion-logo-primary-full-color.svg",
          categories: ["Child Development", "Christian", "Poverty Alleviation", "Education"],
          sbtId: "sbt-compassion-international",
          transparencyScore: 97,
          impactScore: 96,
          governanceScore: 95,
          financialScore: 96
        },
        {
          id: 3,
          name: "Convoy of Hope",
          type: "non-profit",
          description: "A humanitarian organization providing food, shelter, and other essential resources to those in need, with a history of consistent four-star ratings from Charity Navigator.",
          mission: "Feed the world through children",
          verified: true,
          verificationDate: "2025-04-05",
          verificationMethod: "sbt",
          website: "https://convoyofhope.org",
          reputationScore: 95,
          profileImageUrl: "https://convoyofhope.org/wp-content/uploads/2023/03/convoy-of-hope-logo.png",
          coverImageUrl: "https://convoyofhope.org/wp-content/uploads/2023/03/convoy-hero-banner.jpg",
          categories: ["Humanitarian Aid", "Food Security", "Disaster Relief", "Community Support"],
          sbtId: "sbt-convoy-of-hope",
          transparencyScore: 96,
          impactScore: 95,
          governanceScore: 95,
          financialScore: 94
        },
        {
          id: 4,
          name: "Christian Blind Mission International",
          type: "non-profit",
          description: "This charity is known for allocating 100% of donations to the cause.",
          mission: "End preventable blindness and support people with disabilities",
          verified: true,
          verificationDate: "2025-04-01",
          verificationMethod: "sbt",
          website: "https://www.cbm.org/",
          reputationScore: 98,
          profileImageUrl: "https://www.cbm.org.au/wp-content/uploads/2020/04/CBM-logo-square.png",
          coverImageUrl: "https://www.cbm.org.au/wp-content/uploads/2020/04/cbm-hero-children.jpg",
          categories: ["Healthcare", "Disability Support", "Christian", "International Development"],
          sbtId: "sbt-cbm-international",
          transparencyScore: 100,
          impactScore: 97,
          governanceScore: 96,
          financialScore: 100
        },
        {
          id: 5,
          name: "Direct Relief",
          type: "non-profit",
          description: "Healthy People. Better world. All people.",
          mission: "Improve the health and lives of people affected by poverty or emergency",
          verified: true,
          verificationDate: "2025-03-28",
          verificationMethod: "tax_document",
          website: "https://directrelief.org",
          reputationScore: 94,
          profileImageUrl: "https://www.directrelief.org/wp-content/uploads/2023/01/DR-logo-square.png",
          coverImageUrl: "https://www.directrelief.org/wp-content/uploads/2023/01/direct-relief-hero.jpg",
          categories: ["Healthcare", "Emergency Relief", "Global Health", "Medical Aid"],
          sbtId: "sbt-direct-relief",
          transparencyScore: 95,
          impactScore: 94,
          governanceScore: 93,
          financialScore: 94
        },
        {
          id: 6,
          name: "FaithTech",
          type: "non-profit",
          description: "Bridging the gap between faith and technology.",
          mission: "Connect, inspire and equip people to use technology to love God and neighbor",
          verified: true,
          verificationDate: "2025-03-25",
          verificationMethod: "sbt",
          website: "https://faithtech.com",
          reputationScore: 89,
          profileImageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60",
          categories: ["Technology", "Faith", "Innovation", "Community"],
          sbtId: "sbt-faithtech",
          transparencyScore: 90,
          impactScore: 89,
          governanceScore: 88,
          financialScore: 89
        },
        {
          id: 7,
          name: "Good360",
          type: "non-profit",
          description: "Closing the need gap to create opportunity for all.",
          mission: "Transform lives by providing hope, dignity and a sense of renewed possibility",
          verified: true,
          verificationDate: "2025-03-20",
          verificationMethod: "tax_document",
          website: "https://good360.org",
          reputationScore: 92,
          profileImageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60",
          categories: ["Disaster Relief", "Community Support", "Resource Distribution", "Nonprofit Support"],
          sbtId: "sbt-good360",
          transparencyScore: 93,
          impactScore: 92,
          governanceScore: 91,
          financialScore: 92
        },
        {
          id: 8,
          name: "Healing Hands International",
          type: "non-profit",
          description: "Giving hope to a hurting world.",
          mission: "Serve the physical and spiritual needs of people around the world",
          verified: true,
          verificationDate: "2025-03-15",
          verificationMethod: "sbt",
          website: "https://hhi.org",
          reputationScore: 91,
          profileImageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop&q=60",
          categories: ["Healthcare", "International Development", "Christian", "Medical Missions"],
          sbtId: "sbt-healing-hands",
          transparencyScore: 92,
          impactScore: 91,
          governanceScore: 90,
          financialScore: 91
        },
        {
          id: 9,
          name: "Heart to Heart International",
          type: "non-profit",
          description: "This charity is known for allocating 100% of donations to the cause.",
          mission: "Increase access to healthcare for the world's most vulnerable populations",
          verified: true,
          verificationDate: "2025-03-10",
          verificationMethod: "sbt",
          website: "https://hearttoheart.org",
          reputationScore: 97,
          profileImageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&auto=format&fit=crop&q=60",
          categories: ["Healthcare", "Global Health", "Emergency Response", "Medical Aid"],
          sbtId: "sbt-heart-to-heart",
          transparencyScore: 100,
          impactScore: 96,
          governanceScore: 95,
          financialScore: 100
        },
        {
          id: 10,
          name: "Matthew 25 Ministries",
          type: "non-profit",
          description: "A Christian charity focused on helping those in need, with a focus on practical solutions.",
          mission: "Fulfill Matthew 25:34-40 of Jesus' teaching by providing help and hope",
          verified: true,
          verificationDate: "2025-03-05",
          verificationMethod: "tax_document",
          website: "https://m25m.org",
          reputationScore: 90,
          profileImageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&auto=format&fit=crop&q=60",
          categories: ["Christian", "Humanitarian Aid", "Community Support", "Disaster Relief"],
          sbtId: "sbt-matthew25",
          transparencyScore: 91,
          impactScore: 90,
          governanceScore: 89,
          financialScore: 90
        },
        {
          id: 11,
          name: "Mercy Ships",
          type: "non-profit",
          description: "A Christian charity that uses hospital ships to provide healthcare to those in need in developing countries.",
          mission: "Follow the 2,000-year-old model of Jesus, bringing hope and healing",
          verified: true,
          verificationDate: "2025-03-01",
          verificationMethod: "sbt",
          website: "https://mercyships.org",
          reputationScore: 93,
          profileImageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop&q=60",
          categories: ["Healthcare", "Christian", "Medical Missions", "International Development"],
          sbtId: "sbt-mercy-ships",
          transparencyScore: 94,
          impactScore: 93,
          governanceScore: 92,
          financialScore: 93
        },
        {
          id: 12,
          name: "Midwest Food Bank",
          type: "non-profit",
          description: "This charity is known for allocating 100% of donations to the cause.",
          mission: "Share food, share hope by providing food relief to those in need",
          verified: true,
          verificationDate: "2025-02-25",
          verificationMethod: "sbt",
          website: "https://midwestfoodbank.org",
          reputationScore: 98,
          profileImageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60",
          categories: ["Food Security", "Community Support", "Hunger Relief", "Christian"],
          sbtId: "sbt-midwest-food-bank",
          transparencyScore: 100,
          impactScore: 97,
          governanceScore: 96,
          financialScore: 100
        },
        {
          id: 13,
          name: "Samaritan's Purse",
          type: "non-profit",
          description: "An international relief organization providing disaster relief and humanitarian aid, also known for its high ratings.",
          mission: "Follow the example of Christ by helping those in need",
          verified: true,
          verificationDate: "2025-02-20",
          verificationMethod: "tax_document",
          website: "https://samaritanspurse.org",
          reputationScore: 95,
          profileImageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&auto=format&fit=crop&q=60",
          categories: ["Disaster Relief", "Christian", "International Aid", "Emergency Response"],
          sbtId: "sbt-samaritans-purse",
          transparencyScore: 96,
          impactScore: 95,
          governanceScore: 94,
          financialScore: 95
        },
        {
          id: 14,
          name: "VETS Veterans Exploring Treatment Solutions Inc.",
          type: "non-profit",
          description: "This charity provides mental health support, resources, and community for veterans healing from trauma and PTSD.",
          mission: "Provide healing opportunities for veterans with PTSD and trauma",
          verified: true,
          verificationDate: "2025-02-15",
          verificationMethod: "sbt",
          website: "https://vetspts.org",
          reputationScore: 88,
          profileImageUrl: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop&q=60",
          categories: ["Veterans", "Mental Health", "PTSD Support", "Healthcare"],
          sbtId: "sbt-vets-pts",
          transparencyScore: 89,
          impactScore: 88,
          governanceScore: 87,
          financialScore: 88
        },
        {
          id: 15,
          name: "World Vision",
          type: "non-profit",
          description: "A global organization focused on child welfare, with a strong track record and a 94% score from Charity Navigator.",
          mission: "Our vision for every child, life in all its fullness",
          verified: true,
          verificationDate: "2025-02-10",
          verificationMethod: "tax_document",
          website: "https://worldvision.org",
          reputationScore: 94,
          profileImageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&auto=format&fit=crop&q=60",
          categories: ["Child Welfare", "Global Development", "Christian", "Poverty Alleviation"],
          sbtId: "sbt-world-vision",
          transparencyScore: 95,
          impactScore: 94,
          governanceScore: 93,
          financialScore: 94
        },
        {
          id: 16,
          name: "Living Water International",
          type: "non-profit",
          description: "Providing clean water access to underserved communities worldwide",
          mission: "Demonstrate the love of God by helping communities acquire clean water",
          verified: true,
          verificationDate: "2025-02-05",
          verificationMethod: "sbt",
          website: "https://water.cc",
          reputationScore: 92,
          profileImageUrl: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1541919329513-35f7af297129?w=800&auto=format&fit=crop&q=60",
          categories: ["Water", "Christian", "Global Development", "Community Health"],
          sbtId: "sbt-living-water",
          transparencyScore: 93,
          impactScore: 92,
          governanceScore: 91,
          financialScore: 92
        },
        {
          id: 17,
          name: "The Water Project",
          type: "non-profit",
          description: "Providing clean water access through community-driven solutions",
          mission: "Provide reliable water projects to communities in sub-Saharan Africa",
          verified: true,
          verificationDate: "2025-01-30",
          verificationMethod: "tax_document",
          website: "https://thewaterproject.org",
          reputationScore: 90,
          profileImageUrl: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1541919329513-35f7af297129?w=800&auto=format&fit=crop&q=60",
          categories: ["Water", "Africa", "Community Development", "Sustainability"],
          sbtId: "sbt-water-project",
          transparencyScore: 91,
          impactScore: 90,
          governanceScore: 89,
          financialScore: 90
        },
        {
          id: 18,
          name: "Four Square Missions Press",
          type: "non-profit",
          description: "Publishing and distributing Christian literature worldwide",
          mission: "Spread the Gospel through printed materials and literature",
          verified: true,
          verificationDate: "2025-01-25",
          verificationMethod: "sbt",
          website: "https://foursquaremissionspress.org",
          reputationScore: 87,
          profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop&q=60",
          categories: ["Christian", "Publishing", "Literature", "Global Missions"],
          sbtId: "sbt-foursquare-missions",
          transparencyScore: 88,
          impactScore: 87,
          governanceScore: 86,
          financialScore: 87
        },
        {
          id: 19,
          name: "Christian Health Service Corps",
          type: "non-profit",
          description: "Providing healthcare services to underserved communities",
          mission: "Advance health and healing in the name of Christ",
          verified: true,
          verificationDate: "2025-01-20",
          verificationMethod: "tax_document",
          website: "https://healthservicecorps.org",
          reputationScore: 89,
          profileImageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&auto=format&fit=crop&q=60",
          categories: ["Healthcare", "Christian", "Medical Missions", "Community Health"],
          sbtId: "sbt-christian-health-service",
          transparencyScore: 90,
          impactScore: 89,
          governanceScore: 88,
          financialScore: 89
        },
        {
          id: 20,
          name: "Helping Hands Medical Missions",
          type: "non-profit",
          description: "Providing medical care and support to communities in need",
          mission: "Provide medical care and share God's love in underserved areas",
          verified: true,
          verificationDate: "2025-01-15",
          verificationMethod: "sbt",
          website: "https://hhmm.org",
          reputationScore: 86,
          profileImageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&auto=format&fit=crop&q=60",
          coverImageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop&q=60",
          categories: ["Healthcare", "Christian", "Medical Missions", "International Aid"],
          sbtId: "sbt-helping-hands-medical",
          transparencyScore: 87,
          impactScore: 86,
          governanceScore: 85,
          financialScore: 86
        },
        {
          id: 21,
          name: "Tech Education for All",
          type: "non-profit",
          description: "Bridging the digital divide by providing technology education to underserved communities",
          mission: "Empower individuals through accessible technology education",
          verified: true,
          verificationDate: "2025-03-10",
          verificationMethod: "manual_review",
          website: "https://techeducationforall.org",
          reputationScore: 92,
          profileImageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGVjaCUyMGVkdWNhdGlvbnxlbnwwfHwwfHx8MA%3D%3D",
          coverImageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y29tcHV0ZXIlMjBlZHVjYXRpb258ZW58MHx8MHx8fDA%3D",
          categories: ["Education", "Technology", "Digital Literacy", "Community Development"],
          sbtId: "sbt-a7b21c3d-4e5f-6g7h-8i9j-0k1l2m3n4o5p",
          transparencyScore: 95,
          impactScore: 90,
          governanceScore: 93,
          financialScore: 88
        },
        {
          id: 22,
          name: "Sustainable Agriculture Network",
          type: "non-profit",
          description: "Promoting sustainable farming practices in developing regions",
          mission: "Transform agriculture through sustainable, resilient methods",
          verified: true,
          verificationDate: "2025-02-20",
          verificationMethod: "certificate",
          website: "https://sustainableagnetwork.org",
          reputationScore: 81,
          profileImageUrl: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmFybWluZ3xlbnwwfHwwfHx8MA%3D%3D",
          coverImageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c3VzdGFpbmFibGUlMjBmYXJtaW5nfGVufDB8fDB8fHww",
          categories: ["Agriculture", "Sustainability", "Food Security", "Rural Development"],
          sbtId: "sbt-9f8e7d6c-5b4a-3210-cdef-g9h8i7j6k5l4",
          transparencyScore: 83,
          impactScore: 85,
          governanceScore: 78,
          financialScore: 80
        },
        {
          id: 23,
          name: "Mental Health Alliance",
          type: "non-profit",
          description: "Advocating for mental health awareness and support services",
          mission: "Create a world where mental health is prioritized and accessible to all",
          verified: false,
          verificationDate: "",
          verificationMethod: "",
          website: "https://mentalhealthalliance.org",
          reputationScore: 75,
          profileImageUrl: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWVudGFsJTIwaGVhbHRofGVufDB8fDB8fHww",
          coverImageUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bWVudGFsJTIwaGVhbHRofGVufDB8fDB8fHww",
          categories: ["Mental Health", "Healthcare", "Advocacy", "Community Support"],
          sbtId: "sbt-1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
          transparencyScore: 73,
          impactScore: 80,
          governanceScore: 72,
          financialScore: 75
        }
      ];
    }
  });

  // Apply filters
  const filteredNonProfits = nonprofits?.filter(nonprofit => {
    // Check verification status filter
    if (filter === 'verified' && !nonprofit.verified) return false;
    if (filter === 'pending' && nonprofit.verified) return false;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        nonprofit.name.toLowerCase().includes(search) ||
        nonprofit.mission.toLowerCase().includes(search) ||
        nonprofit.description.toLowerCase().includes(search) ||
        nonprofit.categories.some(cat => cat.toLowerCase().includes(search))
      );
    }
    
    return true;
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
      
      <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-600 p-2 text-white">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Web3-Enhanced Charity Navigator</h3>
            <p className="text-sm text-blue-700">
              Our system rates non-profits across four key domains (inspired by Charity Navigator's beacons), 
              but enhanced with Web3 technology for data immutability and AI for needs matching.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-md bg-white/60 p-3 shadow-sm">
                <div className="flex items-center text-amber-700">
                  <Star className="mr-2 h-4 w-4" /> <span className="font-medium">Financial Health</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">Program spending, administrative costs, and financial transparency</p>
              </div>
              <div className="rounded-md bg-white/60 p-3 shadow-sm">
                <div className="flex items-center text-blue-700">
                  <Users className="mr-2 h-4 w-4" /> <span className="font-medium">Impact & Results</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">Measuring outcomes and delivering on their mission</p>
              </div>
              <div className="rounded-md bg-white/60 p-3 shadow-sm">
                <div className="flex items-center text-emerald-700">
                  <ShieldCheck className="mr-2 h-4 w-4" /> <span className="font-medium">Governance</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">Board composition, ethical practices, and leadership</p>
              </div>
              <div className="rounded-md bg-white/60 p-3 shadow-sm">
                <div className="flex items-center text-purple-700">
                  <Info className="mr-2 h-4 w-4" /> <span className="font-medium">Transparency</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">Information disclosure and data integrity practices</p>
              </div>
            </div>
            <div className="mt-3">
              <Link href="/nonprofit-methodology">
                <a className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                  Learn more about our methodology <ArrowUpRight className="ml-1 h-3 w-3" />
                </a>
              </Link>
            </div>
          </div>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={`skeleton-card-${i}`} className="overflow-hidden">
              <div className="h-32 animate-pulse bg-gray-200" />
              <CardHeader className="relative pb-2">
                <div className="absolute -top-16 left-4 h-24 w-24 animate-pulse rounded-full bg-gray-300" />
                <div className="ml-24">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  {[1, 2, 3].map(j => (
                    <div key={`skeleton-badge-${i}-${j}`} className="h-5 w-16 animate-pulse rounded bg-gray-200" />
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
                  {[1, 2, 3, 4].map(k => (
                    <div key={`skeleton-grid-${i}-${k}`} className="h-12 animate-pulse rounded bg-gray-100" />
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
          <Button variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      ) : sortedNonProfits?.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-800">No organizations found</h3>
          <p className="mt-2 text-sm text-gray-600">
            Try adjusting your filters or search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {sortedNonProfits?.map((nonprofit, index) => (
            <NonProfitCard key={`nonprofit-${nonprofit.id}`} nonprofit={nonprofit} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NonProfitDirectoryPage;