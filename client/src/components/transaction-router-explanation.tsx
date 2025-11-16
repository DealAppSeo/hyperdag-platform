import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, Shield, Cpu, Zap, DollarSign, Lock, Database } from 'lucide-react';

const TransactionRouterExplanation: React.FC = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <InfoIcon className="h-4 w-4" /> How Intelligent Routing Works
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>HyperDAG Intelligent Transaction Routing</SheetTitle>
          <SheetDescription>
            Understanding how HyperDAG chooses the optimal network for your transactions
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4 mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Zap className="mr-2 h-5 w-5 text-yellow-500" />
                What is Intelligent Transaction Routing?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                HyperDAG's intelligent transaction routing system automatically selects the optimal blockchain or DAG network for each transaction based on your specific needs and current network conditions.
              </p>
              <p className="mt-2">
                Instead of manually choosing where your transaction should run, our AI-powered system handles this complexity for you, saving time, costs, and maximizing efficiency.
              </p>
            </CardContent>
          </Card>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="how-it-works">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center">
                  <Cpu className="mr-2 h-5 w-5 text-indigo-500" />
                  How It Works
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm space-y-3">
                <p>When you initiate a transaction, our system:</p>
                <ol className="list-decimal ml-5 space-y-2">
                  <li>Analyzes your transaction requirements (speed, cost, privacy, data size)</li>
                  <li>Checks real-time status of all supported networks</li>
                  <li>Uses AI to determine the optimal network</li>
                  <li>Routes your transaction seamlessly</li>
                  <li>Monitors confirmation and reports back</li>
                </ol>
                <p className="text-muted-foreground mt-2">
                  All of this happens within milliseconds, requiring no additional input from you.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="benefits">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-green-500" />
                  Benefits of Intelligent Routing
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-green-50">Cost Savings</Badge>
                  <p>Reduce transaction fees by up to 65%</p>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-blue-50">Time Efficiency</Badge>
                  <p>Faster confirmations by selecting optimal networks</p>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-purple-50">Privacy Control</Badge>
                  <p>Enhanced privacy through Zero-Knowledge networks when needed</p>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-amber-50">Reliability</Badge>
                  <p>Avoid congested networks automatically</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-50">Simplicity</Badge>
                  <p>No need to understand complex blockchain details</p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="transaction-types">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-orange-500" />
                  Transaction Types and Optimization
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm space-y-3">
                <p>Different transactions have different requirements. Our system optimizes for:</p>
                
                <div className="grid gap-2">
                  <div className="border rounded-md p-2">
                    <h4 className="font-medium">Payments</h4>
                    <p className="text-xs text-muted-foreground">Optimized for speed and security, typically routed to fast networks like Solana or Polygon zkEVM.</p>
                  </div>
                  
                  <div className="border rounded-md p-2">
                    <h4 className="font-medium">Data Storage</h4>
                    <p className="text-xs text-muted-foreground">Optimized for cost and capacity, often routed to specialized storage networks.</p>
                  </div>
                  
                  <div className="border rounded-md p-2">
                    <h4 className="font-medium">Smart Contracts</h4>
                    <p className="text-xs text-muted-foreground">Balanced for reliability and functionality, typically routed to Polygon zkEVM or Ethereum L2s.</p>
                  </div>
                  
                  <div className="border rounded-md p-2">
                    <h4 className="font-medium">Identity & Verification</h4>
                    <p className="text-xs text-muted-foreground">Prioritizes privacy and security, routed to networks with strong ZK capabilities.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="privacy">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-blue-500" />
                  Privacy Protection
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm">
                <p>
                  HyperDAG was designed with privacy at its core. Our transaction router works seamlessly with our Zero-Knowledge Proof infrastructure to ensure:
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Your personal information remains under your control</li>
                  <li>Only proofs (not the underlying data) are sent to the blockchain</li>
                  <li>You decide what information to share, when, and with whom</li>
                  <li>Privacy-sensitive transactions are routed to specialized networks</li>
                  <li>You maintain complete control over your digital identity</li>
                </ul>
                <div className="mt-3 p-2 bg-blue-50 rounded-md">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 text-blue-500 mr-1.5" />
                    <span className="text-xs font-medium">Privacy First Philosophy</span>
                  </div>
                  <p className="text-xs mt-1">
                    Unlike traditional systems that collect your data, HyperDAG lets you selectively share only what you choose, protected by cryptographic proofs.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Want to learn more about HyperDAG's innovative technology? Check out our{" "}
              <a href="/documentation" className="text-primary hover:underline">
                technical documentation
              </a>
              {" "}or{" "}
              <a href="/about" className="text-primary hover:underline">
                about page
              </a>.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TransactionRouterExplanation;