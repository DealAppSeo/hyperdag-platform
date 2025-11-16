import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export function HyperdagIntegrationSnippet() {
  const configSnippets = {
    hyperdag: `// HyperDAG Forum Integration Configuration
{
  "apiEndpoint": "https://www.hyperdag.org/api",
  "authEndpoint": "https://www.hyperdag.org/api/auth",
  "integrationKey": "YOUR_INTEGRATION_KEY",
  "zkpEndpoint": "https://www.hyperdag.org/api/zkp",
  "webhookEndpoint": "https://www.hyperdag.org/api/webhook",
  "features": {
    "reputation": true,
    "privateForums": true,
    "sbtValidation": true,
    "anonymousPosting": true
  },
  "callbacks": {
    "onUserVerified": "/your-callback-endpoint/user-verified",
    "onReputationUpdated": "/your-callback-endpoint/reputation-updated",
    "onSbtIssued": "/your-callback-endpoint/sbt-issued"
  }
}`
  };

  const authExamples = {
    js: `// Authenticate a user with HyperDAG reputation system
import { HyperDAG } from '@hyperdag/sdk';

// Initialize the SDK
const hyperdag = new HyperDAG({
  apiKey: import.meta.env.VITE_HYPERDAG_API_KEY,
  environment: 'production'
});

// For your Express API endpoint
app.post('/api/auth/hyperdag', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Authenticate with HyperDAG
    const authResult = await hyperdag.auth.authenticate({
      username,
      password,
      useZkp: true // Enable privacy-preserving authentication
    });
    
    if (authResult.success) {
      // Store the HyperDAG reputation token in session
      req.session.hyperdagToken = authResult.data.token;
      req.session.hyperdagUser = {
        id: authResult.data.userId,
        hasReputation: authResult.data.hasReputation,
        // The actual reputation score is not revealed, only that it meets thresholds
      };
      
      res.json({ success: true, message: "Authenticated with HyperDAG" });
    } else {
      res.status(401).json({ success: false, message: "Authentication failed" });
    }
  } catch (error) {
    console.error("HyperDAG auth error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});`,
    react: `// React component for HyperDAG authentication
import React, { useState } from 'react';
import { useHyperDAG } from '@hyperdag/react';

export function HyperDAGAuth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { authenticate, isAuthenticated, isLoading, error } = useHyperDAG();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authenticate({
        username,
        password,
        useZkp: true // Enable privacy-preserving authentication
      });
    } catch (err) {
      console.error("Authentication error:", err);
    }
  };
  
  return (
    <div className="hyperdag-auth">
      <h2>Authenticate with HyperDAG</h2>
      
      {isAuthenticated ? (
        <div className="success">
          <p>Successfully authenticated!</p>
          <p>Your reputation is verified (actual score is private)</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Authenticating..." : "Authenticate"}
          </button>
          
          {error && <p className="error">{error.message}</p>}
        </form>
      )}
    </div>
  );
}`
  };

  const forumExamples = {
    js: `// Forum integration with HyperDAG reputation system
import { HyperDAG } from '@hyperdag/sdk';

// Initialize the SDK
const hyperdag = new HyperDAG({
  apiKey: import.meta.env.VITE_HYPERDAG_API_KEY,
  environment: 'production'
});

// Create a new forum with reputation requirements
async function createForum() {
  const forum = await hyperdag.forum.create({
    name: "HyperVerse Community",
    description: "A privacy-focused forum for the HyperVerse community",
    reputationThreshold: 10, // Minimum reputation to post
    privacyEnabled: true // Enable ZKP for reputation verification
  });
  
  return forum;
}

// Post to forum with anonymous reputation verification
async function postToForum(forumId, userId, content) {
  // Get a ZK proof that the user has sufficient reputation
  // without revealing their identity or exact reputation score
  const proof = await hyperdag.zkp.generateProof({
    userId,
    type: 'reputation',
    threshold: 10
  });
  
  // Create the post with the proof
  const post = await hyperdag.forum.createPost({
    forumId,
    content,
    reputationProof: proof,
    // User ID is not exposed, only that they have verified reputation
    anonymous: true
  });
  
  return post;
}

// Verify if a user has sufficient reputation to access a forum
async function canAccessForum(userId, forumId) {
  const verificationResult = await hyperdag.reputation.verifyAccess({
    userId,
    resourceId: forumId,
    resourceType: 'forum'
  });
  
  return verificationResult.hasAccess;
}`,
    react: `// React component for HyperDAG Forum Integration
import React, { useState, useEffect } from 'react';
import { useHyperDAG } from '@hyperdag/react';

export function HyperDAGForum({ forumId }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const { 
    forum,
    isAuthenticated, 
    createPost, 
    getPosts, 
    isLoading 
  } = useHyperDAG();
  
  useEffect(() => {
    if (isAuthenticated && forumId) {
      loadPosts();
    }
  }, [isAuthenticated, forumId]);
  
  const loadPosts = async () => {
    try {
      const forumPosts = await getPosts(forumId);
      setPosts(forumPosts);
    } catch (err) {
      console.error("Error loading posts:", err);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPost({
        forumId,
        content: newPost,
        anonymous: isAnonymous, // Use ZKP for anonymous posting
      });
      setNewPost('');
      loadPosts(); // Refresh posts
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };
  
  return (
    <div className="hyperdag-forum">
      <h2>HyperVerse Forum</h2>
      
      {isAuthenticated ? (
        <>
          <div className="posts-container">
            {posts.map(post => (
              <div key={post.id} className="post">
                <div className="post-header">
                  <span className="author">
                    {post.anonymous ? "Anonymous (Verified)" : post.author}
                  </span>
                  <span className="timestamp">{new Date(post.timestamp).toLocaleString()}</span>
                </div>
                <div className="content">{post.content}</div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="post-form">
            <div className="form-group">
              <label htmlFor="content">New Post</label>
              <textarea
                id="content"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                Post anonymously with verified reputation
              </label>
            </div>
            
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Posting..." : "Submit Post"}
            </button>
          </form>
        </>
      ) : (
        <p>Please authenticate with HyperDAG to view and post in this forum.</p>
      )}
    </div>
  );
}`
  };

  const webhookExample = `// Example HyperDAG webhook handler
// This endpoint receives reputation and SBT updates from HyperDAG

import express from 'express';
import { verifyHyperDAGWebhook } from '@hyperdag/sdk';

const router = express.Router();

// Handle reputation updates
router.post('/webhooks/hyperdag/reputation', async (req, res) => {
  try {
    // Verify the webhook signature
    const isValid = verifyHyperDAGWebhook(
      req.headers['x-hyperdag-signature'],
      import.meta.env.VITE_HYPERDAG_WEBHOOK_SECRET,
      req.body
    );
    
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }
    
    const { userId, event, data } = req.body;
    
    switch (event) {
      case 'reputation.updated':
        // Handle reputation update
        // Note: The actual score is not revealed, only that a change occurred
        console.log(\`Reputation updated for user \${userId}\`);
        
        // Update your local database
        await updateUserReputationStatus(userId, data.hasThreshold);
        break;
        
      case 'sbt.issued':
        // Handle SBT issuance
        console.log(\`SBT issued to user \${userId}: \${data.sbtId}\`);
        
        // Update your local database
        await recordUserSbt(userId, data.sbtId, data.attributes);
        break;
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

export default router;`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Integration with lovable.dev</h2>
        <p className="text-gray-600">
          Below are specific code examples showing how to integrate HyperDAG's privacy-preserving reputation system
          and SBTs with your HyperVerse forum on lovable.dev.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Setup</CardTitle>
          <CardDescription>
            Add this configuration to your project to connect with HyperDAG
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
            <code className="language-json">{configSnippets.hyperdag}</code>
          </pre>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Copy Configuration
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Authentication Integration</h3>
        <Tabs defaultValue="js" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="js">Node.js Backend</TabsTrigger>
            <TabsTrigger value="react">React Frontend</TabsTrigger>
          </TabsList>
          <TabsContent value="js">
            <Card>
              <CardContent className="pt-6">
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs h-96">
                  <code className="language-javascript">{authExamples.js}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="react">
            <Card>
              <CardContent className="pt-6">
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs h-96">
                  <code className="language-javascript">{authExamples.react}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Forum Integration</h3>
        <Tabs defaultValue="js" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="js">Node.js Backend</TabsTrigger>
            <TabsTrigger value="react">React Frontend</TabsTrigger>
          </TabsList>
          <TabsContent value="js">
            <Card>
              <CardContent className="pt-6">
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs h-96">
                  <code className="language-javascript">{forumExamples.js}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="react">
            <Card>
              <CardContent className="pt-6">
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs h-96">
                  <code className="language-javascript">{forumExamples.react}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Webhook Integration</h3>
        <Card>
          <CardContent className="pt-6">
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs h-96">
              <code className="language-javascript">{webhookExample}</code>
            </pre>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Integration Steps for lovable.dev</h3>
        <ol className="list-decimal ml-5 space-y-2 text-gray-700">
          <li>Request development API keys for HyperDAG integration</li>
          <li>Add the HyperDAG SDK to your project: <code className="bg-blue-100 px-2 py-1 rounded text-xs">npm install @hyperdag/sdk @hyperdag/react</code></li>
          <li>Configure the connection with your API keys (see configuration example)</li>
          <li>Implement authentication integration for forum users</li>
          <li>Set up the forum components with reputation verification</li>
          <li>Add webhook handlers to receive reputation updates</li>
          <li>Test the integration in development mode</li>
        </ol>
      </div>
    </div>
  );
}