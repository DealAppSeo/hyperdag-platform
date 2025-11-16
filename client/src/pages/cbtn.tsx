import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Search, Star, ThumbsUp, ExternalLink, Globe, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUpWithPurposeHub } from '@/components/common/ThumbsUpWithPurposeHub';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';

interface Nonprofit {
  id: number;
  name: string;
  description: string;
  category: string;
  website?: string;
  focus: string;
  rating: number;
  verified: boolean;
  location?: string;
}

const nonprofitSuggestionSchema = z.object({
  name: z.string().min(2, 'Nonprofit name must be at least 2 characters'),
  website: z.string().url('Please enter a valid website URL'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  impactArea: z.string().min(5, 'Impact area must be at least 5 characters'),
  reason: z.string().min(20, 'Please explain why you believe in this organization (minimum 20 characters)')
});

type NonprofitSuggestionForm = z.infer<typeof nonprofitSuggestionSchema>;

export default function CBTNPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);

  const form = useForm<NonprofitSuggestionForm>({
    resolver: zodResolver(nonprofitSuggestionSchema),
    defaultValues: {
      name: '',
      website: '',
      description: '',
      category: '',
      impactArea: '',
      reason: ''
    }
  });

  const suggestionMutation = useMutation({
    mutationFn: async (data: NonprofitSuggestionForm) => {
      const response = await apiRequest('/api/nonprofit-suggestions', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your nonprofit suggestion has been submitted and our team will review it soon.",
      });
      form.reset();
      setShowSuggestionDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit nonprofit suggestion. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmitSuggestion = (data: NonprofitSuggestionForm) => {
    suggestionMutation.mutate(data);
  };

  // Fetch nonprofits
  const { data: nonprofits = [], isLoading } = useQuery<Nonprofit[]>({
    queryKey: ['/api/nonprofits'],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/nonprofits/categories'],
  });

  // Filter nonprofits based on search and category
  const filteredNonprofits = nonprofits.filter((nonprofit: Nonprofit) => {
    const matchesSearch = 
      nonprofit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nonprofit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nonprofit.focus.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || nonprofit.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });



  const getRatingStars = (rating: number) => {
    const numRating = rating;
    const fullStars = Math.floor(numRating);
    const halfStar = numRating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars 
                ? 'fill-yellow-400 text-yellow-400' 
                : i === fullStars && halfStar 
                ? 'fill-yellow-200 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-16">
          <div className="animate-spin mx-auto w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Loading verified nonprofits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 mb-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Nonprofit Directory
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-6">
          Discover verified nonprofits making real impact. Give a thumbs up to causes you believe in, 
          then save your favorites to your Purpose Hub to amplify their reach.
        </p>
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search nonprofits by name, mission, or impact area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category: string) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Suggest Nonprofit Button */}
        <div className="text-center">
          <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                <Plus className="h-4 w-4 mr-2" />
                Suggest a Nonprofit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Suggest a Nonprofit Organization</DialogTitle>
                <DialogDescription>
                  Know a nonprofit making real impact? Help us expand our directory by suggesting organizations you believe in.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => suggestionMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Doctors Without Borders" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Official Website *</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.org" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Health">Health & Medical</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Environment">Environment</SelectItem>
                            <SelectItem value="Poverty">Poverty & Hunger</SelectItem>
                            <SelectItem value="Human Rights">Human Rights</SelectItem>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Arts">Arts & Culture</SelectItem>
                            <SelectItem value="Community">Community Development</SelectItem>
                            <SelectItem value="Disaster Relief">Disaster Relief</SelectItem>
                            <SelectItem value="Animal Welfare">Animal Welfare</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="impactArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Impact Area *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Global health, Education access, Climate change" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of what this organization does and their mission..."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why do you believe in this organization? *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us why you think this nonprofit should be in our directory. What impact have they made that inspires you?"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowSuggestionDialog(false)}
                      disabled={suggestionMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={suggestionMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {suggestionMutation.isPending ? "Submitting..." : "Submit Suggestion"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Results */}
      <div className="mb-6">
        <p className="text-gray-600 text-center">
          Showing {filteredNonprofits.length} verified organizations
        </p>
      </div>

      {/* Nonprofits Grid */}
      {filteredNonprofits.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNonprofits.map((nonprofit: Nonprofit) => (
            <Card key={nonprofit.id} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg leading-tight">{nonprofit.name}</CardTitle>
                      {nonprofit.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm">
                      {nonprofit.category} • {nonprofit.focus}
                    </CardDescription>
                  </div>
                  <ThumbsUpWithPurposeHub
                    item={{
                      id: nonprofit.id,
                      name: nonprofit.name,
                      description: nonprofit.description,
                      category: nonprofit.category
                    }}
                    sourceType="nonprofit"
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {nonprofit.description}
                </p>
                
                <div className="flex items-center justify-between">
                  {getRatingStars(nonprofit.rating)}
                  {nonprofit.website && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(nonprofit.website, '_blank')}
                      className="h-8"
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      Visit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No nonprofits found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or category filter
          </p>
        </div>
      )}
    </div>
  );
}