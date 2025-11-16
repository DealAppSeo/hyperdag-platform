/**
 * Purpose Hub - Grants, Hackathons, and Nonprofits Discovery
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, DollarSign, ExternalLink, Search, Building2 } from 'lucide-react';

interface Grant {
  id: number;
  name: string;
  description: string;
  source: string;
  amount: number;
  url: string;
  categories: string[];
  requirements: string[];
  deadline: string;
  created_at: string;
  is_active: boolean;
}

const PurposeHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch grants with filters
  const { data: grantsData, isLoading: grantsLoading, error: grantsError } = useQuery({
    queryKey: ['grants', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '20',
        offset: '0'
      });
      
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/purpose-hub/grants?${params}`);
      if (!response.ok) throw new Error('Failed to fetch grants');
      return response.json();
    }
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount?.toLocaleString() || 0}`;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Purpose Hub
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">
            Discover AI & Web3 grants, hackathons, and nonprofits making a real impact
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search grants, hackathons, organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {grantsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading opportunities...</p>
            </div>
          ) : grantsError ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">Error loading grants. Please try again.</p>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Available Opportunities
                  {grantsData?.pagination?.total && (
                    <span className="text-lg font-normal text-slate-600 dark:text-slate-400 ml-2">
                      ({grantsData.pagination.total} total)
                    </span>
                  )}
                </h2>
              </div>

              {/* Grant Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {grantsData?.grants?.map((grant: Grant) => (
                  <Card key={grant.id} className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{grant.name}</CardTitle>
                          <CardDescription className="text-base">{grant.description}</CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-4">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {grant.source}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(grant.amount)}
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(grant.deadline)}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        {/* Categories */}
                        <div className="flex flex-wrap gap-2">
                          {grant.categories?.map((category: string) => (
                            <Badge key={category} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>

                        {/* Requirements */}
                        {grant.requirements?.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Requirements:
                            </div>
                            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                              {grant.requirements.slice(0, 2).map((req: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {req}
                                </li>
                              ))}
                              {grant.requirements.length > 2 && (
                                <li className="text-xs text-slate-500">
                                  +{grant.requirements.length - 2} more requirements
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="flex gap-3 pt-4">
                          <Button asChild className="flex-1">
                            <a href={grant.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Apply Now
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurposeHub;