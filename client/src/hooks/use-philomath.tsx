import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define learning topics for the Philomath system
export const PHILOMATH_TOPICS = [
  {
    id: "dag-intro",
    title: "Introduction to Directed Acyclic Graphs (DAGs)",
    category: "blockchain",
    level: "beginner",
    content: `
      <h3>What is a Directed Acyclic Graph (DAG)?</h3>
      <p>A Directed Acyclic Graph (DAG) is a graph data structure that uses a topological ordering. It is a finite directed graph with no directed cycles, consisting of vertices and edges, with each edge directed from one vertex to another.</p>
      
      <p>Unlike traditional blockchain structures that group transactions into sequential blocks, DAGs allow for multiple chains of transactions to exist and be processed simultaneously.</p>
      
      <h3>Key Benefits of DAGs in HyperDAG</h3>
      <ul>
        <li><strong>Higher Throughput</strong>: By enabling parallel validation of transactions rather than sequential blocks</li>
        <li><strong>Lower Latency</strong>: Transactions can be confirmed more quickly as they don't need to wait for block formation</li>
        <li><strong>Scalability</strong>: The network can grow and handle more transactions as more users join</li>
        <li><strong>No Miners Needed</strong>: Eliminates the need for energy-intensive mining</li>
      </ul>
      
      <p>In HyperDAG, we implement a hybrid architecture that combines the benefits of DAGs with traditional blockchain features for improved security and transparency.</p>
      
      <h3>How HyperDAG Implements DAGs</h3>
      <p>HyperDAG uses a hybrid approach where transactions are first processed through a DAG structure for high throughput and low latency, then periodically anchored to a blockchain for additional security and immutability.</p>
      
      <p>This approach enables HyperDAG to achieve transaction speeds of over 10,000 TPS while maintaining the security guarantees expected in decentralized systems.</p>
    `
  },
  {
    id: "repid-intro",
    title: "Understanding the RepID Reputation System",
    category: "reputation",
    level: "beginner",
    content: `
      <h3>What is the RepID Reputation System?</h3>
      <p>RepID is HyperDAG's dynamic reputation system that captures your contributions, skills, and engagement across the platform. Unlike traditional web2 rating systems, RepID is fully on-chain, verifiable, and owned by you.</p>
      
      <h3>How RepID Works</h3>
      <p>Your RepID score is built from multiple factors:</p>
      <ul>
        <li><strong>Engagement</strong>: Active participation in the ecosystem</li>
        <li><strong>Verifiable Credentials</strong>: Skills and qualifications verified through our Zero-Knowledge Proof system</li>
        <li><strong>Contributions</strong>: Value added to projects and the community</li>
        <li><strong>Peer Recognition</strong>: Endorsements from other members of the community</li>
      </ul>
      
      <h3>Benefits of RepID</h3>
      <p>With a strong RepID profile, you can:</p>
      <ul>
        <li>Get matched with projects that align with your skills</li>
        <li>Access higher tier grants and funding</li>
        <li>Receive priority for new features and opportunities</li>
        <li>Build trust with potential collaborators</li>
      </ul>
      
      <h3>Privacy in RepID</h3>
      <p>All reputation data is stored using privacy-preserving techniques. You control what aspects of your reputation are public vs. private, and can selectively disclose credentials using Zero-Knowledge Proofs.</p>
    `
  },
  {
    id: "zkp-intro",
    title: "Zero-Knowledge Proofs Explained",
    category: "privacy",
    level: "intermediate",
    content: `
      <h3>What are Zero-Knowledge Proofs (ZKPs)?</h3>
      <p>Zero-Knowledge Proofs are cryptographic methods that allow one party (the prover) to prove to another party (the verifier) that a statement is true without revealing any information beyond the validity of the statement itself.</p>
      
      <h3>Types of Zero-Knowledge Proofs</h3>
      <ul>
        <li><strong>ZK-SNARKs</strong> (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge): Compact proofs that can be verified quickly</li>
        <li><strong>ZK-STARKs</strong> (Zero-Knowledge Scalable Transparent Arguments of Knowledge): More scalable and quantum-resistant than SNARKs, but with larger proof sizes</li>
        <li><strong>Bulletproofs</strong>: Efficient for proving ranges without a trusted setup</li>
      </ul>
      
      <h3>ZKPs in HyperDAG</h3>
      <p>HyperDAG uses Zero-Knowledge Proofs to enable:</p>
      <ul>
        <li><strong>Private Transactions</strong>: Send and receive assets without revealing wallet balances or transaction amounts</li>
        <li><strong>Credential Verification</strong>: Prove you possess certain skills or qualifications without revealing the credentials themselves</li>
        <li><strong>Identity Verification</strong>: Confirm your identity while maintaining privacy</li>
        <li><strong>Compliance</strong>: Demonstrate regulatory compliance without exposing sensitive information</li>
      </ul>
      
      <p>By implementing the Plonky3 ZK framework, HyperDAG achieves significantly faster proof generation and verification times compared to traditional ZK implementations.</p>
    `
  },
  {
    id: "4fa-intro",
    title: "Four-Factor Authentication & Proof of Life",
    category: "security",
    level: "intermediate",
    content: `
      <h3>What is Four-Factor Authentication (4FA)?</h3>
      <p>Four-Factor Authentication (4FA) is HyperDAG's advanced security system that extends beyond traditional two-factor authentication by incorporating biometric and behavioral authentication factors.</p>
      
      <h3>The Four Factors</h3>
      <ol>
        <li><strong>Knowledge</strong>: Something you know (password, PIN)</li>
        <li><strong>Possession</strong>: Something you have (mobile device, hardware token)</li>
        <li><strong>Inherence</strong>: Something you are (biometrics like fingerprint or facial recognition)</li>
        <li><strong>Behavior</strong>: Something you do (typing patterns, gesture recognition, interaction patterns)</li>
      </ol>
      
      <h3>Proof of Life in HyperDAG</h3>
      <p>Proof of Life is a specialized implementation of 4FA that adds an additional layer of security by verifying the user is:</p>
      <ul>
        <li>A real person (not a bot)</li>
        <li>Currently present (not a replay attack)</li>
        <li>Acting voluntarily (not under duress)</li>
      </ul>
      
      <p>This is particularly important for high-value transactions, critical account changes, and governance voting.</p>
      
      <h3>Privacy Considerations</h3>
      <p>All biometric and behavioral data is processed on-device and never stored in its raw form. Only encrypted, non-reversible hashes are used for verification, ensuring your privacy is maintained.</p>
    `
  },
  {
    id: "hypercrowd-intro",
    title: "HyperCrowd: Decentralized Crowdfunding with Grant Matching",
    category: "funding",
    level: "beginner",
    content: `
      <h3>What is HyperCrowd?</h3>
      <p>HyperCrowd is HyperDAG's decentralized crowdfunding platform with an innovative grant matching system. It connects project creators with funders and additional grant resources to maximize impact.</p>
      
      <h3>Key Features</h3>
      <ul>
        <li><strong>Quadratic Funding</strong>: Contributions are matched using a quadratic formula that gives more weight to projects with broad community support rather than a few large donors</li>
        <li><strong>Grant Matching</strong>: Projects are automatically matched with compatible grants from partner organizations</li>
        <li><strong>Team Formation</strong>: AI-powered team matching helps connect projects with collaborators who have complementary skills</li>
        <li><strong>Milestone-Based Funding</strong>: Funds are released as project milestones are achieved and verified</li>
      </ul>
      
      <h3>The HyperCrowd Process</h3>
      <ol>
        <li><strong>Project Creation</strong>: Creators define their project, goals, and funding needs</li>
        <li><strong>Team Formation</strong>: AI helps match creators with potential team members</li>
        <li><strong>Community Funding</strong>: The community contributes to projects they support</li>
        <li><strong>Grant Matching</strong>: Additional funds are matched from the grant pool</li>
        <li><strong>Milestone Verification</strong>: Progress is verified on-chain as milestones are completed</li>
        <li><strong>Fund Distribution</strong>: Funds are released as milestones are achieved</li>
      </ol>
      
      <p>All HyperCrowd activities contribute to your RepID score, helping you build reputation as you collaborate and contribute.</p>
    `
  },
  {
    id: "grantflow-intro",
    title: "GrantFlow: AI-Powered Grant and Team Matching",
    category: "ai",
    level: "intermediate",
    content: `
      <h3>What is GrantFlow?</h3>
      <p>GrantFlow is HyperDAG's AI engine that powers the intelligent matching between projects, team members, and grant opportunities. It analyzes project requirements, user skills, and available funding to create optimal matches.</p>
      
      <h3>How GrantFlow Works</h3>
      <p>GrantFlow uses several AI components:</p>
      <ul>
        <li><strong>Natural Language Processing</strong>: Understands project descriptions and requirements</li>
        <li><strong>Skill Graph Analysis</strong>: Maps relationships between different skills and identifies complementary skill sets</li>
        <li><strong>Collaborative Filtering</strong>: Recommends collaborations based on successful past partnerships</li>
        <li><strong>Grant Alignment</strong>: Matches projects with grant opportunities based on goals, requirements, and success probability</li>
      </ul>
      
      <h3>Benefits of GrantFlow</h3>
      <ul>
        <li><strong>For Project Creators</strong>: Find the right team members and funding sources</li>
        <li><strong>For Contributors</strong>: Discover projects that match your skills and interests</li>
        <li><strong>For Grant Providers</strong>: Connect with high-potential projects aligned with your mission</li>
      </ul>
      
      <p>GrantFlow continuously improves by learning from successful collaborations and project outcomes, making matches more effective over time.</p>
    `
  },
  {
    id: "token-economics",
    title: "HDAG Token Economics",
    category: "tokenomics",
    level: "intermediate",
    content: `
      <h3>The HDAG Token</h3>
      <p>The HDAG token is the native utility token of the HyperDAG ecosystem, designed with a sustainable economic model that aligns incentives across users, developers, and the broader community.</p>
      
      <h3>Token Utility</h3>
      <ul>
        <li><strong>Transaction Fees</strong>: Used to pay for transactions on the network</li>
        <li><strong>Staking</strong>: Stake HDAG to help secure the network and earn rewards</li>
        <li><strong>Governance</strong>: Vote on protocol upgrades and ecosystem fund allocations</li>
        <li><strong>Grant Matching</strong>: Contribute to the grant matching pool for HyperCrowd</li>
        <li><strong>Premium Features</strong>: Access advanced analytics and priority services</li>
      </ul>
      
      <h3>Token Distribution</h3>
      <p>HDAG tokens are distributed with a focus on long-term sustainability:</p>
      <ul>
        <li><strong>Ecosystem Growth</strong>: 40% - Allocated to grants, developer incentives, and community building</li>
        <li><strong>Team & Development</strong>: 20% - Subject to 4-year vesting with a 1-year cliff</li>
        <li><strong>Community Rewards</strong>: 15% - Distributed through participation rewards and referrals</li>
        <li><strong>Liquidity Provision</strong>: 10% - Ensuring trading liquidity across exchanges</li>
        <li><strong>Strategic Partners</strong>: 10% - For strategic integrations and partnerships</li>
        <li><strong>Reserve</strong>: 5% - Long-term ecosystem stability reserve</li>
      </ul>
      
      <h3>Deflationary Mechanisms</h3>
      <p>To ensure long-term token value, HyperDAG implements:</p>
      <ul>
        <li><strong>Fee Burning</strong>: A portion of transaction fees are permanently removed from circulation</li>
        <li><strong>Buyback Program</strong>: Revenue from premium services is used to buy and burn tokens</li>
        <li><strong>Reward Halving</strong>: Participation rewards decrease over time as adoption increases</li>
      </ul>
    `
  },
  {
    id: "governance-intro",
    title: "Decentralized Governance in HyperDAG",
    category: "governance",
    level: "advanced",
    content: `
      <h3>HyperDAG Governance Model</h3>
      <p>HyperDAG implements a multi-layered governance system that balances decentralization with efficient decision-making, allowing the ecosystem to evolve while maintaining stability.</p>
      
      <h3>Governance Layers</h3>
      <ol>
        <li><strong>Protocol Layer</strong>: Fundamental protocol changes requiring high consensus thresholds</li>
        <li><strong>Ecosystem Layer</strong>: Decisions about grants, partnerships, and ecosystem initiatives</li>
        <li><strong>Community Layer</strong>: Day-to-day operational decisions and smaller updates</li>
      </ol>
      
      <h3>Voting Mechanisms</h3>
      <p>HyperDAG uses a combination of voting mechanisms:</p>
      <ul>
        <li><strong>Token-Weighted Voting</strong>: Basic voting power based on HDAG holdings</li>
        <li><strong>Reputation-Enhanced Voting</strong>: Voting power adjusted by RepID score to reward active and valuable community members</li>
        <li><strong>Quadratic Voting</strong>: For certain decisions, to prevent plutocracy and promote broad consensus</li>
        <li><strong>Delegation</strong>: Allow users to delegate their voting power to trusted experts</li>
      </ul>
      
      <h3>Proposal Process</h3>
      <ol>
        <li><strong>Ideation</strong>: Community discussion in the forum</li>
        <li><strong>HIP Draft</strong>: Formal HyperDAG Improvement Proposal creation</li>
        <li><strong>Review Period</strong>: Community feedback and refinement</li>
        <li><strong>Voting</strong>: On-chain voting by token holders and RepID participants</li>
        <li><strong>Implementation</strong>: Successful proposals are implemented by the core team or community contributors</li>
      </ol>
      
      <p>All governance activities contribute to your RepID score, incentivizing thoughtful participation in the ecosystem's evolution.</p>
    `
  }
];

interface PhilomathContextType {
  showTopic: (topicId: string) => void;
  isEnabled: boolean;
  toggleEnabled: () => void;
  viewedTopics: Set<string>;
  completedTopics: Set<string>;
  bookmarkedTopics: Set<string>;
  markTopicViewed: (topicId: string) => Promise<void>;
  markTopicCompleted: (topicId: string) => Promise<void>;
  toggleBookmark: (topicId: string) => Promise<void>;
  isTopicBookmarked: (topicId: string) => boolean;
  isTopicCompleted: (topicId: string) => boolean;
  isTopicViewed: (topicId: string) => boolean;
}

const PhilomathContext = createContext<PhilomathContextType | null>(null);

export function PhilomathProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // State for learning mode enabled/disabled
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  
  // State for topic tracking
  const [viewedTopics, setViewedTopics] = useState<Set<string>>(new Set());
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [bookmarkedTopics, setBookmarkedTopics] = useState<Set<string>>(new Set());
  
  // Fetch the user's philomath settings and progress from the server
  const { data: philomathData } = useQuery<{success: boolean, data: {viewed: string[], completed: string[], bookmarked: string[], disabled: boolean}}>({ 
    queryKey: ["/api/philomath/user/progress"],
  });
  
  // Update state when the data changes
  useEffect(() => {
    if (philomathData?.success) {
      // Update state with the user's progress
      setIsEnabled(philomathData.data.disabled !== true); // If the field doesn't exist or is false, defaults to true
      setViewedTopics(new Set(philomathData.data.viewed || []));
      setCompletedTopics(new Set(philomathData.data.completed || []));
      setBookmarkedTopics(new Set(philomathData.data.bookmarked || []));
    }
  }, [philomathData]);
  
  // Mutation to update the enabled/disabled state
  const toggleEnabledMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/philomath/user/toggle", { disabled: isEnabled });
    },
    onSuccess: () => {
      setIsEnabled(!isEnabled);
      toast({
        title: isEnabled ? "Learning mode disabled" : "Learning mode enabled",
        description: isEnabled 
          ? "You won't see educational popups anymore." 
          : "You'll now see educational popups throughout the app.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update learning preferences",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Mutation to mark a topic as viewed
  const markViewedMutation = useMutation({
    mutationFn: async (topicId: string) => {
      return await apiRequest("POST", "/api/philomath/user/viewed", { topicId });
    },
    onSuccess: (_, topicId) => {
      setViewedTopics((prev) => {
        const newSet = new Set(prev);
        newSet.add(topicId);
        return newSet;
      });
    },
    onError: (error) => {
      console.error("Error marking topic as viewed:", error);
    },
  });
  
  // Mutation to mark a topic as completed
  const markCompletedMutation = useMutation({
    mutationFn: async (topicId: string) => {
      return await apiRequest("POST", "/api/philomath/user/completed", { topicId });
    },
    onSuccess: (_, topicId) => {
      setCompletedTopics((prev) => {
        const newSet = new Set(prev);
        newSet.add(topicId);
        return newSet;
      });
      toast({
        title: "Topic completed!",
        description: "Your learning progress has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark topic as completed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Mutation to toggle a topic bookmark
  const toggleBookmarkMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const isBookmarked = bookmarkedTopics.has(topicId);
      return await apiRequest("POST", "/api/philomath/user/bookmark", { 
        topicId, 
        bookmarked: !isBookmarked 
      });
    },
    onSuccess: (_, topicId) => {
      setBookmarkedTopics((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(topicId)) {
          newSet.delete(topicId);
        } else {
          newSet.add(topicId);
        }
        return newSet;
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update bookmark",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Function to show a specific topic
  const showTopic = (topicId: string) => {
    // This function will be implemented by components that use this context
    // It's mainly for the Philomath modal to know which topic to display
  };
  
  // Helper functions to check topic status
  const isTopicBookmarked = (topicId: string) => bookmarkedTopics.has(topicId);
  const isTopicCompleted = (topicId: string) => completedTopics.has(topicId);
  const isTopicViewed = (topicId: string) => viewedTopics.has(topicId);
  
  // Wrapper functions for mutations
  const markTopicViewed = async (topicId: string): Promise<void> => {
    if (!viewedTopics.has(topicId)) {
      await markViewedMutation.mutateAsync(topicId);
    }
  };
  
  const markTopicCompleted = async (topicId: string): Promise<void> => {
    await markCompletedMutation.mutateAsync(topicId);
  };
  
  const toggleBookmark = async (topicId: string): Promise<void> => {
    await toggleBookmarkMutation.mutateAsync(topicId);
  };
  
  const toggleEnabled = () => {
    toggleEnabledMutation.mutate();
  };
  
  return (
    <PhilomathContext.Provider
      value={{
        showTopic,
        isEnabled,
        toggleEnabled,
        viewedTopics,
        completedTopics,
        bookmarkedTopics,
        markTopicViewed,
        markTopicCompleted,
        toggleBookmark,
        isTopicBookmarked,
        isTopicCompleted,
        isTopicViewed,
      }}
    >
      {children}
    </PhilomathContext.Provider>
  );
}

export function usePhilomath() {
  const context = useContext(PhilomathContext);
  if (!context) {
    throw new Error("usePhilomath must be used within a PhilomathProvider");
  }
  return context;
}
