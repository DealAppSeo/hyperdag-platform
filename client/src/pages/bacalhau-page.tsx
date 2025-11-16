import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Check, Terminal, Cpu, Video, Database, Server } from 'lucide-react';

export default function BacalhauPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('generic');
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState<any>(null);
  
  // Generic job form
  const [genericImage, setGenericImage] = useState('python:3.9');
  const [genericCommand, setGenericCommand] = useState('python -c "print(\'Hello from Bacalhau!\')"; with open(\'/outputs/result.txt\', \'w\') as f: f.write(\'Computation completed!\')"');
  
  // ML inference form
  const [mlModel, setMlModel] = useState('bert-base-uncased');
  const [mlInput, setMlInput] = useState('QmUxD7JpzpGuLy2KX3E9MgQjFrb9zNy1Diw3dLAGTJVCYR');
  
  // Video processing form
  const [videoCid, setVideoCid] = useState('QmUxTdJCsXKe9LfPVLMbJJQKGQd4Xz9yDgxPU2C8TkxrJ8');
  const [videoCommand, setVideoCommand] = useState('-vf "scale=1280:720" -c:v libx264 -crf 23 -preset medium -c:a aac');
  
  // Data analysis form
  const [dataCid, setDataCid] = useState('QmUxD7JpzpGuLy2KX3E9MgQjFrb9zNy1Diw3dLAGTJVCYR');
  const [dataScript, setDataScript] = useState('import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# Load data\ndf = pd.read_csv("/inputs/dataset/data.csv")\n\n# Perform analysis\nresults = df.describe()\n\n# Save results\nresults.to_csv("/outputs/results.csv")\n\n# Create visualization\nplt.figure(figsize=(10,6))\ndf.plot(kind="bar")\nplt.savefig("/outputs/chart.png")');
  
  // Job status query
  const { isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/bacalhau/jobs', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await apiRequest('GET', `/api/bacalhau/jobs/${jobId}`);
      const data = await res.json();
      setJobStatus(data);
      return data;
    },
    enabled: !!jobId,
    refetchInterval: jobId ? 5000 : false, // Poll every 5 seconds if we have a jobId
  });
  
  // Job results query
  const { isLoading: isLoadingResults, refetch: refetchResults } = useQuery({
    queryKey: ['/api/bacalhau/jobs/results', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await apiRequest('GET', `/api/bacalhau/jobs/${jobId}/results`);
      return await res.json();
    },
    enabled: false, // Don't run automatically
  });
  
  // Generic job submission
  const genericSubmitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/bacalhau/jobs', {
        image: genericImage,
        command: genericCommand.split(' '),
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Job submitted',
        description: `Job ID: ${data.jobId}`,
      });
      setJobId(data.jobId);
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // ML inference job submission
  const mlSubmitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/bacalhau/ml/inference', {
        model: mlModel,
        inputData: mlInput,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'ML inference job submitted',
        description: `Job ID: ${data.jobId}`,
      });
      setJobId(data.jobId);
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit ML job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Video processing job submission
  const videoSubmitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/bacalhau/video/process', {
        inputCid: videoCid,
        processingCommand: videoCommand,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Video processing job submitted',
        description: `Job ID: ${data.jobId}`,
      });
      setJobId(data.jobId);
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit video job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Data analysis job submission
  const dataSubmitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/bacalhau/data/analyze', {
        script: dataScript,
        inputCid: dataCid,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Data analysis job submitted',
        description: `Job ID: ${data.jobId}`,
      });
      setJobId(data.jobId);
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit data analysis job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Job cancellation
  const cancelJobMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/bacalhau/jobs/${jobId}/cancel`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Job cancelled',
        description: `Job ${jobId} has been cancelled`,
      });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to cancel job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Bacalhau Distributed Compute</h1>
            <p className="text-gray-500 mt-2">Run compute tasks across a decentralized network</p>
          </div>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <Server className="h-4 w-4" /> Decentralized
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="generic" className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <span className="hidden sm:inline">Custom Job</span>
                </TabsTrigger>
                <TabsTrigger value="ml" className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  <span className="hidden sm:inline">ML Inference</span>
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span className="hidden sm:inline">Video Processing</span>
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">Data Analysis</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="generic">
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Compute Job</CardTitle>
                    <CardDescription>
                      Run a custom Docker container with your own commands
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Docker Image</label>
                      <Input 
                        value={genericImage}
                        onChange={(e) => setGenericImage(e.target.value)}
                        placeholder="python:3.9"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Command</label>
                      <Textarea 
                        value={genericCommand}
                        onChange={(e) => setGenericCommand(e.target.value)}
                        placeholder="Enter your command here"
                        rows={5}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => genericSubmitMutation.mutate()}
                      disabled={genericSubmitMutation.isPending}
                    >
                      {genericSubmitMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Job'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="ml">
                <Card>
                  <CardHeader>
                    <CardTitle>Machine Learning Inference</CardTitle>
                    <CardDescription>
                      Run ML model inference on decentralized compute
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Model Name</label>
                      <Input 
                        value={mlModel}
                        onChange={(e) => setMlModel(e.target.value)}
                        placeholder="bert-base-uncased"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Input Data CID</label>
                      <Input 
                        value={mlInput}
                        onChange={(e) => setMlInput(e.target.value)}
                        placeholder="QmUxD7JpzpGuLy2KX3E9MgQjFrb9zNy1Diw3dLAGTJVCYR"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => mlSubmitMutation.mutate()}
                      disabled={mlSubmitMutation.isPending}
                    >
                      {mlSubmitMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit ML Job'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="video">
                <Card>
                  <CardHeader>
                    <CardTitle>Video Processing</CardTitle>
                    <CardDescription>
                      Process videos using FFmpeg on decentralized compute
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Video CID</label>
                      <Input 
                        value={videoCid}
                        onChange={(e) => setVideoCid(e.target.value)}
                        placeholder="QmUxTdJCsXKe9LfPVLMbJJQKGQd4Xz9yDgxPU2C8TkxrJ8"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">FFmpeg Options</label>
                      <Textarea 
                        value={videoCommand}
                        onChange={(e) => setVideoCommand(e.target.value)}
                        placeholder="Enter FFmpeg options"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => videoSubmitMutation.mutate()}
                      disabled={videoSubmitMutation.isPending}
                    >
                      {videoSubmitMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Process Video'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="data">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Analysis</CardTitle>
                    <CardDescription>
                      Analyze datasets using Python on decentralized compute
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Dataset CID</label>
                      <Input 
                        value={dataCid}
                        onChange={(e) => setDataCid(e.target.value)}
                        placeholder="QmUxD7JpzpGuLy2KX3E9MgQjFrb9zNy1Diw3dLAGTJVCYR"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Python Script</label>
                      <Textarea 
                        value={dataScript}
                        onChange={(e) => setDataScript(e.target.value)}
                        placeholder="import pandas as pd\n..."
                        rows={8}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => dataSubmitMutation.mutate()}
                      disabled={dataSubmitMutation.isPending}
                    >
                      {dataSubmitMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Analyze Data'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Job Status</CardTitle>
                <CardDescription>
                  Monitor and manage your compute jobs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job ID</label>
                  <div className="flex gap-2">
                    <Input 
                      value={jobId}
                      onChange={(e) => setJobId(e.target.value)}
                      placeholder="Enter job ID"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => refetchStatus()}
                      disabled={!jobId || isLoadingStatus}
                    >
                      {isLoadingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                    </Button>
                  </div>
                </div>
                
                {jobStatus && (
                  <>
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Status</span>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(jobStatus.status || 'Unknown')}
                        >
                          {jobStatus.status || 'Unknown'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm mt-4">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <span className="text-gray-500">Created</span>
                          <span>{new Date(jobStatus.created_at).toLocaleString() || 'N/A'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <span className="text-gray-500">Engine</span>
                          <span>{jobStatus.spec?.engine || 'N/A'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-gray-500">Resources</span>
                          <span>
                            {jobStatus.spec?.resources ? (
                              <>
                                CPU: {jobStatus.spec.resources.cpu || 'N/A'}<br />
                                Mem: {jobStatus.spec.resources.memory || 'N/A'}
                              </>
                            ) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => refetchResults()}
                        disabled={isLoadingResults}
                      >
                        {isLoadingResults ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Get Results
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                        onClick={() => cancelJobMutation.mutate()}
                        disabled={cancelJobMutation.isPending}
                      >
                        {cancelJobMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mr-2" />
                        )}
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
                
                {!jobStatus && jobId && (
                  <div className="p-4 text-center text-gray-500">
                    No job data found for this ID
                  </div>
                )}
                
                {!jobId && (
                  <div className="p-4 text-center text-gray-500">
                    Submit a job or enter a job ID to view status
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
