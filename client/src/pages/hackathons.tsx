import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, Brain, Calendar, MapPin, DollarSign, Users, Zap, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import CrossPromotionSection from '@/components/CrossPromotionSection';
import AIMatchingFeature from '@/components/AIMatchingFeature';
import { ThumbsUpWithPurposeHub } from '@/components/common/ThumbsUpWithPurposeHub';

interface Hackathon {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  format: string;
  registration_deadline: string;
  prize_pool: string;
  focus_areas: string[];
  tracks: string[];
  organizer: string;
  website: string;
  relevance_score: number;
  social_impact_focus: boolean;
  ai_focus: boolean;
  web3_focus: boolean;
  educational_focus: boolean;
  financial_inclusion_focus: boolean;
}

interface MatchedOpportunity {
  type: 'nonprofit' | 'grant' | 'hackathon' | 'cofounder';
  name: string;
  description: string;
  match_score: number;
  alignment_reasons: string[];
  skills?: string[];
  experience?: string;
  contact?: string;
}

const HackathonsPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(null);
  const [showMatching, setShowMatching] = useState(false);

  // Fetch hackathons
  const { data: hackathons = [], isLoading } = useQuery<Hackathon[]>({
    queryKey: ['/api/hackathons'],
    queryFn: async () => {
      const response = await fetch('/api/hackathons');
      if (!response.ok) throw new Error('Failed to fetch hackathons');
      return response.json();
    }
  });

  // Fetch AI matches
  const { data: matches = [], isLoading: matchesLoading } = useQuery<MatchedOpportunity[]>({
    queryKey: ['/api/hackathons/matches', selectedHackathon?.id],
    queryFn: async () => {
      if (!selectedHackathon) return [];
      const response = await fetch(`/api/hackathons/${selectedHackathon.id}/matches`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    },
    enabled: !!selectedHackathon && showMatching
  });

  const filteredHackathons = hackathons.filter(hackathon => {
    const matchesSearch = hackathon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hackathon.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilters.length === 0) return matchesSearch;
    
    return matchesSearch && selectedFilters.some(filter => {
      switch (filter) {
        case 'ai': return hackathon.ai_focus;
        case 'web3': return hackathon.web3_focus;
        case 'social-impact': return hackathon.social_impact_focus;
        case 'education': return hackathon.educational_focus;
        case 'financial-inclusion': return hackathon.financial_inclusion_focus;
        case 'virtual': return hackathon.format === 'virtual';
        case 'in-person': return hackathon.format === 'in-person';
        case 'hybrid': return hackathon.format === 'hybrid';
        default: return false;
      }
    });
  });

  const handleFilterToggle = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const getFormatBadgeColor = (format: string) => {
    switch (format) {
      case 'virtual': return 'bg-blue-100 text-blue-800';
      case 'in-person': return 'bg-green-100 text-green-800';
      case 'hybrid': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const isRegistrationOpen = (deadline: string) => {
    return new Date(deadline) > new Date();
  };

  const handleAIMatching = (hackathon: Hackathon) => {
    setSelectedHackathon(hackathon);
    setShowMatching(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 font-bold px-6 py-3 text-lg rounded-full mb-6">
            ⚡ HACKATHONS
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Global Hackathons<br/>for Social Impact
          </h1>
          <p className="text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
            Discover AI, Web3, and social impact hackathons worldwide. Get intelligent matching with relevant nonprofits and grants.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              placeholder="Search hackathons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'ai', label: 'AI Focus' },
              { key: 'web3', label: 'Web3/Blockchain' },
              { key: 'social-impact', label: 'Social Impact' },
              { key: 'education', label: 'Education' },
              { key: 'financial-inclusion', label: 'Financial Inclusion' },
              { key: 'virtual', label: 'Virtual' },
              { key: 'in-person', label: 'In-Person' },
              { key: 'hybrid', label: 'Hybrid' }
            ].map(filter => (
              <Button
                key={filter.key}
                variant={selectedFilters.includes(filter.key) ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterToggle(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hackathons List */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-8">Loading hackathons...</div>
              ) : filteredHackathons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hackathons found matching your criteria.
                </div>
              ) : (
                filteredHackathons.map((hackathon) => (
                  <Card key={hackathon.id} className="border-2 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{hackathon.name}</CardTitle>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className={getFormatBadgeColor(hackathon.format)}>
                              {hackathon.format}
                            </Badge>
                            {isUpcoming(hackathon.start_date) && (
                              <Badge className="bg-green-100 text-green-800">Upcoming</Badge>
                            )}
                            {isRegistrationOpen(hackathon.registration_deadline) && (
                              <Badge className="bg-orange-100 text-orange-800">Registration Open</Badge>
                            )}
                            <Badge variant="outline">
                              Score: {hackathon.relevance_score}/100
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <CardDescription className="text-gray-600 leading-relaxed">
                        {hackathon.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      {/* Event Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {hackathon.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          {hackathon.prize_pool}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          {hackathon.organizer}
                        </div>
                      </div>

                      {/* Focus Areas */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Focus Areas:</h4>
                        <div className="flex flex-wrap gap-1">
                          {hackathon.focus_areas.map((area, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Tracks */}
                      {hackathon.tracks.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Tracks:</h4>
                          <div className="flex flex-wrap gap-1">
                            {hackathon.tracks.map((track, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {track}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <ThumbsUpWithPurposeHub
                          item={{
                            id: hackathon.id,
                            name: hackathon.name,
                            description: hackathon.description,
                            category: hackathon.focus_areas.join(', ')
                          }}
                          sourceType="hackathon"
                          size="sm"
                          variant="outline"
                        />
                        <Button
                          size="sm"
                          onClick={() => window.open(hackathon.website, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Visit Website
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAIMatching(hackathon)}
                          className="flex items-center gap-2"
                        >
                          <Brain className="h-4 w-4" />
                          AI Match Analysis
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* AI Matching Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Opportunity Matching
                </CardTitle>
                <CardDescription>
                  {selectedHackathon 
                    ? `Finding related opportunities for ${selectedHackathon.name}`
                    : 'Select a hackathon to see intelligent matches with nonprofits and grants'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {!selectedHackathon ? (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Click "AI Match Analysis" on any hackathon to see:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Related nonprofits to partner with</li>
                      <li>• Relevant grants for funding</li>
                      <li>• Co-founder matching for similar interests</li>
                      <li>• Similar hackathons and events</li>
                      <li>• Strategic collaboration opportunities</li>
                    </ul>
                  </div>
                ) : matchesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Analyzing opportunities...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.length === 0 ? (
                      <p className="text-gray-500 text-sm">No matches found for this hackathon.</p>
                    ) : (
                      matches.map((match, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={
                              match.type === 'nonprofit' ? 'default' :
                              match.type === 'grant' ? 'secondary' : 'outline'
                            }>
                              {match.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {match.match_score}% match
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm mb-1">{match.name}</h4>
                          <p className="text-xs text-gray-600 mb-2">{match.description}</p>
                          <div className="text-xs text-gray-500">
                            <strong>Why it matches:</strong>
                            <ul className="mt-1 space-y-1">
                              {match.alignment_reasons.map((reason, i) => (
                                <li key={i}>• {reason}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* AI Matching Feature for cross-platform synergies */}
      <AIMatchingFeature context="hackathons" />
      
      {/* Cross-promotion section for virtuous loop marketing */}
      <CrossPromotionSection currentPage="hackathons" />
    </div>
  );
};

export default HackathonsPage;