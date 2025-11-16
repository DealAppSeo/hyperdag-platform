# HyperDAG Integration Guide for lovable.dev

This document provides detailed instructions for integrating your lovable.dev HyperVerse forum application with HyperDAG's ZKP reputation system and SBT features.

## 1. Required Dependencies

First, install the HyperDAG SDK packages:

```bash
npm install @hyperdag/sdk @hyperdag/react
```

## 2. API Key Setup

To authenticate your application with HyperDAG services:

1. Register your application on the [HyperDAG Developer Portal](https://www.hyperdag.org/developers/register)
2. Create a new API key with the following permissions:
   - Reputation: Read
   - SBT: Read
   - Forum: Read/Write
   - ZKP: Generate/Verify
3. Store your API keys securely:
   ```javascript
   // In your .env file
   HYPERDAG_API_KEY=your_api_key_here
   HYPERDAG_WEBHOOK_SECRET=your_webhook_secret_here
   ```

## 3. Configuration Settings

Create a configuration file in your project:

```javascript
// src/config/hyperdag-config.js
export const hyperdagConfig = {
  apiEndpoint: "https://www.hyperdag.org/api",
  authEndpoint: "https://www.hyperdag.org/api/auth",
  zkpEndpoint: "https://www.hyperdag.org/api/zkp",
  webhookEndpoint: "https://www.hyperdag.org/api/webhook",
  forumId: "your_forum_id", // You'll get this after creating a forum
  features: {
    reputation: true,
    privateForums: true,
    sbtValidation: true,
    anonymousPosting: true
  },
  callbacks: {
    onUserVerified: "/api/callbacks/user-verified",
    onReputationUpdated: "/api/callbacks/reputation-updated",
    onSbtIssued: "/api/callbacks/sbt-issued"
  }
};
```

## 4. Test Connection Widget Implementation

The connection testing widget helps validate your integration with HyperDAG:

```jsx
// src/components/HyperdagConnectionTest.jsx
import React, { useState } from 'react';
import { HyperDAG } from '@hyperdag/sdk';

export function HyperdagConnectionTest() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Initialize the SDK with provided API key or environment variable
      const hyperdag = new HyperDAG({
        apiKey: apiKey || process.env.REACT_APP_HYPERDAG_API_KEY,
        environment: 'production'
      });
      
      // Test the connection
      const healthCheck = await hyperdag.system.healthCheck();
      
      // Test ZKP endpoints
      const zkpStatus = await hyperdag.zkp.status();
      
      // Test forum access
      const forumStatus = await hyperdag.forum.status();
      
      setTestResult({
        success: true,
        message: 'Connection successful! HyperDAG API endpoints are accessible.',
        details: {
          apiVersion: healthCheck.version,
          zkpEndpoint: zkpStatus.available ? 'OK' : 'Error',
          forumEndpoint: forumStatus.available ? 'OK' : 'Error',
          features: healthCheck.features
        }
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection failed: ${error.message}`,
        details: {
          error: error.message,
          suggestion: "Check your API key and network connection"
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hyperdag-connection-test">
      <h2>Test HyperDAG Connection</h2>
      
      <div className="form-group">
        <label htmlFor="api-key">API Key (optional)</label>
        <input
          id="api-key"
          type="password"
          placeholder="Enter your HyperDAG API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <p className="helper-text">
          Leave blank to use your application's environment variables
        </p>
      </div>
      
      <button 
        onClick={handleTestConnection} 
        disabled={isLoading}
      >
        {isLoading ? "Testing Connection..." : "Test Connection"}
      </button>
      
      {testResult && (
        <div className={`result ${testResult.success ? 'success' : 'error'}`}>
          <h3>{testResult.message}</h3>
          
          {testResult.details && (
            <div className="details">
              {Object.entries(testResult.details).map(([key, value]) => (
                <div key={key} className="detail-item">
                  <span className="key">{key}:</span>
                  <span className="value">
                    {Array.isArray(value) ? value.join(', ') : value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## 5. Backend Integration

### Authentication Endpoint

```javascript
// server/controllers/auth-controller.js
const { HyperDAG } = require('@hyperdag/sdk');

const hyperdag = new HyperDAG({
  apiKey: process.env.HYPERDAG_API_KEY,
  environment: 'production'
});

exports.authenticateWithHyperdag = async (req, res) => {
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
      };
      
      res.json({ success: true, message: "Authenticated with HyperDAG" });
    } else {
      res.status(401).json({ success: false, message: "Authentication failed" });
    }
  } catch (error) {
    console.error("HyperDAG auth error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
```

### Webhook Handler

```javascript
// server/controllers/webhook-controller.js
const { verifyHyperDAGWebhook } = require('@hyperdag/sdk');

exports.handleReputationWebhook = async (req, res) => {
  try {
    // Verify the webhook signature
    const isValid = verifyHyperDAGWebhook(
      req.headers['x-hyperdag-signature'],
      process.env.HYPERDAG_WEBHOOK_SECRET,
      req.body
    );
    
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }
    
    const { userId, event, data } = req.body;
    
    switch (event) {
      case 'reputation.updated':
        // Handle reputation update
        console.log(`Reputation updated for user ${userId}`);
        
        // Update your local database
        await updateUserReputationStatus(userId, data.hasThreshold);
        break;
        
      case 'sbt.issued':
        // Handle SBT issuance
        console.log(`SBT issued to user ${userId}: ${data.sbtId}`);
        
        // Update your local database
        await recordUserSbt(userId, data.sbtId, data.attributes);
        break;
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
};

// Update functions to implement in your database logic
async function updateUserReputationStatus(userId, hasThreshold) {
  // Update your database with the user's reputation status
  // Note: This just updates whether they meet the threshold, not the actual score
}

async function recordUserSbt(userId, sbtId, attributes) {
  // Record the SBT issuance in your database
}
```

## 6. Frontend Integration

### React Context Provider

```jsx
// src/contexts/HyperdagContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { HyperDAG } from '@hyperdag/sdk';
import { hyperdagConfig } from '../config/hyperdag-config';

const HyperdagContext = createContext();

export function HyperdagProvider({ children }) {
  const [hyperdag, setHyperdag] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize HyperDAG SDK
    const hyperdagInstance = new HyperDAG({
      apiKey: process.env.REACT_APP_HYPERDAG_API_KEY,
      environment: 'production'
    });
    
    setHyperdag(hyperdagInstance);
    
    // Check if the user is already authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const status = await hyperdag.auth.getStatus();
      
      if (status.isAuthenticated) {
        setIsAuthenticated(true);
        setUser(status.user);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authResult = await hyperdag.auth.authenticate(credentials);
      
      if (authResult.success) {
        setIsAuthenticated(true);
        setUser(authResult.data.user);
        return authResult;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await hyperdag.auth.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err);
    }
  };

  // Forum-specific functions
  const getPosts = async (forumId) => {
    try {
      return await hyperdag.forum.getPosts(forumId);
    } catch (err) {
      console.error('Error getting posts:', err);
      setError(err);
      return [];
    }
  };

  const createPost = async (postData) => {
    try {
      return await hyperdag.forum.createPost(postData);
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err);
      throw err;
    }
  };

  // ZKP-specific functions
  const generateReputationProof = async (threshold) => {
    try {
      return await hyperdag.zkp.generateProof({
        userId: user.id,
        type: 'reputation',
        threshold
      });
    } catch (err) {
      console.error('Error generating proof:', err);
      setError(err);
      throw err;
    }
  };

  return (
    <HyperdagContext.Provider
      value={{
        hyperdag,
        isAuthenticated,
        user,
        isLoading,
        error,
        authenticate,
        logout,
        getPosts,
        createPost,
        generateReputationProof
      }}
    >
      {children}
    </HyperdagContext.Provider>
  );
}

export function useHyperdag() {
  const context = useContext(HyperdagContext);
  if (!context) {
    throw new Error('useHyperdag must be used within a HyperdagProvider');
  }
  return context;
}
```

### Forum Component

```jsx
// src/components/HyperdagForum.jsx
import React, { useState, useEffect } from 'react';
import { useHyperdag } from '../contexts/HyperdagContext';
import { hyperdagConfig } from '../config/hyperdag-config';

export function HyperdagForum() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const { 
    isAuthenticated, 
    createPost, 
    getPosts, 
    isLoading,
    generateReputationProof
  } = useHyperdag();
  
  useEffect(() => {
    if (isAuthenticated) {
      loadPosts();
    }
  }, [isAuthenticated]);
  
  const loadPosts = async () => {
    try {
      const forumPosts = await getPosts(hyperdagConfig.forumId);
      setPosts(forumPosts);
    } catch (err) {
      console.error("Error loading posts:", err);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // If anonymous posting is selected, generate a ZKP
      let reputationProof = null;
      if (isAnonymous) {
        reputationProof = await generateReputationProof(10); // Threshold of 10
      }
      
      await createPost({
        forumId: hyperdagConfig.forumId,
        content: newPost,
        anonymous: isAnonymous,
        reputationProof
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
}
```

## 7. Implementation Steps

1. **Set up API Keys**:
   - Register your application on HyperDAG Developer Portal
   - Generate and safely store API keys

2. **Install the SDK**:
   - Add the HyperDAG SDK packages to your project
   - Create configuration file

3. **Implement Backend Components**:
   - Add authentication endpoints
   - Create webhook handlers for reputation updates
   - Set up database schema to store reputation thresholds

4. **Implement Frontend Components**:
   - Add HyperdagProvider to your app
   - Implement connection test widget
   - Create forum components with anonymous posting

5. **Testing**:
   - Use the connection test widget to verify API connectivity
   - Test forum functionality with anonymous posting
   - Verify webhook operations

## 8. Common Issues and Solutions

### Connection Issues
- **Problem**: API connection failing
- **Solution**: Ensure API keys are correctly set in environment variables and the API endpoint URLs are correct

### Authentication Problems
- **Problem**: Users unable to authenticate
- **Solution**: Verify that users have HyperDAG accounts and check authentication logs

### ZKP Verification Failures
- **Problem**: Anonymous posts failing verification
- **Solution**: Ensure users meet the reputation threshold and that proofs are being generated correctly

### Webhook Delivery Issues
- **Problem**: Webhooks not being received
- **Solution**: Verify webhook URL is publicly accessible and check webhook secret validity

## Contact Support

For additional implementation assistance, contact the HyperDAG developer support team:
- Email: dev-support@hyperdag.org
- Developer Portal: https://www.hyperdag.org/developers/support
- Documentation: https://docs.hyperdag.org