import { ArrowRight, CheckCircle2, Shield, Users } from "lucide-react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="py-4 sm:py-6">
      <header className="mb-4 sm:mb-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">About HyperDAG</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500">A quantum-resistant, AI-optimized, privacy-first hybrid DAG/blockchain ecosystem</p>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          
          {/* Hero section */}
          <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg px-4 py-16 mb-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                About <span className="text-primary">HyperDAG</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                A quantum-resistant, AI-optimized, privacy-first hybrid DAG/blockchain ecosystem
              </p>
              
              <div className="flex justify-center mb-12">
                <Button asChild>
                  <Link href="/auth">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Mission section */}
          <div className="mb-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-8">
                To revolutionize the Web3 ecosystem by creating a secure, scalable, and user-friendly platform 
                that empowers individuals and organizations to build the decentralized future.
              </p>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Quantum-Resistant Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Built with post-quantum cryptography to ensure your assets remain secure in the quantum computing era.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Community-Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Governed by the community, for the community. Every decision is transparent and democratically made.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Zero-Knowledge Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Maintain complete privacy while proving credentials and identity through advanced ZK-proof technology.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Technology section */}
          <div className="mb-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Technology Stack</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Core Infrastructure</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Hybrid DAG/Blockchain Architecture</li>
                    <li>• IPFS Decentralized Storage</li>
                    <li>• Quantum-Resistant Cryptography</li>
                    <li>• Multi-Provider AI Integration</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Developer Tools</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Comprehensive SDK</li>
                    <li>• RESTful API</li>
                    <li>• Smart Contract Templates</li>
                    <li>• ZK-Proof Toolkit</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="bg-primary/5 rounded-lg p-8 text-center mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Build the Future?</h2>
            <p className="text-gray-600 mb-6">
              Join thousands of developers and organizations already building on HyperDAG.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/developer">Developer Docs</Link>
              </Button>
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-gray-900 text-white rounded-lg p-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Platform</h3>
                  <ul className="space-y-2">
                    <li><Link href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link></li>
                    <li><Link href="/projects" className="text-gray-400 hover:text-white">Projects</Link></li>
                    <li><Link href="/grants" className="text-gray-400 hover:text-white">Grants</Link></li>
                    <li><Link href="/reputation" className="text-gray-400 hover:text-white">Reputation</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Resources</h3>
                  <ul className="space-y-2">
                    <li><Link href="/docs" className="text-gray-400 hover:text-white">Documentation</Link></li>
                    <li><Link href="/support" className="text-gray-400 hover:text-white">Support</Link></li>
                    <li><Link href="/community" className="text-gray-400 hover:text-white">Community</Link></li>
                    <li><span className="text-gray-400 cursor-not-allowed">Blog (Coming Soon)</span></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Company</h3>
                  <ul className="space-y-2">
                    <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                    <li><span className="text-gray-400 cursor-not-allowed">Careers (Coming Soon)</span></li>
                    <li><span className="text-gray-400 cursor-not-allowed">Press (Coming Soon)</span></li>
                    <li><span className="text-gray-400 cursor-not-allowed">Contact (Coming Soon)</span></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Developers</h3>
                  <ul className="space-y-2">
                    <li><Link href="/developer" className="text-gray-400 hover:text-white">Developer Platform</Link></li>
                    <li><Link href="/developer/api-docs" className="text-gray-400 hover:text-white">API Documentation</Link></li>
                    <li><Link href="/developer/sdk-integration" className="text-gray-400 hover:text-white">SDK Integration</Link></li>
                    <li><Link href="/developer/zkp" className="text-gray-400 hover:text-white">ZKP Tools</Link></li>
                    <li><span className="text-gray-400 cursor-not-allowed">GitHub (Coming Soon)</span></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
                <p>© {new Date().getFullYear()} HyperDAG. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}