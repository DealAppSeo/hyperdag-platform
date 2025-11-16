import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, ShieldCheck, MessageCircle, ThumbsUp, RefreshCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface ForumPost {
  id: string;
  content: string;
  timestamp: string;
  anonymous: boolean;
  author: string;
  verifiedReputation: boolean;
  likes?: number;
  replies?: number;
}

const IntegratedForumPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reputationThreshold, setReputationThreshold] = useState(10);
  const [integrationStatus, setIntegrationStatus] = useState<{
    connected: boolean;
    partnerName?: string;
    expires?: string;
  }>({
    connected: false
  });

  // Fetch integration status and forum posts on component mount
  useEffect(() => {
    checkIntegrationStatus();
    fetchForumPosts();
  }, []);

  // Check if we have a connection to lovable.dev
  const checkIntegrationStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/external/lovable/status');
      const data = await response.json();
      
      if (data.success) {
        setIntegrationStatus({
          connected: true,
          partnerName: 'lovable.dev',
          expires: new Date(data.data.expires).toLocaleString()
        });
      } else {
        setIntegrationStatus({ connected: false });
      }
    } catch (error) {
      console.error('Error checking integration status:', error);
      setIntegrationStatus({ connected: false });
    }
  };

  // Fetch forum posts from both systems
  const fetchForumPosts = async () => {
    setIsFetchingPosts(true);
    
    try {
      // First fetch HyperDAG forum posts
      const localPostsResponse = await apiRequest('GET', '/api/forum/posts');
      const localData = await localPostsResponse.json();
      
      let allPosts = localData.posts || [];
      
      // If integration is active, also fetch posts from lovable.dev
      if (integrationStatus.connected) {
        const externalPostsResponse = await apiRequest('GET', '/api/external/lovable/forum/posts');
        const externalData = await externalPostsResponse.json();
        
        if (externalData.success && externalData.data.posts) {
          // Merge the posts, marking external ones
          const externalPosts = externalData.data.posts.map((post: ForumPost) => ({
            ...post,
            source: 'lovable.dev'
          }));
          
          allPosts = [...allPosts, ...externalPosts];
        }
      }
      
      // Sort posts by timestamp
      allPosts.sort((a: ForumPost, b: ForumPost) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setPosts(allPosts);
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch forum posts. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsFetchingPosts(false);
    }
  };

  // Submit a new forum post
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to post on the forum',
        variant: 'destructive'
      });
      return;
    }
    
    if (!newPostContent.trim()) {
      toast({
        title: 'Empty post',
        description: 'Please enter some content for your post',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate a ZKP if posting anonymously
      let reputationProof = null;
      
      if (isAnonymous) {
        const proofResponse = await apiRequest('POST', '/api/zkp/generate-proof', {
          type: 'reputation',
          threshold: reputationThreshold
        });
        
        const proofData = await proofResponse.json();
        
        if (proofData.success) {
          reputationProof = proofData.proof;
        } else {
          toast({
            title: 'Verification failed',
            description: `Your reputation score doesn't meet the threshold of ${reputationThreshold}`,
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }
      }
      
      // Create forum post
      const postResponse = await apiRequest('POST', '/api/forum/post', {
        content: newPostContent,
        anonymous: isAnonymous,
        reputationProof,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      
      const postData = await postResponse.json();
      
      if (postData.success) {
        toast({
          title: 'Post created',
          description: 'Your forum post has been published successfully'
        });
        
        setNewPostContent('');
        fetchForumPosts(); // Refresh the post list
      } else {
        toast({
          title: 'Error',
          description: postData.error || 'Failed to create post',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render a single forum post
  const renderPost = (post: ForumPost) => {
    const postDate = new Date(post.timestamp);
    const isExternalPost = 'source' in post;
    
    return (
      <Card key={post.id} className={`mb-4 ${isExternalPost ? 'border-blue-200' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {post.anonymous ? (
                <Avatar>
                  <AvatarFallback>AN</AvatarFallback>
                </Avatar>
              ) : (
                <Avatar>
                  <AvatarImage src={`/api/user/${post.author}/avatar`} />
                  <AvatarFallback>{post.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              
              <div>
                <div className="font-medium">
                  {post.anonymous ? 'Anonymous' : post.author}
                  {post.verifiedReputation && (
                    <Badge variant="outline" className="ml-2 bg-green-50">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {postDate.toLocaleString()}
                  {isExternalPost && (
                    <Badge variant="outline" className="ml-2 bg-blue-50">
                      External
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="whitespace-pre-line">{post.content}</p>
        </CardContent>
        
        <CardFooter className="pt-2 flex justify-between">
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ThumbsUp className="h-4 w-4 mr-1" />
              {post.likes || 0}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <MessageCircle className="h-4 w-4 mr-1" />
              {post.replies || 0}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integrated ZKP Forum</h1>
        <p className="text-muted-foreground mb-4">
          Share your thoughts privately or publicly with our zero-knowledge proof reputation system.
        </p>
        
        {/* Integration status */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  {integrationStatus.connected ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700">Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700">Disconnected</Badge>
                  )}
                </p>
                {integrationStatus.connected && (
                  <>
                    <p><span className="font-medium">Partner:</span> {integrationStatus.partnerName}</p>
                    <p><span className="font-medium">Expires:</span> {integrationStatus.expires}</p>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={checkIntegrationStatus}
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Post creation form */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Create a New Post</CardTitle>
            <CardDescription>Share your thoughts with the community</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmitPost}>
              <div className="space-y-4">
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[120px]"
                  required
                />
                
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        <SelectItem value="blockchain">Blockchain</SelectItem>
                        <SelectItem value="privacy">Privacy</SelectItem>
                        <SelectItem value="zkp">Zero Knowledge Proofs</SelectItem>
                        <SelectItem value="ai">Artificial Intelligence</SelectItem>
                        <SelectItem value="web3">Web3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">Reputation Threshold</label>
                    <Select 
                      value={reputationThreshold.toString()} 
                      onValueChange={(val) => setReputationThreshold(parseInt(val))}
                      disabled={!isAnonymous}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Minimum reputation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 (Low)</SelectItem>
                        <SelectItem value="10">10 (Medium)</SelectItem>
                        <SelectItem value="20">20 (High)</SelectItem>
                        <SelectItem value="50">50 (Expert)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="anonymous-mode"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                  <label
                    htmlFor="anonymous-mode"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Post anonymously with verified reputation
                  </label>
                </div>
                
                {isAnonymous && (
                  <div className="bg-amber-50 p-3 rounded-md text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-amber-500" />
                      <span className="font-medium">Private Posting Mode</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      Your identity will be hidden, but others will see that you have at least {reputationThreshold} reputation points without revealing your exact score.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Forum posts */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Forum Posts</h2>
            <Button
              variant="outline"
              onClick={fetchForumPosts}
              disabled={isFetchingPosts}
            >
              {isFetchingPosts ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="verified">Verified Only</TabsTrigger>
              <TabsTrigger value="local">Local Only</TabsTrigger>
              <TabsTrigger value="external">External Only</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {posts.length > 0 ? (
                posts.map(renderPost)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No posts yet. Be the first to share your thoughts!
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="verified">
              {posts.filter(post => post.verifiedReputation).length > 0 ? (
                posts
                  .filter(post => post.verifiedReputation)
                  .map(renderPost)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No verified posts found. Create a post with verification enabled!
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="local">
              {posts.filter(post => !('source' in post)).length > 0 ? (
                posts
                  .filter(post => !('source' in post))
                  .map(renderPost)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No local posts found. Be the first to share your thoughts!
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="external">
              {posts.filter(post => 'source' in post).length > 0 ? (
                posts
                  .filter(post => 'source' in post)
                  .map(renderPost)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No external posts found. Connect to lovable.dev to see integrated posts!
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default IntegratedForumPage;