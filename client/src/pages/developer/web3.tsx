import React from 'react';
import { Link } from 'wouter';
import { Layout } from '@/components/layout/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Database, 
  HardDrive, 
  Server, 
  Cpu, 
  Code, 
  FileCode, 
  Video, 
  BarChart 
} from 'lucide-react';

export default function Web3IntegrationPage() {
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Web3 Integration</h1>
          <p className="text-gray-500 mb-4">Connect your applications with decentralized storage and compute resources</p>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" /> IPFS Storage
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Database className="h-3 w-3" /> W3 Provider
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Server className="h-3 w-3" /> Bacalhau Compute
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Cpu className="h-3 w-3" /> Decentralized
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Decentralized Storage Card */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                Decentralized Storage
              </CardTitle>
              <CardDescription>
                Store files and data on IPFS and W3.Storage with content-addressed immutability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">IPFS Integration</h3>
                  <p className="text-sm text-gray-600">
                    InterPlanetary File System (IPFS) is a protocol designed to create a content-addressable, 
                    peer-to-peer method of storing and sharing data in a distributed file system.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">W3.Storage</h3>
                  <p className="text-sm text-gray-600">
                    W3.Storage provides simple APIs to store and retrieve data, backed by 
                    the Filecoin network for long-term persistence.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md border">
                  <h4 className="text-sm font-medium mb-2">Key Benefits</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="bg-green-100 text-green-700 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                      <span>Content-addressed storage with data integrity verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-green-100 text-green-700 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                      <span>Distributed storage across global network of nodes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-green-100 text-green-700 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                      <span>Data persistence with Filecoin integration</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/ipfs-explorer">
                  Explore IPFS Storage
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Bacalhau Compute Card */}
          <Card className="h-full border-blue-100">
            <CardHeader className="bg-blue-50/50 rounded-t-lg">
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-blue-500" />
                  Bacalhau Compute
                </CardTitle>
                <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                  Featured
                </Badge>
              </div>
              <CardDescription>
                Run distributed computation tasks across the decentralized Bacalhau network
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Bacalhau is a distributed compute network that allows you to run containerized 
                  jobs directly on data where it's stored, integrated with IPFS for seamless 
                  data access and results storage.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-md border flex items-start">
                    <Code className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Custom Jobs</h4>
                      <p className="text-xs text-gray-500">Run any Docker container with custom commands</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md border flex items-start">
                    <FileCode className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">ML Inference</h4>
                      <p className="text-xs text-gray-500">Run inference on ML models with your data</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md border flex items-start">
                    <Video className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Video Processing</h4>
                      <p className="text-xs text-gray-500">Process video files with FFmpeg</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md border flex items-start">
                    <BarChart className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Data Analysis</h4>
                      <p className="text-xs text-gray-500">Run Python analysis on datasets</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                  <h4 className="text-sm font-medium mb-2">Why Decentralized Compute?</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                      <span>Data locality - compute happens where data is stored</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                      <span>Scalable resources with distributed nodes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                      <span>Reduced centralization risks and single points of failure</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link to="/bacalhau-page">
                  Access Distributed Compute
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Integration Examples */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Integration Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Store & Compute</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Upload data to IPFS, then run Bacalhau compute jobs to process it without downloading.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ML Model Serving</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Store ML models on IPFS and use Bacalhau for on-demand inference without provisioning servers.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Data Pipelines</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Create end-to-end data pipelines with IPFS storage and Bacalhau compute for ETL workflows.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Documentation Section */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Documentation & Resources</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">IPFS & W3.Storage</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-blue-600 hover:underline text-sm flex items-center">
                    <ArrowRight className="h-3 w-3 mr-1" /> IPFS Integration Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:underline text-sm flex items-center">
                    <ArrowRight className="h-3 w-3 mr-1" /> W3.Storage API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:underline text-sm flex items-center">
                    <ArrowRight className="h-3 w-3 mr-1" /> Content Addressing Explained
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Bacalhau Compute</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-blue-600 hover:underline text-sm flex items-center">
                    <ArrowRight className="h-3 w-3 mr-1" /> Getting Started with Bacalhau
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:underline text-sm flex items-center">
                    <ArrowRight className="h-3 w-3 mr-1" /> Job Specification Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:underline text-sm flex items-center">
                    <ArrowRight className="h-3 w-3 mr-1" /> Advanced Compute Example Projects
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}