import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function HyperDAGLanding() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEarlyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/early-access/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "You're on the list!",
          description: "We'll send you an API key within 24 hours.",
        });
        setEmail('');
      } else {
        toast({
          title: "Error",
          description: data.error || "Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center border-b border-white/10">
        <div className="text-2xl font-bold text-white">HyperDAG</div>
        <div className="flex items-center gap-3">
          <a href="/docs" className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
            Documentation
          </a>
          <a href="/chat" className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
            AI Chat
          </a>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 text-white border-none" 
            asChild
          >
            <a href="/dev-hub">Developer Portal</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Web3 Without the Wallet Headaches!
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
          Deploy smart contracts in 5 minutes. No gas fees. No faucet hunting.
        </p>
        <p className="text-xl md:text-2xl text-gray-300 mb-8">
          No crying.
        </p>
        
        {/* Email Signup */}
        <form onSubmit={handleEarlyAccess} className="max-w-md mx-auto flex gap-4 mb-8">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            data-testid="input-email-signup"
          />
          <Button 
            type="submit" 
            size="lg" 
            className="bg-purple-600 hover:bg-purple-700"
            disabled={loading}
            data-testid="button-get-api-key"
          >
            {loading ? 'Submitting...' : 'Get API Key'}
          </Button>
        </form>

        <p className="text-sm text-gray-400">
          Free tier: 100 gasless transactions/month • No credit card required
        </p>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-2">Gasless Transactions</h3>
              <p className="text-gray-300">
                We pay the gas. You build. Zero friction blockchain deployment.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-bold text-white mb-2">Privacy-First RepID</h3>
              <p className="text-gray-300">
                Prove reputation without exposing identity. ZKP-powered credentials.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold text-white mb-2">One API, All Chains</h3>
              <p className="text-gray-300">
                Write once. Deploy to Polygon, Ethereum, or any EVM chain.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-6 py-20 text-center">
        <Card className="bg-white/5 border-white/10 backdrop-blur max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <p className="text-xl text-gray-300 italic mb-4">
              "I spent 2 hours trying to get testnet tokens. HyperDAG had me deployed in 5 minutes."
            </p>
            <p className="text-sm text-gray-400">- Every Web3 Developer Ever</p>
          </CardContent>
        </Card>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {[
            { num: '1', title: 'Get Your API Key', desc: 'Sign up with email. API key delivered instantly.' },
            { num: '2', title: 'Write Your Contract', desc: 'Use Solidity, Vyper, or any EVM language.' },
            { num: '3', title: 'Deploy via API', desc: 'One POST request. We handle wallets, gas, and chain routing.' },
            { num: '4', title: 'Build & Scale', desc: 'Your contract is live. Track it via our dashboard.' }
          ].map((step) => (
            <Card key={step.num} className="bg-white/5 border-white/10 backdrop-blur">
              <CardContent className="pt-6 flex gap-4">
                <div className="text-4xl font-bold text-purple-400">{step.num}</div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-300">{step.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to Build Without the Friction?
        </h2>
        <Button 
          size="lg" 
          className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6" 
          asChild
          data-testid="button-create-account"
        >
          <a href="/dev-hub">Create Free Account</a>
        </Button>
        <p className="text-sm text-gray-400 mt-4">API key in 60 seconds</p>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 gap-4">
          <div>© 2025 HyperDAG. Part of Trinity Symphony.</div>
          <div className="flex space-x-6">
            <a href="/docs" className="hover:text-white transition-colors">Docs</a>
            <a href="https://github.com/dealappseo/trinity-symphony-shared" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <a href="/status" className="hover:text-white transition-colors">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
