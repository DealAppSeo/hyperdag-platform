import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/layout";
import forumSDK, { HyperDAGForumSDK } from "@/sdk/forum-integration";
import { ForumPost } from "@/sdk/storage/forum-storage-interface";
import { v4 as uuidv4 } from "uuid";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle,
  Save,
  Download,
  RefreshCw,
  Trash2,
  FileCode,
  HardDrive,
  Database,
  Server,
  MessageSquare,
  User,
  Edit,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form schema for creating/editing posts
const postFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  tags: z.string().optional()
});

type PostFormValues = z.infer<typeof postFormSchema>;

export default function ForumStorageDemo() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [syncingData, setSyncingData] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [providers, setProviders] = useState<string[]>([]);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: ""
    }
  });

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
    loadMetrics();
    getAvailableProviders();
  }, []);

  // Load all posts from storage
  const loadPosts = async () => {
    setLoading(true);
    try {
      const allPosts = await forumSDK.getAllPosts();
      setPosts(allPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast({
        title: "Failed to load posts",
        description: "There was an error loading the forum posts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load storage metrics
  const loadMetrics = async () => {
    try {
      const storageMetrics = await forumSDK.getStorageMetrics();
      setMetrics(storageMetrics);
    } catch (error) {
      console.error("Error loading metrics:", error);
    }
  };

  // Get available storage providers
  const getAvailableProviders = () => {
    try {
      const availableProviders = forumSDK.getAvailableProviders();
      setProviders(availableProviders);
    } catch (error) {
      console.error("Error getting available providers:", error);
    }
  };

  // Handle post form submission
  const onSubmit = async (values: PostFormValues) => {
    try {
      if (editing) {
        // Update existing post
        await updatePost(editing, values);
      } else {
        // Create new post
        await createPost(values);
      }

      // Reset form
      form.reset();
      setCreating(false);
      setEditing(null);

      // Reload posts and metrics
      await loadPosts();
      await loadMetrics();
    } catch (error) {
      console.error("Error saving post:", error);
      toast({
        title: "Failed to save post",
        description: "There was an error saving your post.",
        variant: "destructive"
      });
    }
  };

  // Create a new post
  const createPost = async (values: PostFormValues) => {
    const newPost: ForumPost = {
      id: uuidv4(),
      userId: "demo-user-123", // In a real app, this would be the actual user ID
      username: "Demo User",
      title: values.title,
      content: values.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: values.tags ? values.tags.split(",").map(tag => tag.trim()) : [],
      likes: 0,
      views: 0
    };

    await forumSDK.savePost(newPost);

    toast({
      title: "Post created",
      description: "Your post has been created successfully.",
    });
  };

  // Update an existing post
  const updatePost = async (id: string, values: PostFormValues) => {
    const updates: Partial<ForumPost> = {
      title: values.title,
      content: values.content,
      tags: values.tags ? values.tags.split(",").map(tag => tag.trim()) : [],
      updatedAt: new Date().toISOString()
    };

    const updatedPost = await forumSDK.updatePost(id, updates);

    if (!updatedPost) {
      throw new Error("Failed to update post");
    }

    toast({
      title: "Post updated",
      description: "Your post has been updated successfully.",
    });
  };

  // Delete a post
  const deletePost = async (id: string) => {
    try {
      const success = await forumSDK.deletePost(id);

      if (success) {
        toast({
          title: "Post deleted",
          description: "The post has been deleted successfully.",
        });

        // Reload posts and metrics
        await loadPosts();
        await loadMetrics();
      } else {
        throw new Error("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Failed to delete post",
        description: "There was an error deleting the post.",
        variant: "destructive"
      });
    }
  };

  // Start editing a post
  const editPost = (post: ForumPost) => {
    setEditing(post.id);
    setCreating(true);

    form.reset({
      title: post.title,
      content: post.content,
      tags: post.tags.join(", ")
    });
  };

  // Sync data between providers
  const syncData = async () => {
    setSyncingData(true);

    try {
      await forumSDK.syncData();

      toast({
        title: "Data synced",
        description: "Forum data has been synced between all storage providers.",
      });

      // Reload metrics
      await loadMetrics();
    } catch (error) {
      console.error("Error syncing data:", error);
      toast({
        title: "Failed to sync data",
        description: "There was an error syncing the forum data.",
        variant: "destructive"
      });
    } finally {
      setSyncingData(false);
    }
  };

  // Export all data
  const exportData = async () => {
    setExportingData(true);

    try {
      const exportedData = await forumSDK.exportData();

      // Create and download a JSON file
      const blob = new Blob([exportedData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hyperdag-forum-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Forum data has been exported successfully.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Failed to export data",
        description: "There was an error exporting the forum data.",
        variant: "destructive"
      });
    } finally {
      setExportingData(false);
    }
  };

  // Import data
  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target?.result as string;

        try {
          const success = await forumSDK.importData(content);

          if (success) {
            toast({
              title: "Data imported",
              description: "Forum data has been imported successfully.",
            });

            // Reload posts and metrics
            await loadPosts();
            await loadMetrics();
          } else {
            throw new Error("Failed to import data");
          }
        } catch (error) {
          console.error("Error importing data:", error);
          toast({
            title: "Failed to import data",
            description: "There was an error importing the forum data.",
            variant: "destructive"
          });
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error reading file:", error);
      toast({
        title: "Failed to read file",
        description: "There was an error reading the import file.",
        variant: "destructive"
      });
    }

    // Reset the input value to allow importing the same file again
    event.target.value = "";
  };

  // Get storage provider icon
  const getProviderIcon = (type: string) => {
    switch (type) {
      case "local":
        return <HardDrive className="h-4 w-4" />;
      case "ipfs":
        return <Server className="h-4 w-4" />;
      case "database":
        return <Database className="h-4 w-4" />;
      default:
        return <FileCode className="h-4 w-4" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Forum Storage Demo</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Demonstrate HyperDAG's AI-optimized storage architecture for forum data
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={syncData}
              disabled={syncingData}
            >
              {syncingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Data
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={exportData}
              disabled={exportingData}
            >
              {exportingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>

            <div className="relative">
              <Button variant="outline">
                <label className="flex items-center cursor-pointer">
                  <Save className="mr-2 h-4 w-4" />
                  Import
                  <input
                    type="file"
                    className="hidden"
                    accept=".json"
                    onChange={importData}
                  />
                </label>
              </Button>
            </div>

            <Button
              onClick={() => {
                setCreating(true);
                setEditing(null);
                form.reset({
                  title: "",
                  content: "",
                  tags: ""
                });
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="posts">
              <TabsList className="mb-4">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="metrics">Storage Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="posts">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : posts.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Create your first post to test the storage system.
                        </p>
                        <Button onClick={() => setCreating(true)}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create Post
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <Card key={post.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle>{post.title}</CardTitle>
                            <div className="flex space-x-1">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <CardDescription className="flex items-center mt-1">
                            <User className="h-3 w-3 mr-1" />
                            {post.username} • {formatDate(post.createdAt)}
                            {post.updatedAt !== post.createdAt && (
                              <span className="ml-1 text-xs">(edited {formatDate(post.updatedAt)})</span>
                            )}
                          </CardDescription>
                        </CardHeader>

                        <CardContent>
                          <p className={expandedPost === post.id ? "" : "line-clamp-3"}>
                            {post.content}
                          </p>
                          {post.content.length > 200 && (
                            <Button
                              variant="link"
                              className="p-0 h-auto mt-1"
                              onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                            >
                              {expandedPost === post.id ? "Show less" : "Read more"}
                            </Button>
                          )}
                        </CardContent>

                        <CardFooter className="pt-0 flex justify-between">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {post.likes} Likes
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editPost(post)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePost(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="metrics">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(metrics).map(([providerType, providerMetrics]) => (
                    <Card key={providerType}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center">
                          {getProviderIcon(providerType)}
                          <CardTitle className="ml-2 text-lg">
                            {providerMetrics.storageProviderInfo.name}
                          </CardTitle>
                          <Badge
                            className="ml-auto"
                            variant={providerMetrics.storageProviderInfo.status === 'active' ? 'default' : 'outline'}
                          >
                            {providerMetrics.storageProviderInfo.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          Type: {providerMetrics.storageProviderInfo.type}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Total Posts:</span>
                            <span className="font-medium">{providerMetrics.totalPosts}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Storage Used:</span>
                            <span className="font-medium">{(providerMetrics.totalSizeBytes / 1024).toFixed(2)} KB</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Read Operations:</span>
                            <span className="font-medium">{providerMetrics.readOperations}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Write Operations:</span>
                            <span className="font-medium">{providerMetrics.writeOperations}</span>
                          </div>

                          {providerMetrics.lastSyncTimestamp && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Last Sync:</span>
                              <span className="font-medium">{formatDate(providerMetrics.lastSyncTimestamp)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            {creating ? (
              <Card>
                <CardHeader>
                  <CardTitle>{editing ? "Edit Post" : "Create Post"}</CardTitle>
                  <CardDescription>
                    {editing ? "Update your forum post" : "Create a new forum post"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Post title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Write your post content here..."
                                rows={6}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                              <Input placeholder="tag1, tag2, tag3" {...field} />
                            </FormControl>
                            <FormDescription>
                              Separate tags with commas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setCreating(false);
                            setEditing(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>

                        <Button type="submit">
                          {editing ? "Update Post" : "Create Post"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Storage Providers</CardTitle>
                    <CardDescription>
                      HyperDAG's AI-optimized storage system
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {providers.map((provider) => (
                        <div key={provider} className="flex items-center">
                          {getProviderIcon(provider)}
                          <span className="ml-2 font-medium capitalize">
                            {provider} Storage
                          </span>
                          <Badge className="ml-auto" variant="outline">
                            {metrics[provider]?.storageProviderInfo.status || 'unknown'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Settings</CardTitle>
                    <CardDescription>
                      Customize AI-driven storage optimization
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center mb-2">
                          <span className="text-sm font-medium mr-2">Speed Priority</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            defaultValue="40"
                            className="flex-1"
                            onChange={(e) => {
                              // Update optimization settings
                              forumSDK.updateOptimizationSettings({
                                criteria: {
                                  speedWeight: parseInt(e.target.value) / 100
                                }
                              });
                            }}
                          />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Higher values prioritize faster access over other factors
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center mb-2">
                          <span className="text-sm font-medium mr-2">Privacy Priority</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            defaultValue="30"
                            className="flex-1"
                            onChange={(e) => {
                              // Update optimization settings
                              forumSDK.updateOptimizationSettings({
                                criteria: {
                                  privacyWeight: parseInt(e.target.value) / 100
                                }
                              });
                            }}
                          />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Higher values prioritize privacy over other factors
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center mb-2">
                          <span className="text-sm font-medium mr-2">Cost Priority</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            defaultValue="20"
                            className="flex-1"
                            onChange={(e) => {
                              // Update optimization settings
                              forumSDK.updateOptimizationSettings({
                                criteria: {
                                  costWeight: parseInt(e.target.value) / 100
                                }
                              });
                            }}
                          />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Higher values prioritize lower cost over other factors
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center mb-2">
                          <span className="text-sm font-medium mr-2">Persistence Priority</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            defaultValue="10"
                            className="flex-1"
                            onChange={(e) => {
                              // Update optimization settings
                              forumSDK.updateOptimizationSettings({
                                criteria: {
                                  persistenceWeight: parseInt(e.target.value) / 100
                                }
                              });
                            }}
                          />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Higher values prioritize data persistence over other factors
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        <div className="mt-12">
          <Separator className="mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Integration Code for Lovable</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Add this code to your Lovable forum to integrate with HyperDAG's storage system.
              </p>

              <Card>
                <CardContent className="p-4">
                  <pre className="text-xs overflow-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                    {`// Import the HyperDAG Forum SDK
import forumSDK from '@hyperdag/forum-sdk';

// Create a new post
async function createPost(title, content, tags) {
  const newPost = {
    id: generateUniqueId(),
    userId: currentUser.id,
    username: currentUser.username,
    title,
    content,
    tags: tags.split(',').map(tag => tag.trim()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    likes: 0,
    views: 0
  };

  await forumSDK.savePost(newPost);
  return newPost;
}

// Get all posts
async function getAllPosts() {
  return await forumSDK.getAllPosts();
}

// Update a post
async function updatePost(id, updates) {
  return await forumSDK.updatePost(id, updates);
}

// Delete a post
async function deletePost(id) {
  return await forumSDK.deletePost(id);
}

// Export/Import data
async function exportData() {
  const exportedData = await forumSDK.exportData();
  // Download as a file or store as needed
}

async function importData(jsonData) {
  return await forumSDK.importData(jsonData);
}`}
                  </pre>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">About HyperDAG Storage Architecture</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold">AI-Optimized Resource Utilization</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        HyperDAG's storage system automatically selects the optimal storage provider
                        based on factors like speed, cost, privacy, and persistence needs.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold">Multi-Provider Storage</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Data can be stored across multiple providers simultaneously with automatic
                        synchronization, ensuring both availability and redundancy.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold">Privacy-First Design</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Storage solutions prioritize privacy with options for local-only storage,
                        decentralized IPFS storage, and secure database storage.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold">Progressive Enhancement</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Start with simple localStorage and seamlessly upgrade to more powerful
                        storage options as your needs grow, without changing your application code.
                      </p>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Implementation Note</AlertTitle>
                      <AlertDescription>
                        This demo uses localStorage and simulated IPFS storage. In production,
                        HyperDAG provides actual IPFS integration with encryption and database
                        options for enterprise needs.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}