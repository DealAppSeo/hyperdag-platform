import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              HyperDAG Documentation
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive documentation for the HyperDAG ecosystem - from lite paper to technical specifications
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">📄 HyperDAG Lite Paper v2.2</h2>
              <p className="text-gray-600 mb-6">
                Learn about our vision for a decentralized, AI-powered future with comprehensive platform details and roadmap.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                Read Lite Paper Below
              </Button>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-purple-800 mb-4">📚 Technical White Paper</h2>
              <p className="text-gray-600 mb-6">
                Deep dive into the technical architecture, consensus mechanisms, and implementation details.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/whitepaper" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View White Paper
                </a>
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">HyperDAG Lite Paper</h2>
              <p className="text-blue-100 text-lg">Pioneering a Decentralized, AI-Powered Future</p>
              <div className="text-blue-200 mt-2">Version 2.2 | June 2025</div>
            </div>

            <div className="p-8">
              {/* Lite Paper Content */}
              <div className="prose prose-blue max-w-none">
                <div className="bg-blue-50 p-6 rounded-lg mb-8">
                  <h2 className="text-2xl font-semibold text-blue-800 mb-4">The Dawn of a New Era</h2>
                  <p className="text-blue-700 leading-relaxed">
                    HyperDAG is a movement to empower individuals, creators, and communities by fusing Artificial Intelligence (AI) with Web3's decentralized freedom. We envision a world where everyone controls their identity, earns from their passions, and shapes a global economy that prioritizes people over profits. Built on a privacy-first, AI-optimized, hybrid DAG-blockchain ecosystem, HyperDAG delivers 2.4M transactions per second (TPS), 470ms finality, and 0.08 kJ per transaction, solving the trilemma of scalability, security, and decentralization.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">🚀 Performance Metrics</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li><strong>2.4M TPS:</strong> Lightning-fast transactions</li>
                      <li><strong>470ms Finality:</strong> Near-instant confirmations</li>
                      <li><strong>0.08 kJ/Tx:</strong> 1575x more energy-efficient than Ethereum PoS</li>
                      <li><strong>Quantum-Resistant:</strong> Future-proof security</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">🎯 Our Mission</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>Empower 1B+ users by 2027</li>
                      <li>Fund $100M annually for social impact</li>
                      <li>Enable 90-98% creator revenue retention</li>
                      <li>Support verified non-profits globally</li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-6">Why HyperDAG Matters: The AI-Web3 Revolution</h2>
                
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg mb-8">
                  <p className="text-lg text-gray-700 mb-4">
                    The convergence of AI and Web3 unlocks transformative possibilities:
                  </p>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-2">AI-Powered Efficiency</h4>
                      <p className="text-gray-600 text-sm">Tools like Perplexity, Zencoder, GitHub Copilot, and Cursor, with fuzzy logic and neural networks, optimize transactions, matching, and monetization.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-700 mb-2">Web3 Freedom</h4>
                      <p className="text-gray-600 text-sm">Decentralized governance, zero-knowledge proofs (zk-SNARKs/STARKs), and quantum-resistant cryptography (CRYSTALS-Kyber/Dilithium) ensure secure, private interactions.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2">Global Impact</h4>
                      <p className="text-gray-600 text-sm">10-15% of tokens fund vetted non-profits and community-driven initiatives in financial inclusion, education, healthcare, and sustainability.</p>
                    </div>
                  </div>
                  <p className="text-lg text-gray-700 mt-4">
                    HyperDAG's SBTs power a zero-trust, peer-to-peer global solutions market, connecting creators directly to those who value their talents, enabling private, efficient monetization, and fostering personal growth through gamified self-discovery.
                  </p>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-6">Core Innovations</h2>

                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-blue-700 mb-4">1. Hybrid DAG-Blockchain Architecture</h3>
                    <p className="text-gray-600 mb-4">
                      HyperDAG merges Directed Acyclic Graph (DAG) parallel processing with blockchain checkpoints (via Polygon, Solana):
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>2.4M TPS:</strong> Scalability for global applications</li>
                      <li><strong>470ms Finality:</strong> Near-instant transaction confirmation</li>
                      <li><strong>0.08 kJ/Tx:</strong> 1575x more energy-efficient than Ethereum PoS</li>
                      <li><strong>Interoperability:</strong> LayerZero, Wormhole, and IBC ensure cross-chain integration</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-purple-700 mb-4">2. AI-Driven Optimization</h3>
                    <p className="text-gray-600 mb-4">
                      Our AI suite enhances efficiency:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Intelligent Routing:</strong> Fuzzy logic reduces transaction costs by 62%</li>
                      <li><strong>Dynamic Consensus:</strong> Dynamic Validator Neural Network (DVNN) adjusts finality (470ms-5s)</li>
                      <li><strong>Federated Learning:</strong> Privacy-preserving AI training across 240k+ edge devices, incentivized via SBTs</li>
                      <li><strong>AI Marketplace:</strong> A tokenized platform for trading AI models, with community-verified quality via GitHub Copilot and Cursor</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-green-700 mb-4">3. Self-Sovereign Identity with SBTs</h3>
                    <p className="text-gray-600 mb-4">
                      Soul Bound Tokens (SBTs) enable user-controlled identities, revolutionizing peer-to-peer markets:
                    </p>
                    <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                      <div>struct SoulBoundToken {`{`}</div>
                      <div className="ml-4">address owner;</div>
                      <div className="ml-4">uint256 reputationScore;</div>
                      <div className="ml-4">mapping(string =&gt; uint256) skills;</div>
                      <div className="ml-4">mapping(string =&gt; bool) certifications;</div>
                      <div className="ml-4">mapping(string =&gt; uint256) interests;</div>
                      <div>{`}`}</div>
                    </div>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Privacy:</strong> zk-SNARKs/STARKs allow selective disclosure, enabling creators to share skills without revealing personal data</li>
                      <li><strong>Interoperability:</strong> Compatible with Ethereum, Solana, Polkadot, Cosmos</li>
                      <li><strong>Meritocracy:</strong> Reputation drives governance, rewards, and monetization opportunities</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-red-700 mb-4">4. Privacy and Security</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Zero-Knowledge Proofs (ZKPs):</strong> zk-SNARKs/STARKs verify actions (e.g., "I donated to a non-profit") privately, without exposing sensitive data</li>
                      <li><strong>Quantum-Resistant Cryptography:</strong> CRYSTALS-Kyber/Dilithium ensures future-proof security</li>
                      <li><strong>Proof of Life (PoL):</strong> Biometric and behavioral verification prevents Sybil attacks</li>
                      <li><strong>Anti-Sybil Framework:</strong> Perplexity-driven social graph analysis ensures integrity</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-orange-700 mb-4">5. Social Impact Framework</h3>
                    <p className="text-gray-600 mb-4">
                      10-15% of tokens fund vetted non-profits and community initiatives:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Non-Profit Support:</strong> Users donate HDAG tokens, code solutions, or stake tokens with rewards directed to trusted non-profits in education, healthcare, and sustainability</li>
                      <li><strong>Transparency:</strong> Blockchain-verified funding ensures accountability</li>
                      <li><strong>Goals:</strong> Fund 50 clean water projects by 2025, educate 10M learners, and provide healthcare to 100M people by 2027</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-teal-700 mb-4">6. Developer and Creator Empowerment</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>APIs/SDKs:</strong> Reduce integration time by 80% with GitHub Copilot and Cursor</li>
                      <li><strong>Revenue Sharing:</strong> 90-98% for developers and creators, compared to 30-70% on traditional platforms</li>
                      <li><strong>AI Marketplace:</strong> Tokenized platform for AI models and creator content, optimized by Zencoder</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-indigo-700 mb-4">7. Gamified Self-Discovery</h3>
                    <p className="text-gray-600 mb-4">
                      A persona-based onboarding system educates and motivates users:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Personalized Onboarding:</strong> AI (Perplexity) tailors onboarding to user interests and skills, creating unique SBT profiles</li>
                      <li><strong>Leveling Up:</strong> Gamified achievements (e.g., "Community Contributor") reward contributions with tokens and reputation boosts</li>
                      <li><strong>Motivation:</strong> Guides users to monetize passions by connecting them to opportunities via HyperCrowd and the Creator Network</li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-12">Transformative Platforms</h2>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-blue-50 p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-blue-800 mb-3">User Testing Exchange</h3>
                    <p className="text-blue-700 mb-3">A decentralized platform for reciprocal UX evaluation</p>
                    <ul className="text-blue-600 text-sm space-y-1">
                      <li>• Purpose: Matches app owners with reviewers for privacy-preserving feedback</li>
                      <li>• Features: SBT-based reputation, AI matching (Perplexity, Zencoder), gamified rewards, and zk-SNARKs for anonymous reviews</li>
                      <li>• Impact: 5,000 reviewers and 1,000 app submissions in Year 1</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-purple-800 mb-3">Decentralized Service Marketplace</h3>
                    <p className="text-purple-700 mb-3">A marketplace for trading unused service resources</p>
                    <ul className="text-purple-600 text-sm space-y-1">
                      <li>• Purpose: Users buy services (e.g., IPFS storage, Fetch.ai compute) and trade excess capacity for HDAG tokens</li>
                      <li>• Features: SBT-driven trading, AI agents (Fetch.ai, Bittensor), zk-SNARKs, and referral-based revenue sharing</li>
                      <li>• Impact: $500k revenue in Year 1, reducing reliance on centralized providers</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-green-800 mb-3">GrantFlow</h3>
                    <p className="text-green-700 mb-3">An AI-driven platform for funding</p>
                    <ul className="text-green-600 text-sm space-y-1">
                      <li>• Purpose: Matches ideas to community-governed grants using Perplexity and Cursor</li>
                      <li>• Features: Funds social impact projects, with 10-15% token allocation</li>
                      <li>• Impact: $10M+ in community projects by 2026</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-orange-800 mb-3">HyperCrowd</h3>
                    <p className="text-orange-700 mb-3">An AI-optimized team formation engine</p>
                    <ul className="text-orange-600 text-sm space-y-1">
                      <li>• Purpose: Forms teams based on ability, experience, reputation, interest, and passion</li>
                      <li>• Features: SBT-weighted matching ensures meritocratic collaboration</li>
                      <li>• Impact: Connects 1M+ collaborators by 2026</li>
                    </ul>
                  </div>

                  <div className="bg-pink-50 p-6 rounded-lg border md:col-span-2">
                    <h3 className="text-xl font-semibold text-pink-800 mb-3">Creator Network</h3>
                    <p className="text-pink-700 mb-3">An AI-optimized Web3 platform for user-generated content (UGC)</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="text-pink-600 text-sm space-y-1">
                        <li>• Purpose: Empowers creators to keep 90-98% of earnings, unlike 30-70% on traditional platforms</li>
                        <li>• Features: SBTs connect creators directly to audiences, with AI (Perplexity, Cursor) suggesting monetization strategies (e.g., NFTs, subscriptions)</li>
                      </ul>
                      <ul className="text-pink-600 text-sm space-y-1">
                        <li>• Impact: Redefines the creator economy with privacy and efficiency</li>
                        <li>• Cross-platform integration with existing social media</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-6">Tokenomics</h2>
                
                <div className="bg-gray-50 p-6 rounded-lg mb-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Token Distribution</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Total Supply: 8.88B HDG tokens (fixed)</li>
                        <li>• Community: 40%</li>
                        <li>• Social Impact: 10-15%</li>
                        <li>• Ecosystem: 20%</li>
                        <li>• Team: 10%</li>
                        <li>• Treasury: 10%</li>
                        <li>• Stakeholders: 5-10%</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Unique Features</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Transaction fees: 0.0035 HDG, up to 70% SBT discounts</li>
                        <li>• Staking rewards: 8.9% APR</li>
                        <li>• Governance utility</li>
                        <li>• Referral-Based Distribution: Earn tokens by referring services, creators, or non-profits</li>
                        <li>• User Behavior Rewards: Tokens minted for contributions</li>
                        <li>• Revenue Sharing: 90-98% for developers, creators, and contributors</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-6">Governance: Power to the People</h2>
                
                <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
                  <p className="text-gray-600 mb-4">User-driven governance with AI assistance:</p>
                  <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                    <div>function vote(uint256 proposalId, uint256 voteCount) external {`{`}</div>
                    <div className="ml-4">uint256 creditCost = voteCount * voteCount;</div>
                    <div className="ml-4">require(calculateVotingCredits(msg.sender) &gt;= creditCost, "Insufficient credits");</div>
                    <div className="ml-4">proposals[proposalId].userVotes[msg.sender] += voteCount;</div>
                    <div>{`}`}</div>
                  </div>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li><strong>Quadratic and Ranked-Choice Voting:</strong> Balances influence and ensures fair ecosystem tweaks</li>
                    <li><strong>AI Assistance:</strong> Perplexity and Cursor optimize proposal matching, with human-in-the-loop approval</li>
                    <li><strong>Non-Profit Integration:</strong> Community votes prioritize vetted non-profits for funding</li>
                  </ul>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-6">Streamlined Use Cases</h2>
                
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-blue-800 mb-2">DeFi Inclusion</h4>
                    <p className="text-blue-700 text-sm">Juan secures an anonymous loan via SBTs</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-purple-800 mb-2">SkillCert</h4>
                    <p className="text-purple-700 text-sm">Aisha earns a Python certification for freelancing</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-green-800 mb-2">MedAnon</h4>
                    <p className="text-green-700 text-sm">Liam shares diabetic data anonymously, earning rewards</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-orange-800 mb-2">ChainTrust</h4>
                    <p className="text-orange-700 text-sm">Priya certifies goods with zk-SNARKs for fair trade</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-pink-800 mb-2">Creator Network</h4>
                    <p className="text-pink-700 text-sm">Maya monetizes her art channel, keeping 95% of earnings</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-teal-800 mb-2">Non-Profit Support</h4>
                    <p className="text-teal-700 text-sm">Liam codes a solution for a vetted education non-profit, earning tokens</p>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-6">Market Impact</h2>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-8">
                  <p className="text-lg font-semibold text-gray-800 mb-4">By 2027, HyperDAG aims to:</p>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">5%</div>
                      <div className="text-gray-600">of $500B DeFi market</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">1B+</div>
                      <div className="text-gray-600">users served</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">$100M</div>
                      <div className="text-gray-600">annual social impact funding</div>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-gray-700">Capture 10% of the $50B digital education sector and 2% of the $100B healthcare tech market. Fund $100M annually for vetted non-profits and social impact initiatives. Serve 1B users, educate 10M learners, and provide healthcare to 100M lives.</p>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-6">Technology Stack</h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h4 className="font-semibold text-gray-800 mb-3">Frontend & Backend</h4>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• React Native (Expo), TypeScript, Tailwind CSS</li>
                      <li>• Next.js, tRPC, Prisma, PostgreSQL</li>
                    </ul>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h4 className="font-semibold text-gray-800 mb-3">Blockchain & Storage</h4>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• HyperDAG SDK, Polygon, Solana, Ethereum (via LayerZero, Wormhole)</li>
                      <li>• IPFS (via Pinata)</li>
                    </ul>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h4 className="font-semibold text-gray-800 mb-3">AI & Identity</h4>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• Perplexity, Zencoder, GitHub Copilot, Cursor, Fetch.ai, Bittensor</li>
                      <li>• HyperDAG SBTs, Proof of Life, Ceramic Network</li>
                    </ul>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h4 className="font-semibold text-gray-800 mb-3">Tokens</h4>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• ERC-721 (SBTs), ERC-20 (HDG tokens)</li>
                    </ul>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-6">Roadmap</h2>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">Q2</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Q2 2025 (Genesis)</h4>
                      <p className="text-gray-600 text-sm">Launch hybrid DAG, SBTs, mobile PWA, User Testing Exchange, Decentralized Service Marketplace, and non-profit support system</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">Q3</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Q3 2025 (Intelligence)</h4>
                      <p className="text-gray-600 text-sm">Activate AI layer (Perplexity, Zencoder, Copilot, Cursor), GrantFlow, HyperCrowd, and Creator Network</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">Q4</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Q4 2025 (Growth)</h4>
                      <p className="text-gray-600 text-sm">Multi-chain interoperability and developer/creator marketplace</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">26</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">2026 (Impact)</h4>
                      <p className="text-gray-600 text-sm">1M+ users, $10M+ in social impact funding</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">27</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">2027 (Vision)</h4>
                      <p className="text-gray-600 text-sm">Serve 1B people, fund $100M annually</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Performance Snapshot</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <ul className="text-gray-600 space-y-2">
                        <li><strong>Throughput:</strong> 2.4M TPS</li>
                        <li><strong>Latency:</strong> 470ms finality</li>
                        <li><strong>Energy:</strong> 0.08 kJ/Tx</li>
                      </ul>
                    </div>
                    <div>
                      <ul className="text-gray-600 space-y-2">
                        <li><strong>Security:</strong> Quantum-resistant</li>
                        <li><strong>Integrity:</strong> &lt;0.01% Sybil attack success rate</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg text-center">
                  <h3 className="text-2xl font-bold mb-4">Join the Revolution</h3>
                  <p className="mb-6 text-blue-100">
                    HyperDAG is a call to action. Through the User Testing Exchange, Decentralized Service Marketplace, GrantFlow, HyperCrowd, and Creator Network, we empower creators to monetize their passions, support vetted non-profits, and foster self-discovery. With SBTs enabling private, efficient peer-to-peer connections, AI-driven monetization, and user-governed innovation, HyperDAG redefines Web3.
                  </p>
                  <p className="mb-6 text-blue-100">
                    Join us for the <strong>mid-June 2025 demo</strong> and be part of a movement that's bigger than any one of us. Together, we'll empower communities, break down barriers, and build a future where technology serves the greater good.
                  </p>
                  <p className="text-xl font-bold mb-4">Be part of the change. Join HyperDAG today.</p>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 flex items-center mx-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Download Full Lite Paper
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}