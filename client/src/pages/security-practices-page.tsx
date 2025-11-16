import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { Layout } from '@/components/layout/layout';

import { 
  Shield, 
  Lock, 
  Key, 
  Fingerprint, 
  Globe, 
  User, 
  Settings, 
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Home
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SecurityPracticesPage = () => {
  return (
    <Layout>
        <div className="container max-w-4xl mx-auto py-6">
          <Helmet>
            <title>Security Best Practices | HyperDAG</title>
            <meta name="description" content="Best practices for maximizing anonymity and security on HyperDAG" />
          </Helmet>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4 text-primary">Security Best Practices</h1>
            <p className="text-xl text-muted-foreground">
              Guidelines to protect your identity while using HyperDAG
            </p>
          </div>

          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span>Introduction</span>
              </CardTitle>
              <CardDescription>
                Ensuring your privacy and anonymity on HyperDAG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                To ensure your privacy and anonymity on HyperDAG, follow these best practices. These guidelines are designed 
                to protect your identity while using non-unique aliases, Single Sign-On (SSO), Soulbound Tokens (SBTs), 
                and other platform features. By combining technical tools, cautious behavior, and platform-specific strategies, 
                you can engage securely in HyperDAG's decentralized ecosystem.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <span>Network Security Tools</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mt-2">
                    <h3 className="font-semibold">Use a Reputable Virtual Private Network (VPN)</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Choose a no-logs VPN provider (e.g., Mullvad, ProtonVPN, or NordVPN) to mask your IP address and location.</li>
                      <li>Avoid free VPNs, as they may log or sell your data.</li>
                      <li>Rotate VPN servers periodically to prevent correlation attacks.</li>
                    </ul>
                    
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                      <p className="font-semibold text-blue-700 dark:text-blue-300">HyperDAG Tip:</p>
                      <p className="text-blue-600 dark:text-blue-400">Ensure your VPN is active before accessing HyperDAG, especially when using SSO with social media accounts, to prevent your real IP from being exposed to third-party providers.</p>
                    </div>
                    
                    <h3 className="font-semibold mt-4">Route Traffic Through Tor or I2P</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>For maximum anonymity, access HyperDAG via the Tor Browser or an Invisible Internet Project (I2P) network.</li>
                      <li>Be aware that Tor may slow down interactions, especially for SBT transactions or real-time features.</li>
                    </ul>
                    
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                      <p className="font-semibold text-blue-700 dark:text-blue-300">HyperDAG Tip:</p>
                      <p className="text-blue-600 dark:text-blue-400">If HyperDAG supports a .onion or I2P address, use it to access the platform directly through these networks.</p>
                    </div>
                    
                    <h3 className="font-semibold mt-4">Use a Dedicated Device or Virtual Machine</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Access HyperDAG from a device or virtual machine (VM) reserved for anonymous activities to avoid cross-contamination.</li>
                      <li>Use privacy-focused operating systems like Tails or Qubes OS for enhanced security.</li>
                    </ul>
                    
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                      <p className="font-semibold text-blue-700 dark:text-blue-300">HyperDAG Tip:</p>
                      <p className="text-blue-600 dark:text-blue-400">Reset your VM or clear browser data after each session to prevent residual tracking (e.g., cookies or cached SSO tokens).</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-green-500" />
                    <span>Authentication Security</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mt-2">
                    <h3 className="font-semibold">Enable Four-Factor Authentication (4FA)</h3>
                    <p>HyperDAG supports multi-factor authentication (MFA) beyond standard 2FA. Use a combination of:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Something you know:</strong> A strong, unique password (at least 16 characters, randomly generated).</li>
                      <li><strong>Something you have:</strong> A hardware security key (e.g., YubiKey) or authenticator app (e.g., Aegis).</li>
                      <li><strong>Something you are:</strong> Biometric verification (if supported, use cautiously).</li>
                      <li><strong>Somewhere you are:</strong> Location-based verification (e.g., via a trusted device's geofencing).</li>
                      <li>Store recovery codes in an encrypted, offline location (e.g., a USB drive in a safe).</li>
                    </ul>
                    
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md">
                      <p className="font-semibold text-green-700 dark:text-green-300">HyperDAG Tip:</p>
                      <p className="text-green-600 dark:text-green-400">If using SSO (e.g., Google, Twitter/X, or MetaMask), ensure the linked account also has strong MFA enabled to prevent unauthorized access.</p>
                    </div>
                    
                    <h3 className="font-semibold mt-4">Use a Decentralized Wallet for SSO</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Prefer Web3 wallets (e.g., MetaMask, WalletConnect) for SSO over social media accounts.</li>
                      <li>Secure your wallet with a hardware device (e.g., Ledger, Trezor) and never share your seed phrase.</li>
                    </ul>
                    
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md">
                      <p className="font-semibold text-green-700 dark:text-green-300">HyperDAG Tip:</p>
                      <p className="text-green-600 dark:text-green-400">Link your SBT to a dedicated wallet address used only for HyperDAG to avoid linking it to other blockchain activities.</p>
                    </div>
                    
                    <h3 className="font-semibold mt-4">Avoid Reusing Passwords or Identifiers</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Use a unique password and identifier for HyperDAG, distinct from other platforms.</li>
                      <li>Use a password manager (e.g., Bitwarden, 1Password) to generate and store credentials securely.</li>
                    </ul>
                    
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md">
                      <p className="font-semibold text-green-700 dark:text-green-300">HyperDAG Tip:</p>
                      <p className="text-green-600 dark:text-green-400">If HyperDAG allows you to unlink SSO after signup, do so and switch to a platform-specific key or password to reduce dependency on external accounts.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-500" />
                    <span>Protecting Your Alias and Persona</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mt-2">
                    <h3 className="font-semibold">Choose a Generic or Common Alias</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Select a non-unique alias that blends in (e.g., "Ghost," "Echo") rather than something distinctive.</li>
                      <li>Avoid aliases that match your usernames on other platforms or reflect personal interests that could be traced.</li>
                    </ul>
                    
                    <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-md">
                      <p className="font-semibold text-purple-700 dark:text-purple-300">HyperDAG Tip:</p>
                      <p className="text-purple-600 dark:text-purple-400">Use HyperDAG's flair or customization options to differentiate your alias without making it unique or traceable.</p>
                    </div>
                    
                    <h3 className="font-semibold mt-4">Never Reveal Personal Information</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Avoid sharing identifiable details (e.g., name, location, job, or specific life events) while logged in as your alias.</li>
                      <li>Be cautious with seemingly harmless details that can be correlated to de-anonymize you.</li>
                    </ul>
                    
                    <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-md">
                      <p className="font-semibold text-purple-700 dark:text-purple-300">HyperDAG Tip:</p>
                      <p className="text-purple-600 dark:text-purple-400">If HyperDAG supports private groups, reserve personal discussions for those spaces and verify group members' SBT credentials before sharing.</p>
                    </div>
                    
                    <h3 className="font-semibold mt-4">Avoid Claiming Real-World Identities</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Don't claim to be a specific person or link your alias to your real-world identity unless intentionally de-anonymizing.</li>
                      <li>Be skeptical of others claiming specific identities, as they may be impersonators.</li>
                    </ul>
                    
                    <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-md">
                      <p className="font-semibold text-purple-700 dark:text-purple-300">HyperDAG Tip:</p>
                      <p className="text-purple-600 dark:text-purple-400">Use SBT-based zero-knowledge proofs (ZKPs) to prove credentials without revealing your alias or identity.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-yellow-500" />
                    <span>Soulbound Token (SBT) Security</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mt-2">
                    <h3 className="font-semibold">Secure Your SBT Wallet</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Store your SBT in a dedicated crypto wallet used only for HyperDAG.</li>
                      <li>Back up your wallet's seed phrase offline and never store it digitally.</li>
                    </ul>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-md">
                      <p className="font-semibold text-yellow-700 dark:text-yellow-300">HyperDAG Tip:</p>
                      <p className="text-yellow-600 dark:text-yellow-400">If HyperDAG offers server-side SBT management for non-crypto users, enable 4FA and regularly audit access logs.</p>
                    </div>
                    
                    <h3 className="font-semibold mt-4">Control SBT Metadata Sharing</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Only share SBT attributes when necessary, using ZKPs to prove specific claims without revealing raw data.</li>
                      <li>Review what metadata your SBT collects and opt out of non-essential tracking if possible.</li>
                    </ul>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-md">
                      <p className="font-semibold text-yellow-700 dark:text-yellow-300">HyperDAG Tip:</p>
                      <p className="text-yellow-600 dark:text-yellow-400">Use HyperDAG's "Share Attribute" feature to generate ZKPs for specific contexts (e.g., proving "active for 6+ months" to join a group).</p>
                    </div>
                    
                    <h3 className="font-semibold mt-4">Regenerate or Burn SBTs if Compromised</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>If you suspect your SBT is linked to your real identity, use HyperDAG's tools to burn or regenerate your SBT.</li>
                      <li>Create a new alias and wallet for the new SBT to start fresh.</li>
                    </ul>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-md">
                      <p className="font-semibold text-yellow-700 dark:text-yellow-300">HyperDAG Tip:</p>
                      <p className="text-yellow-600 dark:text-yellow-400">Regularly check HyperDAG's transparency reports for updates on SBT security or potential vulnerabilities.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-red-500" />
                    <span>SSO and Social Media Integration</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mt-2">
                    <h3 className="font-semibold">Minimize SSO Usage</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Prefer decentralized SSO (e.g., Sign-in with Ethereum) over social media accounts.</li>
                      <li>If using social media SSO, create a dedicated, pseudonymous account for HyperDAG.</li>
                    </ul>
                    
                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-md">
                      <p className="font-semibold text-red-700 dark:text-red-300">HyperDAG Tip:</p>
                      <p className="text-red-600 dark:text-red-400">Unlink SSO accounts after signup if HyperDAG allows, switching to a platform-specific key or wallet-based login.</p>
                    </div>
                    
                    <h3 className="font-semibold mt-4">Manage Connection Permissions</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Regularly audit what permissions you've granted to HyperDAG from connected accounts.</li>
                      <li>Revoke unnecessary permissions or access tokens when not needed.</li>
                    </ul>
                    
                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-md">
                      <p className="font-semibold text-red-700 dark:text-red-300">HyperDAG Tip:</p>
                      <p className="text-red-600 dark:text-red-400">Use HyperDAG's "Connection Management" feature to review all connected accounts and their permission settings.</p>
                    </div>
                    
                    <h3 className="font-semibold mt-4">Use Separate Email Addresses</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Create a dedicated email address for HyperDAG registration that isn't linked to your real identity.</li>
                      <li>Consider using email aliasing services (e.g., SimpleLogin, AnonAddy) for additional protection.</li>
                    </ul>
                    
                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-md">
                      <p className="font-semibold text-red-700 dark:text-red-300">HyperDAG Tip:</p>
                      <p className="text-red-600 dark:text-red-400">Check if HyperDAG supports decentralized email integration (e.g., ENS/Unstoppable Domains email) for enhanced privacy.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-10 flex flex-col items-center">
            <div className="bg-yellow-50 dark:bg-yellow-950 p-6 rounded-md mb-8 w-full">
              <h3 className="text-xl font-bold mb-3 text-yellow-700 dark:text-yellow-300 flex items-center">
                <Shield className="mr-2 h-6 w-6" />
                Remember
              </h3>
              <p className="text-yellow-600 dark:text-yellow-400">
                No anonymity system is perfect. Use a layered approach combining multiple methods for best protection. 
                Even with all precautions, be mindful that correlation attacks and metadata analysis can still potentially 
                link your activities over time.
              </p>
            </div>
            
            <div className="flex gap-4 flex-wrap justify-center">
              <Link href="/settings" className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Privacy Settings</span>
              </Link>
              <Link href="/documentation" className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Documentation</span>
              </Link>
              <Link href="/support" className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Support Center</span>
              </Link>
            </div>
          </div>
        </div>
    </Layout>
  );
}

export default SecurityPracticesPage;