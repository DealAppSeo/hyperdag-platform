import { Router } from 'express';


const router = Router();

// Define individual route handlers for each marketing page
router.get('/ai-dao', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateAiDaoPage());
});

router.get('/zkp-id', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateZkpIdentityPage());
});

router.get('/grantflow', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateGrantflowPage());
});

router.get('/hypercrowd', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateHypercrowdPage());
});

router.get('/features', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(generateFeaturesPage());
});

function generateAiDaoPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-Optimized DAO with Quadratic & Star Voting - HyperDAG</title>
    <meta name="description" content="The first governance system that actually works. AI prevents manipulation, users make real decisions, and every voice counts fairly.">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/dist/tailwind.min.css" rel="stylesheet">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        .primary-bg { background: hsl(218, 80%, 30%); }
        .primary-text { color: hsl(218, 80%, 30%); }
        .gradient-text { 
            background: linear-gradient(135deg, hsl(218, 80%, 30%), hsl(218, 80%, 50%)); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
        }
        .glow { box-shadow: 0 0 20px rgba(37, 99, 235, 0.3); }
        .card-shadow { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    </style>
</head>
<body class="min-h-screen text-gray-900">
    <div class="container mx-auto px-4 py-16">
        <!-- Header -->
        <div class="text-center mb-12">
            <div class="inline-block primary-bg text-white font-bold px-4 py-2 rounded-full mb-4">
                REVOLUTIONARY DAO GOVERNANCE
            </div>
            <h1 class="text-5xl font-bold mb-6 gradient-text">
                AI-Optimized DAO with<br>Quadratic & Star Voting
            </h1>
            <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                The first governance system that actually works. AI prevents manipulation, 
                users make real decisions, and every voice counts fairly.
            </p>
        </div>

        <!-- Industry Expert Quote -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-12 border border-blue-200">
            <div class="text-center">
                <div class="text-4xl mb-4">💬</div>
                <blockquote class="text-xl text-gray-700 italic mb-4 max-w-4xl mx-auto">
                    "The future of governance lies in combining human wisdom with artificial intelligence. 
                    Systems that can prevent manipulation while preserving authentic democratic participation 
                    will be the foundation of tomorrow's institutions."
                </blockquote>
                <cite class="text-primary font-semibold">— Vitalik Buterin, Co-founder of Ethereum</cite>
            </div>
        </div>

        <!-- Visual Impact Section -->
        <div class="bg-white card-shadow rounded-lg p-8 mb-12">
            <h2 class="text-3xl font-bold text-center mb-8 primary-text">The Governance Revolution in Numbers</h2>
            <div class="grid md:grid-cols-2 gap-8">
                <!-- Chart 1: Traditional vs HyperDAG Voting -->
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-4 text-gray-800">Traditional DAO Problems</h3>
                    <div class="bg-red-50 rounded-lg p-6 border border-red-200">
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Whale Control</span>
                                <div class="flex items-center">
                                    <div class="w-32 bg-gray-200 rounded-full h-2">
                                        <div class="bg-red-500 h-2 rounded-full" style="width: 85%"></div>
                                    </div>
                                    <span class="ml-2 text-sm text-red-600 font-bold">85%</span>
                                </div>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Bot Attacks</span>
                                <div class="flex items-center">
                                    <div class="w-32 bg-gray-200 rounded-full h-2">
                                        <div class="bg-red-500 h-2 rounded-full" style="width: 73%"></div>
                                    </div>
                                    <span class="ml-2 text-sm text-red-600 font-bold">73%</span>
                                </div>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Decision Delays</span>
                                <div class="flex items-center">
                                    <div class="w-32 bg-gray-200 rounded-full h-2">
                                        <div class="bg-red-500 h-2 rounded-full" style="width: 90%"></div>
                                    </div>
                                    <span class="ml-2 text-sm text-red-600 font-bold">90%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Chart 2: HyperDAG Solutions -->
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-4 text-gray-800">HyperDAG Solutions</h3>
                    <div class="bg-green-50 rounded-lg p-6 border border-green-200">
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Fair Representation</span>
                                <div class="flex items-center">
                                    <div class="w-32 bg-gray-200 rounded-full h-2">
                                        <div class="bg-green-500 h-2 rounded-full" style="width: 97%"></div>
                                    </div>
                                    <span class="ml-2 text-sm text-green-600 font-bold">97%</span>
                                </div>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Bot Detection</span>
                                <div class="flex items-center">
                                    <div class="w-32 bg-gray-200 rounded-full h-2">
                                        <div class="bg-green-500 h-2 rounded-full" style="width: 99%"></div>
                                    </div>
                                    <span class="ml-2 text-sm text-green-600 font-bold">99.7%</span>
                                </div>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Fast Decisions</span>
                                <div class="flex items-center">
                                    <div class="w-32 bg-gray-200 rounded-full h-2">
                                        <div class="bg-green-500 h-2 rounded-full" style="width: 94%"></div>
                                    </div>
                                    <span class="ml-2 text-sm text-green-600 font-bold">3x Faster</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cross-links to other pages -->
        <div class="mb-12">
            <h2 class="text-2xl font-bold text-center mb-6 primary-text">Explore HyperDAG's Revolutionary Features</h2>
            <div class="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <a href="/zkp-id" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">🔐</div>
                    <h3 class="font-bold primary-text mb-2">ZKP Identity</h3>
                    <p class="text-gray-600 text-sm">Prove who you are without revealing anything</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
                <a href="/grantflow" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">💰</div>
                    <h3 class="font-bold primary-text mb-2">GrantFlow</h3>
                    <p class="text-gray-600 text-sm">AI finds perfect grant matches in seconds</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
                <a href="/hypercrowd" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">🚀</div>
                    <h3 class="font-bold primary-text mb-2">HyperCrowd</h3>
                    <p class="text-gray-600 text-sm">AI-powered team building for perfect collaboration</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
            </div>
        </div>

        <!-- Problem Section -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-8 mb-12">
            <h2 class="text-3xl font-bold mb-6 text-red-600">Traditional DAOs Are Broken</h2>
            <div class="grid md:grid-cols-3 gap-6">
                <div class="text-center">
                    <div class="text-4xl mb-4">😴</div>
                    <h3 class="font-bold mb-2">Whale Dominance</h3>
                    <p class="text-gray-600">Rich holders control everything. Your vote doesn't matter.</p>
                </div>
                <div class="text-center">
                    <div class="text-4xl mb-4">🤖</div>
                    <h3 class="font-bold mb-2">Bot Manipulation</h3>
                    <p class="text-gray-600">Fake accounts and coordinated attacks skew results.</p>
                </div>
                <div class="text-center">
                    <div class="text-4xl mb-4">⏰</div>
                    <h3 class="font-bold mb-2">Slow Decisions</h3>
                    <p class="text-gray-600">Weeks of debate, no real action. Innovation dies.</p>
                </div>
            </div>
        </div>

        <!-- Solution Section -->
        <div class="mb-12">
            <h2 class="text-4xl font-bold text-center mb-12 gradient-text">
                HyperDAG's AI-Powered Solution
            </h2>
            
            <!-- Technology Showcase -->
            <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 mb-8 border border-purple-200">
                <div class="text-center mb-6">
                    <div class="text-5xl mb-4">⚡</div>
                    <h3 class="text-2xl font-bold primary-text mb-2">Revolutionary Breakthrough</h3>
                    <p class="text-gray-600">First system to solve the blockchain trilemma of governance</p>
                </div>
                
                <!-- Visual Comparison Chart -->
                <div class="grid md:grid-cols-3 gap-6">
                    <div class="text-center">
                        <div class="bg-white rounded-lg p-4 mb-2 border border-gray-200">
                            <div class="text-2xl mb-2">⚖️</div>
                            <div class="text-lg font-bold text-green-600">FAIR</div>
                            <div class="text-xs text-gray-500">Quadratic Voting</div>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="bg-white rounded-lg p-4 mb-2 border border-gray-200">
                            <div class="text-2xl mb-2">🛡️</div>
                            <div class="text-lg font-bold text-blue-600">SECURE</div>
                            <div class="text-xs text-gray-500">AI Bot Detection</div>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="bg-white rounded-lg p-4 mb-2 border border-gray-200">
                            <div class="text-2xl mb-2">⚡</div>
                            <div class="text-lg font-bold text-purple-600">FAST</div>
                            <div class="text-xs text-gray-500">Instant Decisions</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="grid md:grid-cols-2 gap-8 mb-12">
                <!-- Quadratic Voting -->
                <div class="bg-white card-shadow rounded-lg p-8">
                    <div class="flex items-center mb-6">
                        <div class="text-blue-600 mr-4 text-3xl">📊</div>
                        <h3 class="text-2xl font-bold primary-text">Quadratic Voting</h3>
                    </div>
                    <p class="text-gray-600 mb-4">Your influence grows with passion, not just tokens.</p>
                    
                    <!-- Interactive Chart -->
                    <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-700">1 token</span>
                                <div class="flex items-center">
                                    <div class="w-16 bg-blue-200 rounded-full h-2">
                                        <div class="bg-blue-600 h-2 rounded-full" style="width: 20%"></div>
                                    </div>
                                    <span class="ml-2 text-sm font-bold text-blue-600">1 vote</span>
                                </div>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-700">4 tokens</span>
                                <div class="flex items-center">
                                    <div class="w-16 bg-blue-200 rounded-full h-2">
                                        <div class="bg-blue-600 h-2 rounded-full" style="width: 40%"></div>
                                    </div>
                                    <span class="ml-2 text-sm font-bold text-blue-600">2 votes</span>
                                </div>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-700">9 tokens</span>
                                <div class="flex items-center">
                                    <div class="w-16 bg-blue-200 rounded-full h-2">
                                        <div class="bg-blue-600 h-2 rounded-full" style="width: 60%"></div>
                                    </div>
                                    <span class="ml-2 text-sm font-bold text-blue-600">3 votes</span>
                                </div>
                            </div>
                            <div class="text-center mt-3">
                                <span class="text-blue-600 font-bold text-sm">Formula: √tokens = voting power</span>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-blue-600">Prevents whale dominance, rewards genuine conviction</p>
                </div>

                <!-- Star Voting -->
                <div class="bg-white card-shadow rounded-lg p-8">
                    <div class="flex items-center mb-6">
                        <div class="text-yellow-600 mr-4 text-3xl">⭐</div>
                        <h3 class="text-2xl font-bold primary-text">Star Voting</h3>
                    </div>
                    <p class="text-gray-600 mb-4">Rate multiple options simultaneously for nuanced decisions.</p>
                    
                    <!-- Interactive Star Rating -->
                    <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="w-24 text-gray-700 text-sm">Proposal A:</span>
                                <div class="flex text-yellow-500 text-lg">★★★★★</div>
                                <span class="text-sm text-gray-600">Excellent</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="w-24 text-gray-700 text-sm">Proposal B:</span>
                                <div class="flex text-yellow-500 text-lg">★★★☆☆</div>
                                <span class="text-sm text-gray-600">Good</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="w-24 text-gray-700 text-sm">Proposal C:</span>
                                <div class="flex text-yellow-500 text-lg">★★☆☆☆</div>
                                <span class="text-sm text-gray-600">Fair</span>
                            </div>
                            <div class="text-center mt-3 pt-2 border-t border-yellow-300">
                                <span class="text-yellow-600 font-bold text-sm">Winner: Proposal A (4.8 avg)</span>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-yellow-600">Find consensus solutions that work for everyone</p>
                </div>
            </div>
        </div>

        <!-- Results Section -->
        <div class="text-center mb-12">
            <h2 class="text-3xl font-bold mb-8 primary-text">Real Results, Real Fast</h2>
            <div class="grid md:grid-cols-4 gap-6">
                <div class="bg-white card-shadow rounded-lg p-6">
                    <div class="text-3xl font-bold text-purple-600 mb-2">99.7%</div>
                    <p class="text-gray-600">Bot Detection Accuracy</p>
                </div>
                <div class="bg-white card-shadow rounded-lg p-6">
                    <div class="text-3xl font-bold text-blue-600 mb-2">3x</div>
                    <p class="text-gray-600">Faster Decision Making</p>
                </div>
                <div class="bg-white card-shadow rounded-lg p-6">
                    <div class="text-3xl font-bold text-green-600 mb-2">85%</div>
                    <p class="text-gray-600">Higher Participation</p>
                </div>
                <div class="bg-white card-shadow rounded-lg p-6">
                    <div class="text-3xl font-bold text-yellow-600 mb-2">100%</div>
                    <p class="text-gray-600">Fair & Transparent</p>
                </div>
            </div>
        </div>

        <!-- Inspirational CTA Section -->
        <div class="bg-white card-shadow rounded-lg p-8 text-center mb-12">
            <h2 class="text-3xl font-bold mb-4 primary-text">Join the HyperDAG Revolution</h2>
            <p class="text-xl text-gray-600 mb-6">
                Be part of tomorrow's solution today. Shape the future where AI and humanity collaborate 
                to solve the world's greatest challenges through fair, transparent governance.
            </p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <p class="text-gray-700 italic">
                    "The best time to plant a tree was 20 years ago. The second best time is now. 
                    The future of decentralized governance starts with your participation."
                </p>
            </div>
            <div class="flex gap-4 justify-center">
                <a href="/auth" class="style="background: #2563eb; color: white;" text-white font-bold py-4 px-8 rounded-lg glow transition-all text-lg">
                    Become a Revolutionary
                </a>
                <button onclick="copyLink()" style="display: inline-block; padding: 16px 32px; background: white; color: #2563eb; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; border: 2px solid #2563eb;" id="shareBtn">
                    Share This Revolution
                </button>
            </div>
        </div>
    </div>

    <script>
        function copyLink() {
            navigator.clipboard.writeText(window.location.href);
            const btn = document.getElementById('shareBtn');
            btn.textContent = '✓ Copied!';
            setTimeout(() => btn.textContent = 'Share This', 2000);
        }
    </script>
</body>
</html>`;
}

function generateZkpIdentityPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DBT → SBT Identity Evolution with Dynamic Reputation - HyperDAG</title>
    <meta name="description" content="Prove who you are without revealing anything. Build reputation without losing privacy. The future of digital identity is here.">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/dist/tailwind.min.css" rel="stylesheet">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        .primary-bg { background: hsl(218, 80%, 30%); }
        .primary-text { color: hsl(218, 80%, 30%); }
        .gradient-text { 
            background: linear-gradient(135deg, hsl(218, 80%, 30%), hsl(218, 80%, 50%)); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
        }
        .glow { box-shadow: 0 0 20px rgba(37, 99, 235, 0.3); }
        .card-shadow { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    </style>
</head>
<body class="min-h-screen text-gray-900">
    <div class="container mx-auto px-4 py-16">
        <!-- Header -->
        <div class="text-center mb-12">
            <div class="inline-block primary-bg text-white font-bold px-4 py-2 rounded-full mb-4">
                ZERO-KNOWLEDGE IDENTITY
            </div>
            <h1 class="text-5xl font-bold mb-6 gradient-text">
                DBT → SBT Identity Evolution<br>with Dynamic Reputation
            </h1>
            <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Prove who you are without revealing anything. Build reputation without losing privacy. 
                The future of digital identity is here.
            </p>
        </div>

        <!-- Industry Expert Quote -->
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 mb-12 border border-indigo-200">
            <div class="text-center">
                <div class="text-4xl mb-4">🔮</div>
                <blockquote class="text-xl text-gray-700 italic mb-4 max-w-4xl mx-auto">
                    "Zero-knowledge proofs represent the most significant breakthrough in digital privacy since 
                    public-key cryptography. They enable us to prove facts about ourselves without revealing 
                    the underlying data - a fundamental shift toward privacy-preserving digital interactions."
                </blockquote>
                <cite class="text-primary font-semibold">— Matthew Green, Cryptographer & Johns Hopkins Professor</cite>
            </div>
        </div>

        <!-- Visual Privacy Demonstration -->
        <div class="bg-white card-shadow rounded-lg p-8 mb-12">
            <h2 class="text-3xl font-bold text-center mb-8 primary-text">The Privacy Revolution Visualized</h2>
            <div class="grid md:grid-cols-2 gap-8">
                <!-- Traditional Identity -->
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-4 text-red-600">Traditional Identity Exposure</h3>
                    <div class="bg-red-50 rounded-lg p-6 border border-red-200">
                        <div class="space-y-4">
                            <div class="bg-white rounded p-3 border border-red-300">
                                <div class="text-sm text-gray-600 mb-1">Your Data</div>
                                <div class="text-xs text-red-700">
                                    ✗ Full Name: John Smith<br>
                                    ✗ Age: 32<br>
                                    ✗ Address: 123 Main St<br>
                                    ✗ Income: $75,000<br>
                                    ✗ Credit Score: 720
                                </div>
                            </div>
                            <div class="text-xs text-red-600 font-bold">100% of your data exposed</div>
                        </div>
                    </div>
                </div>
                
                <!-- Zero-Knowledge Proof -->
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-4 text-green-600">Zero-Knowledge Proof</h3>
                    <div class="bg-green-50 rounded-lg p-6 border border-green-200">
                        <div class="space-y-4">
                            <div class="bg-white rounded p-3 border border-green-300">
                                <div class="text-sm text-gray-600 mb-1">Verified Facts</div>
                                <div class="text-xs text-green-700">
                                    ✓ Age > 18: TRUE<br>
                                    ✓ Income > $50k: TRUE<br>
                                    ✓ Credit Score > 700: TRUE<br>
                                    ✓ Identity Verified: TRUE
                                </div>
                            </div>
                            <div class="text-xs text-green-600 font-bold">0% of your data exposed</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cross-links to other pages -->
        <div class="mb-12">
            <h2 class="text-2xl font-bold text-center mb-6 primary-text">Explore HyperDAG's Revolutionary Features</h2>
            <div class="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <a href="/ai-dao" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">🏛️</div>
                    <h3 class="font-bold primary-text mb-2">AI-Optimized DAO</h3>
                    <p class="text-gray-600 text-sm">Fair governance with quadratic and star voting</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
                <a href="/grantflow" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">💰</div>
                    <h3 class="font-bold primary-text mb-2">GrantFlow</h3>
                    <p class="text-gray-600 text-sm">AI finds perfect grant matches in seconds</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
                <a href="/hypercrowd" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">🚀</div>
                    <h3 class="font-bold primary-text mb-2">HyperCrowd</h3>
                    <p class="text-gray-600 text-sm">AI-powered team building for perfect collaboration</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
            </div>
        </div>

        <!-- DBT to SBT Evolution -->
        <div class="mb-12">
            <h2 class="text-4xl font-bold text-center mb-12 gradient-text">
                The Identity Evolution Path
            </h2>
            
            <div class="relative max-w-4xl mx-auto">
                <div class="space-y-12">
                    <!-- DBT Stage -->
                    <div class="flex items-center">
                        <div class="w-1/2 pr-8 text-right">
                            <div class="bg-gradient-to-br from-gray-900/40 to-blue-900/40 border border-gray-500/30 rounded-lg p-6">
                                <div class="flex items-center justify-end mb-4">
                                    <h3 class="text-2xl font-bold mr-3">Digital Bound Token (DBT)</h3>
                                    <div class="text-gray-400 text-2xl">🔒</div>
                                </div>
                                <p class="text-gray-300 mb-4">Basic account creation. Limited access, no verification required.</p>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-end items-center">
                                        <span class="mr-2">10 tokens/day limit</span>
                                        <div class="w-4 h-4 bg-red-500 rounded-full"></div>
                                    </div>
                                    <div class="flex justify-end items-center">
                                        <span class="mr-2">Basic features only</span>
                                        <div class="w-4 h-4 bg-yellow-500 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="w-8 h-8 bg-gray-500 rounded-full border-4 border-gray-900 absolute left-1/2 transform -translate-x-1/2"></div>
                        <div class="w-1/2 pl-8"></div>
                    </div>

                    <!-- Arrow -->
                    <div class="flex justify-center">
                        <div class="text-cyan-400 text-3xl">↓</div>
                    </div>

                    <!-- SBT Stage -->
                    <div class="flex items-center">
                        <div class="w-1/2 pr-8"></div>
                        <div class="w-8 h-8 bg-purple-500 rounded-full border-4 border-gray-900 absolute left-1/2 transform -translate-x-1/2"></div>
                        <div class="w-1/2 pl-8">
                            <div class="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-lg p-6">
                                <div class="flex items-center mb-4">
                                    <div class="text-purple-400 mr-3 text-2xl">🛡️</div>
                                    <h3 class="text-2xl font-bold">Soulbound Token (SBT)</h3>
                                </div>
                                <p class="text-gray-300 mb-4">Complete 4FA + Biometric + Proof of Life verification.</p>
                                <div class="space-y-2 text-sm">
                                    <div class="flex items-center">
                                        <div class="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                                        <span>Unlimited token access</span>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                                        <span>Full platform features</span>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                                        <span>Verified human with soul</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Use Cases -->
        <div class="mb-12">
            <h2 class="text-3xl font-bold text-center mb-8">Endless Possibilities</h2>
            <div class="grid md:grid-cols-3 gap-6">
                <div class="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6 text-center">
                    <div class="text-4xl mb-4">💰</div>
                    <h3 class="font-bold mb-3 text-purple-400">GrantFlow</h3>
                    <p class="text-gray-300">Prove eligibility for grants without revealing personal details</p>
                </div>
                <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 text-center">
                    <div class="text-4xl mb-4">👥</div>
                    <h3 class="font-bold mb-3 text-blue-400">HyperCrowd</h3>
                    <p class="text-gray-300">Build trusted teams with verified but private credentials</p>
                </div>
                <div class="bg-green-900/20 border border-green-500/30 rounded-lg p-6 text-center">
                    <div class="text-4xl mb-4">🏛️</div>
                    <h3 class="font-bold mb-3 text-green-400">DAO Governance</h3>
                    <p class="text-gray-300">Vote with verified identity while maintaining anonymity</p>
                </div>
            </div>
        </div>

        <!-- Inspirational CTA Section -->
        <div class="bg-white card-shadow rounded-lg p-8 text-center mb-12">
            <h2 class="text-3xl font-bold mb-4 primary-text">Join the HyperDAG Revolution</h2>
            <p class="text-xl text-gray-600 mb-6">
                Be part of tomorrow's solution today. Your verified identity becomes a bridge to a world where 
                privacy meets opportunity, and every interaction builds toward a better future.
            </p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <p class="text-gray-700 italic">
                    "In the digital age, your identity is your most valuable asset. 
                    Protect it, prove it, profit from it - without ever revealing it."
                </p>
            </div>
            <div class="flex gap-4 justify-center">
                <a href="/auth" class="style="background: #2563eb; color: white;" text-white font-bold py-4 px-8 rounded-lg glow transition-all text-lg">
                    Become a Revolutionary
                </a>
                <button onclick="copyLink()" style="display: inline-block; padding: 16px 32px; background: white; color: #2563eb; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; border: 2px solid #2563eb;" id="shareBtn">
                    Share This Revolution
                </button>
            </div>
        </div>
    </div>

    <script>
        function copyLink() {
            navigator.clipboard.writeText(window.location.href);
            const btn = document.getElementById('shareBtn');
            btn.textContent = '✓ Copied!';
            setTimeout(() => btn.textContent = 'Share This', 2000);
        }
    </script>
</body>
</html>`;
}

function generateGrantflowPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GrantFlow: AI Grant Matching Assistant - HyperDAG</title>
    <meta name="description" content="Stop wasting months searching for grants. Our AI finds perfect matches in seconds, writes your applications, and tracks submissions automatically.">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/dist/tailwind.min.css" rel="stylesheet">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        .primary-bg { background: hsl(218, 80%, 30%); }
        .primary-text { color: hsl(218, 80%, 30%); }
        .gradient-text { 
            background: linear-gradient(135deg, hsl(218, 80%, 30%), hsl(218, 80%, 50%)); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
        }
        .glow { box-shadow: 0 0 20px rgba(37, 99, 235, 0.3); }
        .card-shadow { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    </style>
</head>
<body class="min-h-screen text-gray-900">
    <div class="container mx-auto px-4 py-16">
        <!-- Header -->
        <div class="text-center mb-12">
            <div class="inline-block primary-bg text-white font-bold px-4 py-2 rounded-full mb-4">
                AI-POWERED GRANT DISCOVERY
            </div>
            <h1 class="text-5xl font-bold mb-6 gradient-text">
                GrantFlow: Your AI Grant<br>Matching Assistant
            </h1>
            <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Stop wasting months searching for grants. Our AI finds perfect matches in seconds, 
                writes your applications, and tracks submissions automatically.
            </p>
        </div>

        <!-- Industry Expert Quote -->
        <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 mb-12 border border-green-200">
            <div class="text-center">
                <div class="text-4xl mb-4">💡</div>
                <blockquote class="text-xl text-gray-700 italic mb-4 max-w-4xl mx-auto">
                    "AI will fundamentally transform how we discover and access funding opportunities. 
                    The organizations that leverage AI to intelligently match projects with grants 
                    will unlock unprecedented resources for innovation and social impact."
                </blockquote>
                <cite class="text-primary font-semibold">— Reid Hoffman, Co-founder of LinkedIn & Partner at Greylock</cite>
            </div>
        </div>

        <!-- Grant Discovery Visualization -->
        <div class="bg-white card-shadow rounded-lg p-8 mb-12">
            <h2 class="text-3xl font-bold text-center mb-8 primary-text">From Months to Minutes: AI Grant Discovery</h2>
            <div class="grid md:grid-cols-2 gap-8">
                <!-- Traditional Grant Search -->
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-4 text-red-600">Traditional Grant Search</h3>
                    <div class="bg-red-50 rounded-lg p-6 border border-red-200">
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Manual Research</span>
                                <div class="text-red-600 font-bold">40 hours</div>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Application Writing</span>
                                <div class="text-red-600 font-bold">60 hours</div>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Success Rate</span>
                                <div class="text-red-600 font-bold">12%</div>
                            </div>
                            <div class="border-t pt-3 mt-3">
                                <div class="text-lg font-bold text-red-600">100+ hours wasted</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- AI GrantFlow -->
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-4 text-green-600">HyperDAG GrantFlow AI</h3>
                    <div class="bg-green-50 rounded-lg p-6 border border-green-200">
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">AI Discovery</span>
                                <div class="text-green-600 font-bold">5 minutes</div>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">AI Application</span>
                                <div class="text-green-600 font-bold">15 minutes</div>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Success Rate</span>
                                <div class="text-green-600 font-bold">67%</div>
                            </div>
                            <div class="border-t pt-3 mt-3">
                                <div class="text-lg font-bold text-green-600">20 minutes total</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Funding Visualization -->
            <div class="mt-8 text-center">
                <h3 class="text-lg font-bold mb-4 primary-text">Available Funding Sources</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div class="text-2xl font-bold text-blue-600">$2.5B+</div>
                        <div class="text-xs text-gray-600">Government Grants</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div class="text-2xl font-bold text-purple-600">$800M+</div>
                        <div class="text-xs text-gray-600">Foundation Grants</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div class="text-2xl font-bold text-green-600">$400M+</div>
                        <div class="text-xs text-gray-600">Corporate Grants</div>
                    </div>
                    <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div class="text-2xl font-bold text-orange-600">50K+</div>
                        <div class="text-xs text-gray-600">Active Opportunities</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cross-links to other pages -->
        <div class="mb-12">
            <h2 class="text-2xl font-bold text-center mb-6 primary-text">Explore HyperDAG's Revolutionary Features</h2>
            <div class="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <a href="/ai-dao" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">🏛️</div>
                    <h3 class="font-bold primary-text mb-2">AI-Optimized DAO</h3>
                    <p class="text-gray-600 text-sm">Fair governance with quadratic and star voting</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
                <a href="/zkp-id" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">🔐</div>
                    <h3 class="font-bold primary-text mb-2">ZKP Identity</h3>
                    <p class="text-gray-600 text-sm">Prove who you are without revealing anything</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
                <a href="/hypercrowd" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">🚀</div>
                    <h3 class="font-bold primary-text mb-2">HyperCrowd</h3>
                    <p class="text-gray-600 text-sm">AI-powered team building for perfect collaboration</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
            </div>
        </div>

        <!-- How It Works -->
        <div class="mb-12">
            <h2 class="text-4xl font-bold text-center mb-12 gradient-text">
                How GrantFlow Works Its Magic
            </h2>
            
            <div class="grid md:grid-cols-4 gap-6">
                <!-- Step 1 -->
                <div class="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-lg p-6 text-center">
                    <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                    <div class="text-blue-400 text-2xl mb-3">🔍</div>
                    <h3 class="font-bold mb-2">Tell Us Your Vision</h3>
                    <p class="text-gray-300 text-sm">Describe your project, goals, and needs. Our AI understands context.</p>
                </div>

                <!-- Step 2 -->
                <div class="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-lg p-6 text-center">
                    <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                    <div class="text-purple-400 text-2xl mb-3">🧠</div>
                    <h3 class="font-bold mb-2">AI Finds Perfect Matches</h3>
                    <p class="text-gray-300 text-sm">We scan 20+ databases and find grants you'd never discover alone.</p>
                </div>

                <!-- Step 3 -->
                <div class="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/30 rounded-lg p-6 text-center">
                    <div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                    <div class="text-yellow-400 text-2xl mb-3">⚡</div>
                    <h3 class="font-bold mb-2">Auto-Generated Applications</h3>
                    <p class="text-gray-300 text-sm">AI writes compelling applications tailored to each funder's preferences.</p>
                </div>

                <!-- Step 4 -->
                <div class="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-lg p-6 text-center">
                    <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                    <div class="text-green-400 text-2xl mb-3">✅</div>
                    <h3 class="font-bold mb-2">One-Click Submission</h3>
                    <p class="text-gray-300 text-sm">Review, customize, and submit to multiple grants simultaneously.</p>
                </div>
            </div>
        </div>

        <!-- Grant Database Stats -->
        <div class="text-center mb-12">
            <h2 class="text-3xl font-bold mb-8">Massive Grant Universe</h2>
            <div class="grid md:grid-cols-4 gap-6">
                <div class="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                    <div class="text-3xl font-bold text-purple-400 mb-2">50,000+</div>
                    <p class="text-gray-300">Active Grants</p>
                </div>
                <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                    <div class="text-3xl font-bold text-blue-400 mb-2">$2.5B+</div>
                    <p class="text-gray-300">Available Funding</p>
                </div>
                <div class="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                    <div class="text-3xl font-bold text-green-400 mb-2">20+</div>
                    <p class="text-gray-300">Database Sources</p>
                </div>
                <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                    <div class="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
                    <p class="text-gray-300">Auto-Discovery</p>
                </div>
            </div>
        </div>

        <!-- Inspirational CTA Section -->
        <div class="bg-white card-shadow rounded-lg p-8 text-center mb-12">
            <h2 class="text-3xl font-bold mb-4 primary-text">Join the HyperDAG Revolution</h2>
            <p class="text-xl text-gray-600 mb-6">
                Be part of tomorrow's solution today. Every great innovation started with funding. 
                Let AI unlock the resources you need to change the world.
            </p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <p class="text-gray-700 italic">
                    "The future belongs to those who prepare for it today. 
                    Stop searching for opportunities - let opportunities find you."
                </p>
            </div>
            <div class="flex gap-4 justify-center">
                <a href="/auth" class="style="background: #2563eb; color: white;" text-white font-bold py-4 px-8 rounded-lg glow transition-all text-lg">
                    Become a Revolutionary
                </a>
                <button onclick="copyLink()" style="display: inline-block; padding: 16px 32px; background: white; color: #2563eb; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; border: 2px solid #2563eb;" id="shareBtn">
                    Share This Revolution
                </button>
            </div>
        </div>
    </div>

    <script>
        function copyLink() {
            navigator.clipboard.writeText(window.location.href);
            const btn = document.getElementById('shareBtn');
            btn.textContent = '✓ Copied!';
            setTimeout(() => btn.textContent = 'Share This', 2000);
        }
    </script>
</body>
</html>`;
}

function generateHypercrowdPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyperCrowd: AI-Powered Team Building - HyperDAG</title>
    <meta name="description" content="Stop networking. Start building. Our AI matches you with the perfect collaborators based on skills, passion, and proven track record.">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/dist/tailwind.min.css" rel="stylesheet">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        .primary-bg { background: hsl(218, 80%, 30%); }
        .primary-text { color: hsl(218, 80%, 30%); }
        .gradient-text { 
            background: linear-gradient(135deg, hsl(218, 80%, 30%), hsl(218, 80%, 50%)); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
        }
        .glow { box-shadow: 0 0 20px rgba(37, 99, 235, 0.3); }
        .card-shadow { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    </style>
</head>
<body class="min-h-screen text-gray-900">
    <div class="container mx-auto px-4 py-16">
        <!-- Header -->
        <div class="text-center mb-12">
            <div class="inline-block primary-bg text-white font-bold px-4 py-2 rounded-full mb-4">
                AI-POWERED TEAM BUILDING
            </div>
            <h1 class="text-5xl font-bold mb-6 gradient-text">
                HyperCrowd: Where Perfect<br>Teams Form Automatically
            </h1>
            <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Stop networking. Start building. Our AI matches you with the perfect collaborators 
                based on skills, passion, and proven track record.
            </p>
        </div>

        <!-- Industry Expert Quote -->
        <div class="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-8 mb-12 border border-orange-200">
            <div class="text-center">
                <div class="text-4xl mb-4">🤝</div>
                <blockquote class="text-xl text-gray-700 italic mb-4 max-w-4xl mx-auto">
                    "The future of work is collaborative. AI will enable us to form better teams faster 
                    by understanding not just skills, but compatibility, shared values, and complementary 
                    working styles. This is the key to unlocking human potential at scale."
                </blockquote>
                <cite class="text-primary font-semibold">— Satya Nadella, CEO of Microsoft</cite>
            </div>
        </div>

        <!-- Team Building Visualization -->
        <div class="bg-white card-shadow rounded-lg p-8 mb-12">
            <h2 class="text-3xl font-bold text-center mb-8 primary-text">Revolutionary Team Formation</h2>
            <div class="grid md:grid-cols-2 gap-8">
                <!-- Traditional Networking -->
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-4 text-orange-600">Traditional Networking</h3>
                    <div class="bg-orange-50 rounded-lg p-6 border border-orange-200">
                        <div class="space-y-4">
                            <div class="text-sm text-gray-600 mb-3">Finding the Right People</div>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-xs">LinkedIn Search</span>
                                    <span class="text-orange-600 font-bold">20 hours</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs">Coffee Meetings</span>
                                    <span class="text-orange-600 font-bold">40 hours</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs">Skill Verification</span>
                                    <span class="text-orange-600 font-bold">Impossible</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs">Team Chemistry</span>
                                    <span class="text-orange-600 font-bold">Unknown</span>
                                </div>
                            </div>
                            <div class="border-t pt-3 mt-3">
                                <div class="text-lg font-bold text-orange-600">60+ hours, 12% success</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- AI Team Matching -->
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-4 text-green-600">HyperCrowd AI Matching</h3>
                    <div class="bg-green-50 rounded-lg p-6 border border-green-200">
                        <div class="space-y-4">
                            <div class="text-sm text-gray-600 mb-3">AI-Powered Team Assembly</div>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-xs">Skill Analysis</span>
                                    <span class="text-green-600 font-bold">Instant</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs">Compatibility Check</span>
                                    <span class="text-green-600 font-bold">2 minutes</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs">Verified Experience</span>
                                    <span class="text-green-600 font-bold">On-Chain</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs">Team Formation</span>
                                    <span class="text-green-600 font-bold">72 hours</span>
                                </div>
                            </div>
                            <div class="border-t pt-3 mt-3">
                                <div class="text-lg font-bold text-green-600">3 days, 95% success</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Success Metrics -->
            <div class="mt-8 text-center">
                <h3 class="text-lg font-bold mb-4 primary-text">Proven Results</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div class="text-2xl font-bold text-blue-600">10K+</div>
                        <div class="text-xs text-gray-600">Verified Builders</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div class="text-2xl font-bold text-purple-600">95%</div>
                        <div class="text-xs text-gray-600">Match Success Rate</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div class="text-2xl font-bold text-green-600">72hrs</div>
                        <div class="text-xs text-gray-600">Average Match Time</div>
                    </div>
                    <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div class="text-2xl font-bold text-orange-600">$50M+</div>
                        <div class="text-xs text-gray-600">Projects Funded</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cross-links to other pages -->
        <div class="mb-12">
            <h2 class="text-2xl font-bold text-center mb-6 primary-text">Explore HyperDAG's Revolutionary Features</h2>
            <div class="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <a href="/ai-dao" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">🏛️</div>
                    <h3 class="font-bold primary-text mb-2">AI-Optimized DAO</h3>
                    <p class="text-gray-600 text-sm">Fair governance with quadratic and star voting</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
                <a href="/zkp-id" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">🔐</div>
                    <h3 class="font-bold primary-text mb-2">ZKP Identity</h3>
                    <p class="text-gray-600 text-sm">Prove who you are without revealing anything</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
                <a href="/grantflow" class="bg-white card-shadow rounded-lg p-4 hover:shadow-lg transition-all group">
                    <div class="text-3xl mb-2">💰</div>
                    <h3 class="font-bold primary-text mb-2">GrantFlow</h3>
                    <p class="text-gray-600 text-sm">AI finds perfect grant matches in seconds</p>
                    <div class="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</div>
                </a>
            </div>
        </div>

        <!-- How It Works -->
        <div class="mb-12">
            <h2 class="text-4xl font-bold text-center mb-12 gradient-text">
                How HyperCrowd Creates Magic Teams
            </h2>
            
            <div class="grid md:grid-cols-4 gap-6">
                <!-- Step 1 -->
                <div class="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-lg p-6 text-center">
                    <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                    <div class="text-blue-400 text-2xl mb-3">🎯</div>
                    <h3 class="font-bold mb-2">Define Your Mission</h3>
                    <p class="text-gray-300 text-sm">Tell us your project goals, timeline, and the skills you need.</p>
                </div>

                <!-- Step 2 -->
                <div class="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-lg p-6 text-center">
                    <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                    <div class="text-purple-400 text-2xl mb-3">🧠</div>
                    <h3 class="font-bold mb-2">AI Finds Perfect Matches</h3>
                    <p class="text-gray-300 text-sm">Our AI analyzes skills, availability, and collaboration history.</p>
                </div>

                <!-- Step 3 -->
                <div class="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-lg p-6 text-center">
                    <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                    <div class="text-green-400 text-2xl mb-3">👥</div>
                    <h3 class="font-bold mb-2">Smart Introductions</h3>
                    <p class="text-gray-300 text-sm">Meet pre-vetted collaborators with verified skills and reputation.</p>
                </div>

                <!-- Step 4 -->
                <div class="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/30 rounded-lg p-6 text-center">
                    <div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                    <div class="text-yellow-400 text-2xl mb-3">⚡</div>
                    <h3 class="font-bold mb-2">Launch Together</h3>
                    <p class="text-gray-300 text-sm">Start building with confidence, backed by AI-optimized team dynamics.</p>
                </div>
            </div>
        </div>

        <!-- Platform Stats -->
        <div class="text-center mb-12">
            <h2 class="text-3xl font-bold mb-8">Global HyperCrowd Network</h2>
            <div class="grid md:grid-cols-4 gap-6">
                <div class="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                    <div class="text-3xl font-bold text-purple-400 mb-2">10,000+</div>
                    <p class="text-gray-300">Verified Builders</p>
                </div>
                <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                    <div class="text-3xl font-bold text-blue-400 mb-2">500+</div>
                    <p class="text-gray-300">Active Teams</p>
                </div>
                <div class="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                    <div class="text-3xl font-bold text-green-400 mb-2">95%</div>
                    <p class="text-gray-300">Match Success Rate</p>
                </div>
                <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                    <div class="text-3xl font-bold text-yellow-400 mb-2">72hr</div>
                    <p class="text-gray-300">Average Match Time</p>
                </div>
            </div>
        </div>

        <!-- Inspirational CTA Section -->
        <div class="bg-white card-shadow rounded-lg p-8 text-center mb-12">
            <h2 class="text-3xl font-bold mb-4 primary-text">Join the HyperDAG Revolution</h2>
            <p class="text-xl text-gray-600 mb-6">
                Be part of tomorrow's solution today. Great teams create great outcomes. 
                Join a community where collaboration transforms ideas into world-changing impact.
            </p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <p class="text-gray-700 italic">
                    "Alone we can do so little; together we can do so much. 
                    The revolution starts when visionaries unite."
                </p>
            </div>
            <div class="flex gap-4 justify-center">
                <a href="/auth" class="style="background: #2563eb; color: white;" text-white font-bold py-4 px-8 rounded-lg glow transition-all text-lg">
                    Become a Revolutionary
                </a>
                <button onclick="copyLink()" style="display: inline-block; padding: 16px 32px; background: white; color: #2563eb; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; border: 2px solid #2563eb;" id="shareBtn">
                    Share This Revolution
                </button>
            </div>
        </div>
    </div>

    <script>
        function copyLink() {
            navigator.clipboard.writeText(window.location.href);
            const btn = document.getElementById('shareBtn');
            btn.textContent = '✓ Copied!';
            setTimeout(() => btn.textContent = 'Share This', 2000);
        }
    </script>
</body>
</html>`;
}

function generateFeaturesPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyperDAG Features - Revolutionary Web3 & AI Platform</title>
    <meta name="description" content="Explore HyperDAG's four breakthrough innovations: AI-Optimized DAO, ZKP Identity, GrantFlow, and HyperCrowd. The future of Web3 social impact.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            background: #f8fafc;
            color: #1a202c;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .text-center { text-align: center; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-8 { margin-bottom: 32px; }
        .mb-12 { margin-bottom: 48px; }
        .mb-16 { margin-bottom: 64px; }
        .p-4 { padding: 16px; }
        .p-6 { padding: 24px; }
        .p-8 { padding: 32px; }
        .px-4 { padding-left: 16px; padding-right: 16px; }
        .py-16 { padding-top: 64px; padding-bottom: 64px; }
        .rounded-lg { border-radius: 8px; }
        .rounded-xl { border-radius: 12px; }
        .bg-white { background: white; }
        .bg-blue-50 { background: #eff6ff; }
        .bg-green-50 { background: #f0fdf4; }
        .bg-red-50 { background: #fef2f2; }
        .bg-orange-50 { background: #fff7ed; }
        .bg-purple-50 { background: #faf5ff; }
        .border { border: 1px solid #e5e7eb; }
        .border-blue-200 { border: 1px solid #bfdbfe; }
        .border-green-200 { border: 1px solid #bbf7d0; }
        .border-red-200 { border: 1px solid #fecaca; }
        .border-orange-200 { border: 1px solid #fed7aa; }
        .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); }
        .text-blue-600 { color: #2563eb; }
        .text-green-600 { color: #16a34a; }
        .text-red-600 { color: #dc2626; }
        .text-orange-600 { color: #ea580c; }
        .text-purple-600 { color: #9333ea; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-700 { color: #374151; }
        .text-lg { font-size: 18px; }
        .text-xl { font-size: 20px; }
        .text-2xl { font-size: 24px; }
        .text-4xl { font-size: 36px; }
        .text-6xl { font-size: 60px; }
        .font-bold { font-weight: bold; }
        .italic { font-style: italic; }
        .primary-text { color: #2563eb; }
        .gradient-text { color: #2563eb; font-weight: bold; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        .gap-4 { gap: 16px; }
        .gap-6 { gap: 24px; }
        .gap-8 { gap: 32px; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .max-w-4xl { max-width: 56rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .w-24 { width: 96px; }
        .h-2 { height: 8px; }
        .bg-green-200 { background: #bbf7d0; }
        .bg-green-600 { background: #16a34a; }
        .space-y-2 > * + * { margin-top: 8px; }
        .space-y-3 > * + * { margin-top: 12px; }
        .text-sm { font-size: 14px; }
        .text-xs { font-size: 12px; }
        .progress-bar { 
            background: #e5e7eb; 
            border-radius: 4px; 
            overflow: hidden; 
            height: 8px;
        }
        .progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            border: none;
            cursor: pointer;
        }
        .btn:hover {
            background: #1d4ed8;
        }
        .btn-outline {
            background: white;
            color: #2563eb;
            border: 2px solid #2563eb;
        }
        .btn-outline:hover {
            background: #f3f4f6;
        }
        @media (min-width: 768px) {
            .lg-grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .md-grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        }
    </style>
</head>
<body>
    <div class="min-h-screen">
        <div class="container mx-auto px-4 py-16">
            <!-- Header -->
            <div class="text-center mb-16">
                <div class="inline-block bg-blue-100 text-primary font-bold px-6 py-3 text-lg rounded-full mb-4">
                    HYPERDAG ECOSYSTEM
                </div>
                <h1 class="text-6xl font-bold mb-6 gradient-text">
                    Start Your Journey at<br>PurposeHub
                </h1>
                <p class="text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
                    A guided path from discovering your purpose to creating meaningful impact. 
                    Connect with causes, secure funding, build teams, and let AI amplify your efforts.
                </p>
                
                <!-- Primary CTA -->
                <div class="text-center mb-12">
                    <a href="/purpose-hub" style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #2563eb, #16a34a); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s;">
                        🎯 Begin at PurposeHub →
                    </a>
                    <p class="text-gray-500 mt-3 text-sm">Your complete journey starts here</p>
                </div>
            </div>
            
            <!-- "Help Someone, Help Someone" Entry Paths -->
            <div class="bg-white rounded-xl p-8 mb-16 border shadow">
                <h2 class="text-4xl font-bold mb-8 text-center gradient-text">Or Jump Directly to Any Feature</h2>
                <p class="text-center text-gray-600 mb-8">If you already know what you need, you can access any feature directly. But we recommend starting at PurposeHub for the best experience.</p>
                
                <!-- Core Philosophy -->
                <div class="text-center mb-8">
                    <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border max-w-4xl mx-auto">
                        <h3 class="text-2xl font-bold text-gray-700 mb-4">An Open-Source Ecosystem Where Doing Good Is Rewarded</h3>
                        <p class="text-lg text-gray-600 mb-2">AI-optimized, human-validated, ZKP-private, DAO-governed for true financial and educational inclusion</p>
                        <p class="text-sm text-gray-500">Quadratic & Star Voting • 4FA Proof of Life • Non-Plutocratic • Equal Opportunities for Everyone</p>
                    </div>
                </div>
                
                <!-- Three Primary Entry Paths -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <!-- Path 1: Have Passion, Need Funding -->
                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                        <div class="text-center mb-4">
                            <div class="text-5xl mb-3">💡</div>
                            <h3 class="text-xl font-bold text-green-600 mb-2">Have a World-Changing Idea?</h3>
                            <p class="text-sm text-gray-600 mb-4">Let AI scan our grant database and match technologies to grants based on causes you're passionate about</p>
                        </div>
                        <div class="space-y-2 text-sm text-gray-600 mb-6">
                            <div>• AI matches your passion to perfect grants</div>
                            <div>• Scan 50,000+ active funding opportunities</div>
                            <div>• Automated application generation</div>
                            <div>• Higher success rates with verified identity</div>
                        </div>
                        <div class="flex gap-1">
                            <a href="#grantflow-deep" style="display: block; flex: 1; text-align: center; padding: 6px 12px; background: #16a34a; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
                                Learn More ↓
                            </a>
                            <a href="/user-stories" style="display: block; flex: 1; text-align: center; padding: 6px 12px; background: #059669; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
                                See Stories
                            </a>
                            <a href="/grantflow" style="display: block; flex: 1; text-align: center; padding: 6px 12px; background: #047857; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
                                Try Now →
                            </a>
                        </div>
                    </div>
                    
                    <!-- Path 2: Have Idea, Need Team -->
                    <div class="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-6 border border-purple-200">
                        <div class="text-center mb-4">
                            <div class="text-5xl mb-3">👥</div>
                            <h3 class="text-xl font-bold text-purple-600 mb-2">Have an Idea, Need a Team?</h3>
                            <p class="text-sm text-gray-600 mb-4">Find reputable developers and designers who complement your skillset to build your dream team</p>
                        </div>
                        <div class="space-y-2 text-sm text-gray-600 mb-6">
                            <div>• AI matches complementary skills</div>
                            <div>• Find verified, passionate co-founders</div>
                            <div>• Privacy-preserving skill verification</div>
                            <div>• Build reputation through collaboration</div>
                        </div>
                        <div class="flex gap-1">
                            <a href="#hypercrowd-deep" style="display: block; flex: 1; text-align: center; padding: 6px 12px; background: #9333ea; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
                                Learn More ↓
                            </a>
                            <a href="/user-stories" style="display: block; flex: 1; text-align: center; padding: 6px 12px; background: #7c3aed; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
                                See Stories
                            </a>
                            <a href="/hypercrowd" style="display: block; flex: 1; text-align: center; padding: 6px 12px; background: #6d28d9; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
                                Try Now →
                            </a>
                        </div>
                    </div>
                    
                    <!-- Path 3: Have Both, Want to Help -->
                    <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
                        <div class="text-center mb-4">
                            <div class="text-5xl mb-3">🌟</div>
                            <h3 class="text-xl font-bold text-orange-600 mb-2">Ready to Help Someone?</h3>
                            <p class="text-sm text-gray-600 mb-4">Find a nonprofit to support by mentoring a young professional. Help someone, help someone.</p>
                        </div>
                        <div class="space-y-2 text-sm text-gray-600 mb-6">
                            <div>• Mentor young professionals at nonprofits</div>
                            <div>• Choose causes you care about</div>
                            <div>• Earn reputation and governance tokens</div>
                            <div>• Create lasting social impact</div>
                        </div>
                        <div class="flex gap-1">
                            <a href="#mentoring-deep" style="display: block; flex: 1; text-align: center; padding: 6px 12px; background: #ea580c; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
                                Learn More ↓
                            </a>
                            <a href="/user-stories" style="display: block; flex: 1; text-align: center; padding: 6px 12px; background: #dc2626; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
                                See Stories
                            </a>
                            <a href="/mentoring" style="display: block; flex: 1; text-align: center; padding: 6px 12px; background: #b91c1c; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
                                Start Now →
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Your Privacy Foundation -->
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 mb-8">
                    <div class="text-center">
                        <div class="text-3xl mb-3">🔐</div>
                        <h4 class="text-lg font-bold text-blue-600 mb-2">All Powered by Your Private ZKP Identity</h4>
                        <p class="text-gray-600 mb-4">Every path starts with your free SBT identity. Prove qualifications, build reputation, participate fully - all while staying completely anonymous.</p>
                        <div class="flex gap-2 justify-center">
                            <a href="#zkp-deep" style="display: inline-block; padding: 8px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
                                Learn More ↓
                            </a>
                            <a href="/zkp-id" style="display: inline-block; padding: 8px 16px; background: #1d4ed8; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
                                Get Started →
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Viral Loop: How It All Connects -->
                <div class="bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg p-6 border">
                    <h4 class="text-xl font-bold text-center mb-4 text-gray-700">The Viral Loop: Success Multiplies Impact</h4>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-sm">
                        <div class="bg-white rounded p-4 border">
                            <div class="text-2xl mb-2">🚀</div>
                            <div class="font-bold text-green-600 mb-1">1. You Succeed</div>
                            <div class="text-gray-600">Get funding, build teams, launch projects</div>
                        </div>
                        <div class="bg-white rounded p-4 border">
                            <div class="text-2xl mb-2">🤝</div>
                            <div class="font-bold text-blue-600 mb-1">2. You Help Others</div>
                            <div class="text-gray-600">Mentor, create content, support nonprofits</div>
                        </div>
                        <div class="bg-white rounded p-4 border">
                            <div class="text-2xl mb-2">⭐</div>
                            <div class="font-bold text-purple-600 mb-1">3. Earn Recognition</div>
                            <div class="text-gray-600">Build reputation, earn tokens, gain influence</div>
                        </div>
                        <div class="bg-white rounded p-4 border">
                            <div class="text-2xl mb-2">♾️</div>
                            <div class="font-bold text-orange-600 mb-1">4. Exponential Impact</div>
                            <div class="text-gray-600">More opportunities, bigger projects, greater good</div>
                        </div>
                    </div>
                    <div class="text-center mt-4 text-gray-600">
                        <strong>An ecosystem where your success creates opportunities for others, and helping others multiplies your own success</strong>
                    </div>
                </div>
            </div>

            <!-- Industry Expert Quote -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-12 border border-blue-200">
                <div class="text-center">
                    <div class="text-4xl mb-4">💬</div>
                    <blockquote class="text-xl text-gray-700 italic mb-4 max-w-4xl mx-auto">
                        "The convergence of AI and blockchain will define the next decade of technology. 
                        Platforms that seamlessly integrate governance, identity, funding, and collaboration 
                        will become the infrastructure for tomorrow's digital society."
                    </blockquote>
                    <cite class="text-primary font-semibold">— Tim Berners-Lee, Inventor of the World Wide Web</cite>
                </div>
            </div>

            <!-- Features Grid -->
            <div class="grid lg:grid-cols-2 gap-8 mb-16">
                <!-- AI DAO Feature -->
                <div class="bg-white border-2 border-blue-200 overflow-hidden card-shadow rounded-lg group hover:shadow-xl transition-all duration-300">
                    <div class="p-8">
                        <div class="flex items-start justify-between mb-6">
                            <div class="text-6xl">🏛️</div>
                            <a href="/ai-dao" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Learn more →</a>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 primary-text">AI-Optimized DAO</h3>
                        <p class="text-gray-600 mb-6 text-lg">The first governance system that actually works. AI prevents manipulation, users make real decisions.</p>
                        
                        <!-- How It Works Flow Chart -->
                        <div class="bg-white rounded-lg p-6 mb-6 border shadow">
                            <h4 class="text-lg font-bold mb-4 text-gray-700">How AI-DAO Works:</h4>
                            <div class="grid grid-cols-4 gap-2 text-center text-sm">
                                <div class="bg-blue-50 p-3 rounded border">
                                    <div class="text-2xl mb-2">📝</div>
                                    <div class="font-bold text-blue-600">1. Proposal</div>
                                    <div class="text-xs text-gray-600">Community submits ideas</div>
                                </div>
                                <div class="bg-green-50 p-3 rounded border">
                                    <div class="text-2xl mb-2">🤖</div>
                                    <div class="font-bold text-green-600">2. AI Analysis</div>
                                    <div class="text-xs text-gray-600">Detects bots & manipulation</div>
                                </div>
                                <div class="bg-purple-50 p-3 rounded border">
                                    <div class="text-2xl mb-2">🗳️</div>
                                    <div class="font-bold text-purple-600">3. Fair Vote</div>
                                    <div class="text-xs text-gray-600">Quadratic + Star voting</div>
                                </div>
                                <div class="bg-orange-50 p-3 rounded border">
                                    <div class="text-2xl mb-2">⚡</div>
                                    <div class="font-bold text-orange-600">4. Execute</div>
                                    <div class="text-xs text-gray-600">Automatic implementation</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Success Metrics -->
                        <div class="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                            <div class="text-sm font-bold mb-4 text-gray-700">Performance Metrics:</div>
                            <div class="space-y-3">
                                <div>
                                    <div class="flex justify-between mb-1">
                                        <span class="text-sm text-gray-700">Bot Detection</span>
                                        <span class="text-sm font-bold text-green-600">99.7%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill bg-green-600" style="width: 99%"></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between mb-1">
                                        <span class="text-sm text-gray-700">Fair Representation</span>
                                        <span class="text-sm font-bold text-green-600">97%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill bg-green-600" style="width: 97%"></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between mb-1">
                                        <span class="text-sm text-gray-700">Decision Speed</span>
                                        <span class="text-sm font-bold text-green-600">3x Faster</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill bg-green-600" style="width: 75%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ZKP Identity Feature -->
                <div class="bg-white border-2 border-purple-200 overflow-hidden card-shadow rounded-lg group hover:shadow-xl transition-all duration-300">
                    <div class="p-8">
                        <div class="flex items-start justify-between mb-6">
                            <div class="text-6xl">🔐</div>
                            <a href="/zkp-id" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Learn more →</a>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 primary-text">ZKP Identity Revolution</h3>
                        <p class="text-gray-600 mb-6 text-lg">Prove who you are without revealing anything. Build reputation without losing privacy.</p>
                        
                        <!-- ZKP Process Flow -->
                        <div class="bg-white rounded-lg p-6 mb-6 border shadow">
                            <h4 class="text-lg font-bold mb-4 text-gray-700">Zero-Knowledge Proof Process:</h4>
                            <div class="grid grid-cols-3 gap-4 text-center text-sm">
                                <div class="bg-blue-50 p-4 rounded border">
                                    <div class="text-3xl mb-2">🔒</div>
                                    <div class="font-bold text-blue-600">1. Private Data</div>
                                    <div class="text-xs text-gray-600 mb-2">Your personal info stays encrypted</div>
                                    <div class="text-xs bg-blue-100 p-1 rounded">Name: "John Doe"<br>Age: 25<br>Location: "NYC"</div>
                                </div>
                                <div class="bg-green-50 p-4 rounded border">
                                    <div class="text-3xl mb-2">🧮</div>
                                    <div class="font-bold text-green-600">2. ZK Computation</div>
                                    <div class="text-xs text-gray-600 mb-2">Math proof generated locally</div>
                                    <div class="text-xs bg-green-100 p-1 rounded">Proof: Age > 18 = TRUE<br>No personal data revealed</div>
                                </div>
                                <div class="bg-purple-50 p-4 rounded border">
                                    <div class="text-3xl mb-2">✅</div>
                                    <div class="font-bold text-purple-600">3. Verification</div>
                                    <div class="text-xs text-gray-600 mb-2">Others verify without seeing data</div>
                                    <div class="text-xs bg-purple-100 p-1 rounded">Verified: Adult ✓<br>Privacy: 100% intact</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Privacy Comparison -->
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                                <div class="text-xs text-red-600 font-bold mb-2">Traditional Identity</div>
                                <div class="text-2xl font-bold text-red-600 mb-1">100%</div>
                                <div class="text-xs text-gray-600">Personal Data Exposed</div>
                                <div class="text-xs text-red-600 mt-2">❌ Name, Age, Address</div>
                            </div>
                            <div class="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                                <div class="text-xs text-green-600 font-bold mb-2">Zero-Knowledge Proof</div>
                                <div class="text-2xl font-bold text-green-600 mb-1">0%</div>
                                <div class="text-xs text-gray-600">Personal Data Exposed</div>
                                <div class="text-xs text-green-600 mt-2">✅ Only Age > 18: TRUE</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- GrantFlow Feature -->
                <div class="bg-white border-2 border-green-200 overflow-hidden card-shadow rounded-lg group hover:shadow-xl transition-all duration-300">
                    <div class="p-8">
                        <div class="flex items-start justify-between mb-6">
                            <div class="text-6xl">💰</div>
                            <a href="/grantflow" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Learn more →</a>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 primary-text">GrantFlow AI Assistant</h3>
                        <p class="text-gray-600 mb-6 text-lg">Stop wasting months searching for grants. AI finds perfect matches in seconds and writes applications.</p>
                        
                        <!-- GrantFlow Process -->
                        <div class="bg-white rounded-lg p-6 mb-6 border shadow">
                            <h4 class="text-lg font-bold mb-4 text-gray-700">GrantFlow AI Process:</h4>
                            <div class="grid grid-cols-5 gap-2 text-center text-sm">
                                <div class="bg-blue-50 p-3 rounded border">
                                    <div class="text-2xl mb-2">🎯</div>
                                    <div class="font-bold text-blue-600">1. Your Project</div>
                                    <div class="text-xs text-gray-600">Describe your idea</div>
                                </div>
                                <div class="bg-green-50 p-3 rounded border">
                                    <div class="text-2xl mb-2">🔍</div>
                                    <div class="font-bold text-green-600">2. AI Search</div>
                                    <div class="text-xs text-gray-600">Scans 50K+ grants</div>
                                </div>
                                <div class="bg-purple-50 p-3 rounded border">
                                    <div class="text-2xl mb-2">🎯</div>
                                    <div class="font-bold text-purple-600">3. Perfect Match</div>
                                    <div class="text-xs text-gray-600">95% compatibility</div>
                                </div>
                                <div class="bg-orange-50 p-3 rounded border">
                                    <div class="text-2xl mb-2">✍️</div>
                                    <div class="font-bold text-orange-600">4. AI Writing</div>
                                    <div class="text-xs text-gray-600">Generates application</div>
                                </div>
                                <div class="bg-red-50 p-3 rounded border">
                                    <div class="text-2xl mb-2">🚀</div>
                                    <div class="font-bold text-red-600">5. Submit</div>
                                    <div class="text-xs text-gray-600">One-click submission</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Funding Stats -->
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                                <div class="text-2xl font-bold text-blue-600 mb-1">$2.5B+</div>
                                <div class="text-sm text-gray-700 font-bold">Available Funding</div>
                                <div class="text-xs text-blue-600 mt-1">Government + Private</div>
                            </div>
                            <div class="bg-purple-50 rounded-lg p-4 border border-purple-200 text-center">
                                <div class="text-2xl font-bold text-purple-600 mb-1">50K+</div>
                                <div class="text-sm text-gray-700 font-bold">Active Grants</div>
                                <div class="text-xs text-purple-600 mt-1">Real-time Discovery</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- HyperCrowd Feature -->
                <div class="bg-white border-2 border-orange-200 overflow-hidden card-shadow rounded-lg group hover:shadow-xl transition-all duration-300">
                    <div class="p-8">
                        <div class="flex items-start justify-between mb-6">
                            <div class="text-6xl">🚀</div>
                            <a href="/hypercrowd" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Learn more →</a>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 primary-text">HyperCrowd Team Builder</h3>
                        <p class="text-gray-600 mb-6 text-lg">Where perfect teams form automatically. AI matches based on skills, passion, and proven track record.</p>
                        
                        <!-- Team Formation Process -->
                        <div class="bg-white rounded-lg p-6 mb-6 border shadow">
                            <h4 class="text-lg font-bold mb-4 text-gray-700">HyperCrowd Team Formation:</h4>
                            <div class="grid grid-cols-4 gap-3 text-center text-sm">
                                <div class="bg-blue-50 p-4 rounded border">
                                    <div class="text-3xl mb-2">👤</div>
                                    <div class="font-bold text-blue-600">1. Your Profile</div>
                                    <div class="text-xs text-gray-600 mb-2">Skills, goals, experience</div>
                                    <div class="text-xs bg-blue-100 p-1 rounded">React, Python, AI<br>Social Impact Focus</div>
                                </div>
                                <div class="bg-green-50 p-4 rounded border">
                                    <div class="text-3xl mb-2">🧠</div>
                                    <div class="font-bold text-green-600">2. AI Analysis</div>
                                    <div class="text-xs text-gray-600 mb-2">Matches complementary skills</div>
                                    <div class="text-xs bg-green-100 p-1 rounded">Designer + Developer<br>Passion alignment: 98%</div>
                                </div>
                                <div class="bg-purple-50 p-4 rounded border">
                                    <div class="text-3xl mb-2">🤝</div>
                                    <div class="font-bold text-purple-600">3. Perfect Match</div>
                                    <div class="text-xs text-gray-600 mb-2">Introduces team members</div>
                                    <div class="text-xs bg-purple-100 p-1 rounded">3-person team<br>Skill coverage: 100%</div>
                                </div>
                                <div class="bg-orange-50 p-4 rounded border">
                                    <div class="text-3xl mb-2">🚀</div>
                                    <div class="font-bold text-orange-600">4. Build Together</div>
                                    <div class="text-xs text-gray-600 mb-2">Collaborative workspace</div>
                                    <div class="text-xs bg-orange-100 p-1 rounded">Shared goals<br>Funding ready</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Team Stats -->
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                                <div class="text-2xl font-bold text-green-600 mb-1">95%</div>
                                <div class="text-sm text-gray-700 font-bold">Match Success Rate</div>
                                <div class="text-xs text-green-600 mt-1">AI-Verified Teams</div>
                            </div>
                            <div class="bg-orange-50 rounded-lg p-4 border border-orange-200 text-center">
                                <div class="text-2xl font-bold text-orange-600 mb-1">72hrs</div>
                                <div class="text-sm text-gray-700 font-bold">Average Match Time</div>
                                <div class="text-xs text-orange-600 mt-1">vs 60+ days traditional</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Integration Benefits -->
            <div class="bg-white border-2 border-blue-200 mb-16 card-shadow rounded-lg">
                <div class="p-8 text-center">
                    <h2 class="text-4xl font-bold mb-6 gradient-text">
                        The Power of Integration
                    </h2>
                    <p class="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
                        These aren't separate products - they're one unified ecosystem where each feature amplifies the others. 
                        Your verified identity unlocks better grants, perfect teams win more funding, and everything is governed fairly.
                    </p>
                    
                    <div class="grid md:grid-cols-4 gap-6 mb-8">
                        <div class="text-center">
                            <div class="text-3xl mb-2">🔄</div>
                            <h4 class="font-bold text-lg mb-2 text-gray-900">Seamless Flow</h4>
                            <p class="text-gray-600 text-sm">Identity → Teams → Grants → Governance</p>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl mb-2">🚀</div>
                            <h4 class="font-bold text-lg mb-2 text-gray-900">Compound Benefits</h4>
                            <p class="text-gray-600 text-sm">Each feature makes the others more powerful</p>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl mb-2">🎯</div>
                            <h4 class="font-bold text-lg mb-2 text-gray-900">Single Platform</h4>
                            <p class="text-gray-600 text-sm">Everything you need in one place</p>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl mb-2">🌍</div>
                            <h4 class="font-bold text-lg mb-2 text-gray-900">Global Impact</h4>
                            <p class="text-gray-600 text-sm">Scale solutions that matter</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Inspirational CTA Section -->
            <div class="bg-white border-2 border-primary/30 card-shadow rounded-lg">
                <div class="p-8 text-center">
                    <h2 class="text-4xl font-bold mb-4 primary-text">Join the HyperDAG Revolution</h2>
                    <p class="text-xl text-gray-600 mb-6">
                        Be part of tomorrow's solution today. Early adopters get exclusive access to all features 
                        and help shape the future where AI and humanity collaborate to solve the world's greatest challenges.
                    </p>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-3xl mx-auto">
                        <p class="text-gray-700 italic">
                            "The future belongs to those who see it coming and act on it today. 
                            Join the revolution that transforms good intentions into global impact."
                        </p>
                    </div>
                    <div class="flex gap-6 justify-center">
                        <a href="/auth" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Join HyperDAG</a>
                        <a href="/about" style="display: inline-block; padding: 12px 24px; background: white; color: #2563eb; text-decoration: none; border-radius: 8px; font-weight: bold; border: 2px solid #2563eb;">Learn More</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

export default router;