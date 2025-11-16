import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// SDK documentation and examples for lovable.dev integration
export function IntegrationApiSdk() {
  const apiEndpoints = [
    {
      name: 'Authentication',
      path: '/api/auth',
      description: 'Authenticate users and obtain authentication tokens',
      method: 'POST',
      request: `{
  "username": "string",
  "password": "string",
  "useZkp": true
}`,
      response: `{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "expiresIn": 3600,
    "refreshToken": "refresh_token_here"
  }
}`
    },
    {
      name: 'Reputation Verification',
      path: '/api/reputation/verify',
      description: 'Verify a user\'s reputation score with ZKP',
      method: 'POST',
      request: `{
  "username": "string",
  "minimumScore": 10,
  "preservePrivacy": true,
  "includeProof": true
}`,
      response: `{
  "success": true,
  "data": {
    "verified": true,
    "metThreshold": true,
    "zkProof": {
      "proof": "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      "publicSignals": ["0x123...", "0x456..."],
      "verified": true
    }
  }
}`
    },
    {
      name: 'Forum Integration',
      path: '/api/forum/post',
      description: 'Create forum posts with reputation verification',
      method: 'POST',
      request: `{
  "content": "string",
  "authorId": "string",
  "useReputation": true,
  "privacyLevel": "private"
}`,
      response: `{
  "success": true,
  "data": {
    "postId": "string",
    "timestamp": "ISO date string",
    "authorReputation": {
      "verified": true,
      "nullifier": "0x8f7e6d5c4b3a2910",
      "commitment": "0x1a2b3c4d5e6f7a8b"
    }
  }
}`
    },
    {
      name: 'SBT Issuance',
      path: '/api/sbt/issue',
      description: 'Issue Soulbound Tokens with embedded reputation',
      method: 'POST',
      request: `{
  "recipient": "string",
  "attributes": {
    "reputation": true,
    "contributions": true
  },
  "privateAttributes": true
}`,
      response: `{
  "success": true,
  "data": {
    "sbtId": "string",
    "recipient": "string",
    "attributes": {
      "reputation": true,
      "contributions": true,
      "verifiedIdentity": true
    },
    "zkProof": {
      "id": "string",
      "proof": "hex string",
      "verified": true
    }
  }
}`
    }
  ];

  const sdkExamples = {
    javascript: `// HyperDAG JavaScript SDK for lovable.dev Integration

import { HyperDAG } from '@hyperdag/sdk';

// Initialize SDK with your API key
const hyperdag = new HyperDAG({
  apiKey: 'YOUR_API_KEY',
  environment: 'production', // or 'sandbox' for testing
  useZkp: true // Enable zero-knowledge proofs
});

// Example 1: Create a forum with reputation verification
async function createForumWithReputation() {
  // Initialize the forum module
  const forumConfig = {
    name: "HyperVerse Community",
    description: "A privacy-focused forum for the HyperVerse community",
    reputationThreshold: 10, // Minimum reputation score to post
    privacyEnabled: true // Use ZKP for reputation verification
  };

  const forum = await hyperdag.forum.create(forumConfig);
  console.log("Forum created with ID:", forum.id);
  
  // Add verification rules
  await forum.addVerificationRule({
    type: "reputation",
    minScore: 10,
    zkEnabled: true
  });
  
  return forum;
}

// Example 2: Post to forum with anonymous reputation
async function postToForum(forumId, content) {
  try {
    // Generate ZK proof of reputation without revealing identity
    const proof = await hyperdag.zkp.generateProof({
      type: 'reputation',
      threshold: 10
    });
    
    // Post to forum with the proof
    const post = await hyperdag.forum.createPost({
      forumId: forumId,
      content: content,
      reputationProof: proof,
      privacyLevel: 'private'
    });
    
    console.log("Post created with ID:", post.id);
    return post;
  } catch (error) {
    console.error("Forum post failed:", error);
    throw error;
  }
}

// Example 3: Verify user reputation anonymously
async function verifyUserReputation(username, threshold = 20) {
  try {
    const result = await hyperdag.reputation.verify({
      username: username,
      minimumScore: threshold,
      preservePrivacy: true
    });
    
    if (result.verified) {
      console.log("User has sufficient reputation");
      // The actual score remains private
      return true;
    }
    return false;
  } catch (error) {
    console.error("Verification failed:", error);
    throw error;
  }
}

// Example 4: Issue Soulbound Tokens for forum contributors
async function issueForumContributorSBT(recipient, contributions) {
  try {
    // Create an SBT with reputation data
    const sbt = await hyperdag.sbt.issue({
      recipient: recipient,
      attributes: {
        forumContributions: contributions,
        reputationIncluded: true
      },
      privateAttributes: true // Use ZKP to protect sensitive data
    });
    
    console.log("Forum Contributor SBT issued with ID:", sbt.id);
    return sbt;
  } catch (error) {
    console.error("SBT issuance failed:", error);
    throw error;
  }
}

// Export functions for use in lovable.dev
export {
  createForumWithReputation,
  postToForum,
  verifyUserReputation,
  issueForumContributorSBT
};`,
    python: `# HyperDAG Python SDK for lovable.dev Integration

from hyperdag import HyperDAG

# Initialize SDK with your API key
hyperdag = HyperDAG(
    api_key="YOUR_API_KEY",
    environment="production",  # or 'sandbox' for testing
    use_zkp=True  # Enable zero-knowledge proofs
)

# Example 1: Create a forum with reputation verification
def create_forum_with_reputation():
    # Initialize the forum module
    forum_config = {
        "name": "HyperVerse Community",
        "description": "A privacy-focused forum for the HyperVerse community",
        "reputation_threshold": 10,  # Minimum reputation score to post
        "privacy_enabled": True  # Use ZKP for reputation verification
    }

    forum = hyperdag.forum.create(forum_config)
    print(f"Forum created with ID: {forum.id}")
    
    # Add verification rules
    forum.add_verification_rule({
        "type": "reputation",
        "min_score": 10,
        "zk_enabled": True
    })
    
    return forum

# Example 2: Post to forum with anonymous reputation
def post_to_forum(forum_id, content):
    try:
        # Generate ZK proof of reputation without revealing identity
        proof = hyperdag.zkp.generate_proof(
            type="reputation",
            threshold=10
        )
        
        # Post to forum with the proof
        post = hyperdag.forum.create_post(
            forum_id=forum_id,
            content=content,
            reputation_proof=proof,
            privacy_level="private"
        )
        
        print(f"Post created with ID: {post.id}")
        return post
    except Exception as error:
        print(f"Forum post failed: {error}")
        raise

# Example 3: Verify user reputation anonymously
def verify_user_reputation(username, threshold=20):
    try:
        result = hyperdag.reputation.verify(
            username=username,
            minimum_score=threshold,
            preserve_privacy=True
        )
        
        if result.verified:
            print("User has sufficient reputation")
            # The actual score remains private
            return True
        return False
    except Exception as error:
        print(f"Verification failed: {error}")
        raise

# Example 4: Issue Soulbound Tokens for forum contributors
def issue_forum_contributor_sbt(recipient, contributions):
    try:
        # Create an SBT with reputation data
        sbt = hyperdag.sbt.issue(
            recipient=recipient,
            attributes={
                "forum_contributions": contributions,
                "reputation_included": True
            },
            private_attributes=True  # Use ZKP to protect sensitive data
        )
        
        print(f"Forum Contributor SBT issued with ID: {sbt.id}")
        return sbt
    except Exception as error:
        print(f"SBT issuance failed: {error}")
        raise`
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Integration API & SDK for lovable.dev</h2>
        <p className="text-gray-600 mb-6">
          Use our API and SDK to integrate HyperDAG's ZKP reputation system and SBTs with your HyperVerse forum on lovable.dev
        </p>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">REST API Endpoints</h3>
        <div className="space-y-4">
          {apiEndpoints.map((endpoint, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{endpoint.name}</CardTitle>
                    <CardDescription>{endpoint.description}</CardDescription>
                  </div>
                  <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">
                    {endpoint.method} {endpoint.path}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Request</h4>
                    <pre className="bg-gray-100 p-2 rounded-md text-xs overflow-auto max-h-40">
                      {endpoint.request}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Response</h4>
                    <pre className="bg-gray-100 p-2 rounded-md text-xs overflow-auto max-h-40">
                      {endpoint.response}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">SDK Examples</h3>
        <Tabs defaultValue="javascript" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
          </TabsList>
          <TabsContent value="javascript">
            <Card>
              <CardContent className="pt-6">
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
                  <code className="language-javascript">{sdkExamples.javascript}</code>
                </pre>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Copy Code
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="python">
            <Card>
              <CardContent className="pt-6">
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
                  <code className="language-python">{sdkExamples.python}</code>
                </pre>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Copy Code
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Getting Started with lovable.dev Integration</h3>
        <ol className="list-decimal ml-5 space-y-2 text-gray-700">
          <li>Register for a HyperDAG developer account to obtain API keys</li>
          <li>Install our SDK via NPM or pip depending on your stack</li>
          <li>Initialize the SDK with your API key</li>
          <li>Create a forum with reputation verification enabled</li>
          <li>Implement post submission with ZKP reputation verification</li>
          <li>Add SBT issuance for forum contributors</li>
        </ol>
        <div className="mt-4">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Request Developer API Access
          </Button>
        </div>
      </div>
    </div>
  );
}