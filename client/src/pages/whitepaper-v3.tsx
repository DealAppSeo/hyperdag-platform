import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Code, Shield, Zap, Users } from "lucide-react";

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              HyperDAG Technical Whitepaper
            </h1>
            <p className="text-2xl text-gray-700 mb-2">
              A Comprehensive Technical Whitepaper
            </p>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-4">
              Empowering Communities through a Privacy-First, AI-Optimized, Hybrid DAG-Blockchain Ecosystem
            </p>
            <div className="text-lg text-gray-500 mb-8">Version 4.2 | June 2025</div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-2xl font-bold text-blue-600">2.4M</div>
                <div className="text-sm text-gray-600">TPS Performance</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-2xl font-bold text-purple-600">470ms</div>
                <div className="text-sm text-gray-600">Finality Time</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-2xl font-bold text-green-600">0.08</div>
                <div className="text-sm text-gray-600">kJ per Transaction</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-2xl font-bold text-orange-600">1575x</div>
                <div className="text-sm text-gray-600">More Efficient</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                Download Full Whitepaper
              </Button>
              <Button variant="outline">
                <Code className="mr-2 h-4 w-4" />
                View Code Examples
              </Button>
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                API Documentation
              </Button>
            </div>
            <div className="text-sm text-gray-500 mt-4">
              MVP Demo Launch: Mid-June 2025
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              
              {/* Abstract */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Abstract</h2>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    HyperDAG is a transformative Web3 platform integrating a hybrid Directed Acyclic Graph (DAG) and blockchain architecture with AI-driven optimization, quantum-resistant cryptography, and modular cross-chain interoperability. Achieving aspirational performance of 2.4M transactions per second (TPS), 470ms finality, and 0.08 kJ per transaction, HyperDAG addresses the blockchain trilemma—scalability, security, and decentralization—through fuzzy logic, intelligent self-learning agents, and Soul Bound Tokens (SBTs) as ZKP NFTs for both users and AI agents.
                  </p>
                </div>
              </div>

              {/* Mission and Vision */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Mission and Vision</h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">Mission</h3>
                    <p className="text-gray-700">
                      HyperDAG empowers individuals, creators, and AI agents with self-sovereign identities and equitable governance through a scalable, AI-optimized hybrid DAG-blockchain. By fostering meritocratic opportunities, gamified self-discovery, and support for vetted non-profits, we dismantle barriers for a decentralized, thriving Web3 economy.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-green-800 mb-4">Vision by 2027</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>• Support 1B people with financial inclusion tools</li>
                      <li>• Educate 10M individuals via blockchain-verified credentials</li>
                      <li>• Provide healthcare access to 100M through telemedicine and AI diagnostics</li>
                      <li>• Fund $100M annually in vetted non-profits and social impact initiatives</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Core Values</h4>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="font-medium text-blue-800">Privacy</div>
                      <div className="text-sm text-gray-600">Users and agents control data via ZKPs</div>
                    </div>
                    <div className="text-center">
                      <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="font-medium text-purple-800">Meritocracy</div>
                      <div className="text-sm text-gray-600">Success based on contributions</div>
                    </div>
                    <div className="text-center">
                      <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="font-medium text-green-800">Social Impact</div>
                      <div className="text-sm text-gray-600">Technology addresses global challenges</div>
                    </div>
                    <div className="text-center">
                      <Code className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <div className="font-medium text-orange-800">Community Governance</div>
                      <div className="text-sm text-gray-600">Quadratic and star voting</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Architecture */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Technical Architecture</h2>
                
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-blue-700 mb-4">Hybrid DAG-Blockchain Foundation</h3>
                    <p className="text-gray-600 mb-4">
                      HyperDAG combines DAG's parallel processing with blockchain checkpoints:
                    </p>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">DAG Layer</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Asynchronous transaction confirmation</li>
                          <li>• Natural sharding</li>
                          <li>• 0.08 kJ/Tx energy efficiency</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Blockchain Checkpoints</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Anchoring to Polygon and Solana</li>
                          <li>• Ensures immutability</li>
                          <li>• Cross-chain verification</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Performance</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• 2.4M TPS throughput</li>
                          <li>• 470ms finality</li>
                          <li>• 1575x more efficient than Ethereum PoS</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-purple-700 mb-4">Modular Agglayer Architecture</h3>
                    <p className="text-gray-600 mb-4">
                      The aggregation layer ensures interoperability:
                    </p>
                    <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                      <div>def shard_allocation(node_count, network_load, agglayer_params):</div>
                      <div className="ml-4">base_shards = math.ceil(network_load / BASE_CAPACITY)</div>
                      <div className="ml-4">fuzzy_output = fuzzy_logic_optimize(agglayer_params, node_count)</div>
                      <div className="ml-4">ai_agent_boost = agent_optimizer(network_load, sbt_reputation)</div>
                      <div className="ml-4">return min(node_count / MIN_NODES_PER_SHARD, max(1, base_shards * fuzzy_output * ai_agent_boost))</div>
                    </div>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Polygon Miden:</strong> Client-side ZKP validation (Groth16 zk-SNARKs)</li>
                      <li><strong>Cross-Chain:</strong> LayerZero, Wormhole, IBC, XCMP</li>
                      <li><strong>AI Agents:</strong> Self-learning agents with SBTs optimize shard allocation</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Soul Bound Token Identity System */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Soul Bound Token Identity System</h2>
                
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-green-700 mb-4">SBT Architecture</h3>
                    <p className="text-gray-600 mb-4">
                      SBTs provide self-sovereign identities for users and AI agents:
                    </p>
                    <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                      <div>struct SoulBoundToken {`{`}</div>
                      <div className="ml-4">address owner; // User or AI agent</div>
                      <div className="ml-4">uint256 reputationScore;</div>
                      <div className="ml-4">mapping(string {`=>`} uint256) skills; // e.g., coding, UX, AI model training</div>
                      <div className="ml-4">mapping(string {`=>`} bool) certifications;</div>
                      <div className="ml-4">mapping(string {`=>`} uint256) interests; // e.g., education, healthcare</div>
                      <div className="ml-4">uint256 contributionHistory;</div>
                      <div className="ml-4">uint256[] projectParticipation;</div>
                      <div>{`}`}</div>
                    </div>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>AI Agent SBTs:</strong> ZKP NFTs (ERC-7645) with Groth16 zk-SNARKs verify agent actions privately</li>
                      <li><strong>Interoperability:</strong> Compatible with Ethereum, Solana, Polkadot, Cosmos</li>
                      <li><strong>Privacy:</strong> Plonky3 zk-STARKs enable selective disclosure</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-orange-700 mb-4">Reputation Scoring</h3>
                    <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                      <div>def calculate_reputation(contributions, peer_reviews, project_success, governance):</div>
                      <div className="ml-4">weights = {`{'contributions': 0.3, 'peer_reviews': 0.25, 'project_success': 0.2, 'governance': 0.15, 'social_impact': 0.1}`}</div>
                      <div className="ml-4">score = sum(weights[cat] * value for cat, value in categories.items())</div>
                      <div className="ml-4">return min(score * zkp_verify(contributions, 'groth16'), 1000)</div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Categories</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Technical contributions (30%)</li>
                          <li>• Peer engagement (25%)</li>
                          <li>• Project leadership (20%)</li>
                          <li>• Governance participation (15%)</li>
                          <li>• Social impact (10%)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Verification</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• ZKP Verification: Groth16 ensures authenticity</li>
                          <li>• Contribution tracking via blockchain</li>
                          <li>• Peer validation mechanisms</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI-Driven Optimization Layer */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">AI-Driven Optimization Layer</h2>
                
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-blue-700 mb-4">Neural Consensus Engine</h3>
                    <p className="text-gray-600 mb-4">
                      The Dynamic Validator Neural Network (DVNN) optimizes consensus:
                    </p>
                    <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                      <div>def dvnn_consensus(stake, reputation, latency, network_state):</div>
                      <div className="ml-4">validator_weight = (stake ** 0.7) * (reputation ** 1.3) * (latency ** 0.4)</div>
                      <div className="ml-4">ai_boost = agent_optimizer(network_state, sbt_reputation)</div>
                      <div className="ml-4">return validator_weight * ai_boost</div>
                    </div>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Tools:</strong> GitHub Copilot for validator code, Perplexity for network analysis, Zencoder for data efficiency</li>
                      <li><strong>Features:</strong> Adaptive finality (470ms), 92% energy recapture</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-purple-700 mb-4">Intelligent Transaction Routing</h3>
                    <p className="text-gray-600 mb-4">
                      AI agents with SBTs optimize transaction paths:
                    </p>
                    <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                      <div>def intelligent_route(transaction, agglayer_state, agent_sbt):</div>
                      <div className="ml-4">factors = analyze_transaction(transaction, agent_sbt)</div>
                      <div className="ml-4">networks = get_network_status(agglayer_state)</div>
                      <div className="ml-4">fuzzy_output = fuzzy_logic_model.predict_best_route(factors, networks)</div>
                      <div className="ml-4">zkp_proof = groth16_generate_proof(transaction, agent_sbt)</div>
                      <div className="ml-4">return execute_cross_chain_transaction(fuzzy_output, zkp_proof)</div>
                    </div>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>ZKP:</strong> Groth16 verifies transaction integrity</li>
                      <li><strong>Agents:</strong> SBTs ensure meritocratic routing decisions</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-green-700 mb-4">Decentralized AI Marketplace</h3>
                    <p className="text-gray-600 mb-4">
                      A tokenized platform for AI models and creator content:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Model Licensing:</strong> Fractional NFT ownership (ERC-7645)</li>
                      <li><strong>Data Provenance:</strong> Plonky3 zk-STARKs verify model authenticity</li>
                      <li><strong>Royalty Distribution:</strong> Real-time micropayments via DAG-L2</li>
                      <li><strong>Quality Assurance:</strong> GitHub Copilot validates code, Perplexity assesses model performance</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-orange-700 mb-4">Federated Learning Framework</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Differential Privacy:</strong> ε=0.37 noise injection</li>
                      <li><strong>Secure Aggregation:</strong> Multi-party computation across 240k+ edge devices</li>
                      <li><strong>Incentives:</strong> 82% rewards via SBT scores</li>
                      <li><strong>Agents:</strong> SBT-equipped agents optimize learning tasks</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Privacy and Security Framework */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Privacy and Security Framework</h2>
                
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-red-700 mb-4">Zero-Knowledge Proofs</h3>
                    <p className="text-gray-600 mb-4">
                      ZKPs enable private verification:
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Groth16 zk-SNARKs</h4>
                        <div className="bg-gray-100 p-3 rounded text-xs font-mono mb-2">
                          <div>def groth16_verify(contribution, proof, public_inputs):</div>
                          <div className="ml-2">setup = load_groth16_setup()</div>
                          <div className="ml-2">return verify_proof(setup, proof, public_inputs)  # O(1) verification</div>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Verifies contributions privately</li>
                          <li>• Constant-time verification</li>
                          <li>• ~200ms proof generation</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Plonky3 zk-STARKs</h4>
                        <div className="bg-gray-100 p-3 rounded text-xs font-mono mb-2">
                          <div>def plonky3_verify(agent_action, proof, commitment):</div>
                          <div className="ml-2">return plonky3_verify_proof(proof, commitment, FRI_params)  # Scalable, transparent</div>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Verifies AI agent actions</li>
                          <li>• No trusted setup</li>
                          <li>• Quantum-resistant</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-blue-700 mb-4">Quantum-Resistant Cryptography</h3>
                    <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                      <div>interface HyperEncryption {`{`}</div>
                      <div className="ml-4">keyExchange: 'CRYSTALS-Kyber-1024';</div>
                      <div className="ml-4">signature: 'CRYSTALS-Dilithium-5';</div>
                      <div className="ml-4">zkProofs: ['groth16', 'plonky3'];</div>
                      <div>{`}`}</div>
                    </div>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Key Exchange:</strong> CRYSTALS-Kyber-1024</li>
                      <li><strong>Signatures:</strong> CRYSTALS-Dilithium-5</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-green-700 mb-4">Proof of Life (PoL)</h3>
                    <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                      <div>function proveLife(bytes32 challengeHash, bytes memory response) external {`{`}</div>
                      <div className="ml-4">require(verifyZKProof(response, 'plonky3'), "Invalid proof");</div>
                      <div className="ml-4">bool isHuman = verifyHumanResponse(response, challengeHash);</div>
                      <div className="ml-4">require(isHuman, "PoL failed");</div>
                      <div className="ml-4">updateReputationScore(msg.sender);</div>
                      <div>{`}`}</div>
                    </div>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Challenges:</strong> Biometric, behavioral, temporal</li>
                      <li><strong>Privacy:</strong> Plonky3 zk-STARKs mask responses</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-purple-700 mb-4">Anti-Sybil Framework</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Biometric Fingerprinting:</strong> 37-parameter analysis</li>
                      <li><strong>Reputation Decay:</strong> 12% hourly drop for suspicious activity</li>
                      <li><strong>Agent Oversight:</strong> SBT-equipped agents detect anomalies via Perplexity</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tokenomics */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Tokenomics and Incentive Structure</h2>
                
                <div className="space-y-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
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
                          <li>• Vesting: Linear over 2-5 years</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Token Utility</h4>
                        <ul className="text-gray-600 space-y-1">
                          <li>• Fees: 0.0035 HDG, up to 70% SBT discounts</li>
                          <li>• Staking: 8.9% APR + SBT bonuses</li>
                          <li>• Governance: Voting power = √(HDG_Tokens) × SBT_Reputation_Score</li>
                          <li>• Referral System: Three-way reward split</li>
                          <li>• Behavior Rewards: Tokens minted for contributions</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-green-700 mb-4">Revenue Sharing</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>Creators/Developers:</strong> 90-98% revenue share</li>
                      <li><strong>Platform:</strong> 2-10% for infrastructure and non-profits</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Governance */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Governance and Community</h2>
                
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-blue-700 mb-4">Multi-Tier Governance</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <ul className="text-gray-600 space-y-2">
                          <li><strong>Technical:</strong> Validator/developer voting on upgrades</li>
                          <li><strong>Economic:</strong> Token holder voting on fees</li>
                        </ul>
                      </div>
                      <div>
                        <ul className="text-gray-600 space-y-2">
                          <li><strong>Social Impact:</strong> Quadratic and ranked-choice voting for non-profit funding</li>
                          <li><strong>Strategic:</strong> Community-driven roadmap</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-purple-700 mb-4">Quadratic and Star Voting</h3>
                    <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                      <div>function vote(uint256 proposalId, uint256 voteCount, uint256[] starRatings) external {`{`}</div>
                      <div className="ml-4">uint256 creditCost = voteCount * voteCount;</div>
                      <div className="ml-4">require(calculateVotingCredits(msg.sender) {`>=`} creditCost, "Insufficient credits");</div>
                      <div className="ml-4">require(verifyZKProof(starRatings, 'groth16'), "Invalid star ratings");</div>
                      <div className="ml-4">proposals[proposalId].userVotes[msg.sender] += voteCount;</div>
                      <div className="ml-4">updateStarRatings(proposalId, starRatings);</div>
                      <div>{`}`}</div>
                    </div>
                    <p className="text-gray-600">Benefits: Balances influence, ensures fair ecosystem tweaks</p>
                  </div>
                </div>
              </div>

              {/* Social Impact */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Social Impact Integration</h2>
                
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-green-700 mb-4">Theory of Change</h3>
                    <p className="text-gray-600 mb-4">
                      HyperDAG addresses global challenges:
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <ul className="text-gray-600 space-y-2">
                          <li><strong>Financial Inclusion:</strong> Microfinance, transparent supply chains</li>
                          <li><strong>Education:</strong> Blockchain-verified credentials for 10M learners</li>
                        </ul>
                      </div>
                      <div>
                        <ul className="text-gray-600 space-y-2">
                          <li><strong>Healthcare:</strong> Telemedicine for 100M people</li>
                          <li><strong>Sustainability:</strong> 50 clean water projects by 2025</li>
                        </ul>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-4">
                      <strong>Non-Profit Support:</strong> Users donate tokens, code solutions, or stake rewards to vetted non-profits.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-blue-700 mb-4">Transparent Funding</h3>
                    <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                      <div>contract TransparentFunding {`{`}</div>
                      <div className="ml-4">function releaseFunds(uint256 projectId, uint256 allocationIndex) external {`{`}</div>
                      <div className="ml-8">FundAllocation storage allocation = projectAllocations[projectId][allocationIndex];</div>
                      <div className="ml-8">require(verifyZKProof(allocation.milestone, 'plonky3'), "Milestone not verified");</div>
                      <div className="ml-8">hyperDAGToken.transfer(getProjectWallet(projectId), allocation.amount);</div>
                      <div className="ml-8">emit FundsReleased(projectId, allocation.amount, block.timestamp);</div>
                      <div className="ml-4">{`}`}</div>
                      <div>{`}`}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Use Cases */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Key Use Cases and Market Impact</h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-blue-800 mb-2">DeFi Inclusion</h4>
                    <p className="text-blue-700 text-sm">Anonymous loans via SBTs (e.g., Juan, a farmer)</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-purple-800 mb-2">SkillCert</h4>
                    <p className="text-purple-700 text-sm">Micro-credentials for freelancing (e.g., Aisha's Python certification)</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-green-800 mb-2">MedAnon</h4>
                    <p className="text-green-700 text-sm">Anonymous health data sharing (e.g., Liam's diabetic data)</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-orange-800 mb-2">ChainTrust</h4>
                    <p className="text-orange-700 text-sm">ZKP-certified supply chains (e.g., Priya's goods)</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-pink-800 mb-2">Creator Network</h4>
                    <p className="text-pink-700 text-sm">Maya earns 95% from her art channel</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-teal-800 mb-2">Non-Profit Support</h4>
                    <p className="text-teal-700 text-sm">Liam codes for an education non-profit, staking rewards</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Market Impact Targets</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">5%</div>
                      <div className="text-gray-600">of $500B DeFi market</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">10%</div>
                      <div className="text-gray-600">of $50B digital education</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">2%</div>
                      <div className="text-gray-600">of $100B healthcare tech</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-gray-700">Impact: $100M annual funding for non-profits, 1B users served by 2027</p>
                  </div>
                </div>
              </div>

              {/* Performance Analysis */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Performance Analysis</h2>
                
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-blue-700 mb-4">Throughput Analysis</h3>
                    <div className="bg-gray-100 p-4 rounded text-sm font-mono mb-4">
                      <div>def analyze_throughput():</div>
                      <div className="ml-4">dag_tps = 2_800_000</div>
                      <div className="ml-4">blockchain_overhead = 0.85</div>
                      <div className="ml-4">agent_boost = agent_optimizer(network_state, sbt_reputation)</div>
                      <div className="ml-4">return dag_tps * blockchain_overhead * agent_boost</div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-green-700 mb-4">Energy Efficiency</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">0.08</div>
                        <div className="text-gray-600">kJ/Tx HyperDAG</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">1575x</div>
                        <div className="text-gray-600">Better than Ethereum PoS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">92%</div>
                        <div className="text-gray-600">Energy recapture</div>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-4">
                      <strong>Optimizations:</strong> DAG (67%), AI agents (18%), ZKPs (8%)
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-xl font-semibold text-purple-700 mb-4">Security Metrics</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li><strong>ZKP Resistance:</strong> Groth16 and Plonky3 ensure quantum resistance</li>
                      <li><strong>Sybil Resistance:</strong> {`<`}0.01% attack success rate</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Roadmap */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Development Roadmap</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">Q2</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Q2 2025 (Genesis)</h4>
                      <p className="text-gray-600 text-sm">Hybrid DAG, SBTs, PWA, User Testing Exchange, Service Marketplace, non-profit system</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">Q3</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Q3 2025 (Intelligence)</h4>
                      <p className="text-gray-600 text-sm">AI layer, GrantFlow, HyperCrowd, Creator Network</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">Q4</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Q4 2025 (Growth)</h4>
                      <p className="text-gray-600 text-sm">Multi-chain interoperability</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">26</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">2026 (Impact)</h4>
                      <p className="text-gray-600 text-sm">1M+ users, $10M+ impact funding</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">27</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">2027 (Vision)</h4>
                      <p className="text-gray-600 text-sm">1B people, $100M annually</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conclusion */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg text-center">
                  <h2 className="text-3xl font-bold mb-4">Conclusion</h2>
                  <p className="text-blue-100 leading-relaxed">
                    HyperDAG redefines Web3 with a hybrid DAG-blockchain, AI-driven optimization, and SBT-based identities for users and agents. By integrating Groth16 zk-SNARKs, Plonky3 zk-STARKs, and self-learning agents, HyperDAG creates a zero-trust, peer-to-peer ecosystem that empowers creators, supports non-profits, and fosters global impact. Join us to build a future where technology serves humanity.
                  </p>
                  <div className="mt-6">
                    <Button className="bg-white text-blue-600 hover:bg-blue-50 mr-4">
                      <Download className="mr-2 h-4 w-4" />
                      Download Complete Whitepaper
                    </Button>
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Documentation
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}