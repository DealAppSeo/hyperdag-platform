# HyperDAG Integration For lovable.dev

Thank you for your interest in integrating with HyperDAG's ZKP reputation system for your HyperVerse-BuzzFeed forum project. Below you'll find complete instructions for implementing the connection testing widget, configuration settings, and API integration.

## Connection Testing Widget Implementation

Here's the code for implementing the connection testing widget in your application:

```jsx
// components/HyperdagConnectionTest.jsx
import React, { useState } from 'react';

export function HyperdagConnectionTest() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Make API request to HyperDAG endpoints
      const response = await fetch('https://www.hyperdag.org/api/system/health', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey || process.env.REACT_APP_HYPERDAG_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Now test the ZKP endpoint specifically
        const zkpResponse = await fetch('https://www.hyperdag.org/api/zkp/status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey || process.env.REACT_APP_HYPERDAG_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        const zkpData = await zkpResponse.json();
        
        setTestResult({
          success: true,
          message: 'Connection successful! HyperDAG API endpoints are accessible.',
          details: {
            apiVersion: data.version,
            zkpEndpoint: zkpData.available ? 'OK' : 'Error',
            features: data.features
          }
        });
      } else {
        setTestResult({
          success: false,
          message: `Connection failed: ${data.error || 'Unknown error'}`,
          details: {
            error: data.error,
            statusCode: response.status,
            suggestion: "Check your API key and network connection"
          }
        });
      }
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
    <div className="connection-test-widget">
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
        className="test-connection-button"
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

## Configuration Settings

Create a configuration file in your project to store HyperDAG API endpoints and settings:

```javascript
// config/hyperdag-config.js
export const hyperdagConfig = {
  apiEndpoint: "https://www.hyperdag.org/api",
  authEndpoint: "https://www.hyperdag.org/api/auth",
  zkpEndpoint: "https://www.hyperdag.org/api/zkp",
  webhookEndpoint: "https://www.hyperdag.org/api/webhook",
  forumId: "your_forum_id", // You'll get this after registering
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

## API Key Setup Instructions

1. Request your API keys by sending an email to `dev-support@hyperdag.org` with:
   - Subject: "lovable.dev Integration Key Request"
   - Your forum's URL
   - Your contact information

2. Once you receive your API keys, store them securely:

```
# .env file
HYPERDAG_API_KEY=your_api_key_here
HYPERDAG_WEBHOOK_SECRET=your_webhook_secret_here
```

3. Configure your environment to use these keys:

```javascript
// For Node.js backend
require('dotenv').config();
const HYPERDAG_API_KEY = process.env.HYPERDAG_API_KEY;

// For React frontend (ensure keys are prefixed with REACT_APP_)
// .env file
REACT_APP_HYPERDAG_API_KEY=your_api_key_here
```

## Backend Integration Code

Here's how to set up the backend integration:

```javascript
// server/controllers/hyperdag-controller.js
const axios = require('axios');
const { hyperdagConfig } = require('../config/hyperdag-config');

// Initialize hyperDAG API client
const hyperdagClient = axios.create({
  baseURL: hyperdagConfig.apiEndpoint,
  headers: {
    'Authorization': `Bearer ${process.env.HYPERDAG_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Verify user reputation with ZKP
exports.verifyUserReputation = async (req, res) => {
  try {
    const { userId, threshold } = req.body;
    
    const response = await hyperdagClient.post('/zkp/verify', {
      userId,
      threshold,
      useZkp: true // Enable privacy-preserving verification
    });
    
    return res.json({
      success: true,
      verified: response.data.verified,
      // Note: The actual score is not revealed, only if they meet the threshold
    });
  } catch (error) {
    console.error('HyperDAG verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
};

// Create a post with anonymous reputation verification
exports.createForumPost = async (req, res) => {
  try {
    const { content, anonymous, userId } = req.body;
    
    // If posting anonymously, generate a ZK proof
    let reputationProof = null;
    if (anonymous) {
      const proofResponse = await hyperdagClient.post('/zkp/generate-proof', {
        userId,
        type: 'reputation',
        threshold: 10 // Minimum reputation required
      });
      
      reputationProof = proofResponse.data.proof;
    }
    
    // Create the forum post
    const postResponse = await hyperdagClient.post('/forum/posts', {
      forumId: hyperdagConfig.forumId,
      content,
      reputationProof,
      anonymous
    });
    
    return res.json({
      success: true,
      post: postResponse.data
    });
  } catch (error) {
    console.error('HyperDAG forum post error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
};

// Set up webhook handler for reputation updates
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-hyperdag-signature'];
    const payload = req.body;
    
    // Verify webhook signature
    const isValid = verifySignature(signature, process.env.HYPERDAG_WEBHOOK_SECRET, payload);
    
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }
    
    // Process webhook events
    switch (payload.event) {
      case 'reputation.updated':
        // Update user reputation status in your database
        await updateUserReputationStatus(payload.userId, payload.data);
        break;
        
      case 'forum.post.created':
        // Update forum posts in your database
        await syncForumPost(payload.data);
        break;
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
};

// Helper functions
function verifySignature(signature, secret, payload) {
  // Implement HMAC signature verification
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
  
  return signature === calculatedSignature;
}

async function updateUserReputationStatus(userId, data) {
  // Update user reputation in your database
  // Note: This only stores if they meet thresholds, not actual scores
}

async function syncForumPost(postData) {
  // Sync forum post with your database
}
```

## Frontend Integration

Here's how to integrate HyperDAG into your React frontend:

```jsx
// components/HyperdagForumIntegration.jsx
import React, { useState, useEffect } from 'react';
import { hyperdagConfig } from '../config/hyperdag-config';
import { HyperdagConnectionTest } from './HyperdagConnectionTest';

export function HyperdagForumIntegration() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Fetch the current user
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
        }
      });
      
    // Fetch forum posts
    fetchPosts();
  }, []);
  
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/forum/posts');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !newPost.trim()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newPost,
          anonymous: isAnonymous,
          userId: user.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewPost('');
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="hyperdag-forum-integration">
      <div className="connection-test-container">
        <HyperdagConnectionTest />
      </div>
      
      <div className="forum-container">
        <h2>HyperVerse Forum</h2>
        
        {user ? (
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
          <p>Please sign in to view and post in this forum.</p>
        )}
      </div>
    </div>
  );
}
```

## Implementation Steps

1. **Request API Keys**:
   - Contact dev-support@hyperdag.org to request your integration keys
   - Specify that you're implementing the HyperVerse-BuzzFeed forum integration

2. **Setup SDK and Configuration**:
   - Copy the configuration file to your project
   - Store API keys securely in environment variables
   - Implement the connection testing widget to verify connectivity

3. **Backend Integration**:
   - Create API endpoints for user verification, forum posting, and webhook handling
   - Set up your database schema to store reputation thresholds (not actual scores)
   - Configure webhook URL in your HyperDAG developer settings

4. **Frontend Integration**:
   - Implement the forum integration component
   - Add anonymous posting with ZKP verification
   - Add UI indicators for verified but anonymous posts

5. **Testing**:
   - Use the connection testing widget to verify API connectivity
   - Test forum functionality with anonymous posting
   - Verify webhook operations by monitoring events

## Support Resources

If you need additional help with your integration:

- Email: dev-support@hyperdag.org 
- Documentation: https://docs.hyperdag.org
- Integration Support: https://www.hyperdag.org/developers/support

We're looking forward to seeing your HyperVerse-BuzzFeed forum integration with HyperDAG's privacy-preserving reputation system!