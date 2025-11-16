import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Users, Github, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function GitHubCollaboration() {
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/github-collaboration/test-connection');
      setConnectionStatus('connected');
      setResults(response);
      toast({
        title: 'Connection Successful',
        description: 'GitHub API is working properly',
      });
    } catch (error) {
      setConnectionStatus('error');
      setResults(error);
      toast({
        title: 'Connection Failed',
        description: 'Check GitHub token configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadCompetitivePackage = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/github-collaboration/upload-competitive-package', {
        method: 'POST',
      });
      
      setResults(response);
      toast({
        title: 'Upload Complete',
        description: `Uploaded ${(response as any).uploaded || 0} files successfully`,
      });
    } catch (error) {
      setResults(error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload competitive package',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const taskData = {
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      assignee: formData.get('assignee'),
      dueDate: formData.get('dueDate'),
    };

    try {
      const response = await apiRequest('/api/github-collaboration/create-task', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });
      
      setResults(response);
      toast({
        title: 'Task Created',
        description: `Task uploaded to ${(response as any).taskFile}`,
      });
      
      // Reset form
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      setResults(error);
      toast({
        title: 'Task Creation Failed',
        description: 'Failed to create task file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadTextFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const fileData = {
      filePath: formData.get('filePath'),
      content: formData.get('content'),
      message: formData.get('message') || 'Upload file via Trinity Symphony',
    };

    try {
      const response = await apiRequest('/api/github-collaboration/upload-file', {
        method: 'POST',
        body: JSON.stringify(fileData),
      });
      
      setResults(response);
      toast({
        title: 'File Uploaded',
        description: `File uploaded successfully to ${fileData.filePath}`,
      });
      
      // Reset form
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      setResults(error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createGist = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const gistData = {
      files: [{
        name: formData.get('fileName'),
        content: formData.get('content'),
      }],
      description: formData.get('description'),
      isPublic: formData.get('isPublic') === 'on',
    };

    try {
      const response = await apiRequest('/api/github-collaboration/create-gist', {
        method: 'POST',
        body: JSON.stringify(gistData),
      });
      
      setResults(response);
      toast({
        title: 'Gist Created',
        description: 'Gist created successfully',
      });
      
      // Reset form
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      setResults(error);
      toast({
        title: 'Gist Creation Failed',
        description: 'Failed to create gist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          GitHub Collaboration System
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Share files and collaborate with other agents using GitHub repositories and gists. 
          No Google Cloud complexity required.
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={testConnection} disabled={loading}>
              Test GitHub Connection
            </Button>
            
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Connected
              </div>
            )}
            
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                Connection Failed
              </div>
            )}
          </div>
          
          {connectionStatus === 'error' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure GITHUB_TOKEN is set in your Replit secrets. 
                Generate one at: GitHub Settings → Developer settings → Personal access tokens
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="competitive" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="competitive">Competitive Package</TabsTrigger>
          <TabsTrigger value="tasks">Create Tasks</TabsTrigger>
          <TabsTrigger value="files">Upload Files</TabsTrigger>
          <TabsTrigger value="gists">Quick Share</TabsTrigger>
        </TabsList>

        {/* Competitive Package Upload */}
        <TabsContent value="competitive">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Competitive Package
              </CardTitle>
              <CardDescription>
                Upload the Trinity Symphony competitive files to GitHub repository
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={uploadCompetitivePackage} 
                disabled={loading || connectionStatus !== 'connected'}
                className="w-full"
              >
                Upload Competitive Package
              </Button>
              
              <Alert>
                <AlertDescription>
                  This will upload all files from 'hyperdagmanager_competitive_final_2025-08-07' 
                  directory to your GitHub repository.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Creation */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Create Collaboration Task
              </CardTitle>
              <CardDescription>
                Create task files that other agents can access and respond to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createTask} className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="e.g., Analyze market research data"
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Detailed task description..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Input 
                      id="priority" 
                      name="priority" 
                      placeholder="High, Medium, Low"
                      defaultValue="Medium"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="assignee">Assignee</Label>
                    <Input 
                      id="assignee" 
                      name="assignee" 
                      placeholder="Agent or team member"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input 
                    id="dueDate" 
                    name="dueDate" 
                    type="date"
                  />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full">
                  Create Task
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Upload */}
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Text File
              </CardTitle>
              <CardDescription>
                Upload documents, scripts, or any text content to the repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={uploadTextFile} className="space-y-4">
                <div>
                  <Label htmlFor="filePath">File Path</Label>
                  <Input 
                    id="filePath" 
                    name="filePath" 
                    placeholder="e.g., documents/report.md or scripts/analysis.py"
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">File Content</Label>
                  <Textarea 
                    id="content" 
                    name="content" 
                    placeholder="Enter file content here..."
                    rows={8}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Commit Message</Label>
                  <Input 
                    id="message" 
                    name="message" 
                    placeholder="Describe what you're uploading"
                  />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full">
                  Upload File
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gist Creation */}
        <TabsContent value="gists">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Create Quick Share Gist
              </CardTitle>
              <CardDescription>
                Create GitHub gists for quick file sharing and embedding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createGist} className="space-y-4">
                <div>
                  <Label htmlFor="fileName">File Name</Label>
                  <Input 
                    id="fileName" 
                    name="fileName" 
                    placeholder="e.g., analysis_results.md"
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Gist Description</Label>
                  <Input 
                    id="description" 
                    name="description" 
                    placeholder="Brief description of the gist"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea 
                    id="content" 
                    name="content" 
                    placeholder="File content..."
                    rows={6}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isPublic" 
                    name="isPublic"
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isPublic">Make public (discoverable)</Label>
                </div>
                
                <Button type="submit" disabled={loading} className="w-full">
                  Create Gist
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Display */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}