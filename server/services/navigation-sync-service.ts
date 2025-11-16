import axios from 'axios';
import { db } from '../db';
import { webhooks } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Interface for navigation items
interface NavigationItem {
  title: string;
  icon?: string;
  path?: string;
  external?: boolean;
  children?: NavigationItem[];
  requiresDevAccess?: boolean;
  styling?: {
    textColor?: string;
    activeTextColor?: string;
    backgroundColor?: string;
    activeBackgroundColor?: string;
    hoverBackgroundColor?: string;
    fontWeight?: string;
    activeState?: 'parent-active' | 'item-active' | 'group-active';
  };
}

// Navigation structure interface
interface NavigationStructure {
  version: string;
  navigation: NavigationItem[];
}

class NavigationSyncService {
  private cachedNavigation: NavigationStructure | null = null;

  // Get the current navigation structure
  getCurrentNavigation(): NavigationStructure {
    // Check cache first
    if (this.cachedNavigation) {
      return this.cachedNavigation;
    }

    // Create navigation structure - this should match your actual sidebar structure
    const navigation: NavigationStructure = {
      version: new Date().toISOString(),
      navigation: [
        {
          title: "Dashboard",
          icon: "layout-dashboard",
          path: "/"
        },
        {
          title: "Projects",
          icon: "folder",
          path: "/projects"
        },
        {
          title: "Funding",
          icon: "piggy-bank",
          path: "/funding"
        },
        {
          title: "Community",
          icon: "users",
          styling: {
            activeState: 'group-active'
          },
          children: [
            {
              title: "Forum",
              path: "https://forum.hyperdag.org",
              external: true,
              styling: {
                activeBackgroundColor: "#7c3aed",
                activeTextColor: "#ffffff",
                fontWeight: "500"
              }
            },
            {
              title: "Members",
              path: "/community/members",
              styling: {
                activeBackgroundColor: "#7c3aed",
                activeTextColor: "#ffffff",
                fontWeight: "500"
              }
            },
            {
              title: "Teams",
              path: "/community/teams",
              styling: {
                activeBackgroundColor: "#7c3aed",
                activeTextColor: "#ffffff",
                fontWeight: "500"
              }
            }
          ]
        },
        {
          title: "Nonprofits",
          icon: "heart-handshake",
          children: [
            {
              title: "Directory",
              path: "/nonprofits"
            },
            {
              title: "Refer a Nonprofit",
              path: "/nonprofits/refer"
            },
            {
              title: "Share HyperDAG",
              path: "/nonprofits/share"
            }
          ]
        },
        {
          title: "Developer",
          icon: "code",
          requiresDevAccess: true,
          children: [
            {
              title: "Dashboard",
              path: "/developer"
            },
            {
              title: "API Keys",
              path: "/developer/api"
            },
            {
              title: "Compute",
              path: "/developer/compute"
            },
            {
              title: "Web3 Integration",
              path: "/developer/web3"
            },
            {
              title: "ZKP Testing",
              path: "/developer/zkp"
            },
            {
              title: "Security Testing",
              path: "/developer/security-test"
            },
            {
              title: "Platform Compatibility",
              path: "/developer/platform-compatibility" 
            },
            {
              title: "Navigation Webhooks",
              path: "/developer/navigation-webhooks" 
            },
            {
              title: "Integration Demo",
              path: "/developer/integration-demo"
            }
          ]
        },
        {
          title: "Reputation",
          icon: "award",
          path: "/reputation"
        },
        {
          title: "Settings",
          icon: "settings",
          path: "/settings"
        }
      ]
    };

    // Cache navigation
    this.cachedNavigation = navigation;
    
    return navigation;
  }

  // Force navigation cache refresh
  refreshNavigationCache(): NavigationStructure {
    // Clear cache and regenerate
    this.cachedNavigation = null;
    return this.getCurrentNavigation();
  }

  // Notify a single webhook about navigation changes
  async notifyWebhook(webhook: { id: number; url: string; apiKey: string; applicationName: string }): Promise<boolean> {
    try {
      const navigationData = this.getCurrentNavigation();
      const timestamp = new Date().toISOString();
      
      await axios.post(webhook.url, {
        event: 'navigation.updated',
        data: navigationData,
        timestamp
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-HyperDAG-Webhook-Key': webhook.apiKey
        },
        timeout: 5000 // 5 second timeout
      });
      
      // Update last triggered timestamp
      await db.update(webhooks)
        .set({ lastTriggered: new Date() })
        .where(eq(webhooks.id, webhook.id));
      
      return true;
    } catch (error) {
      console.error(`Failed to notify webhook ${webhook.id} (${webhook.applicationName}):`, error);
      return false;
    }
  }

  // Notify all registered webhooks about navigation changes
  async notifyAllWebhooks(): Promise<{ total: number; successful: number; results: any[] }> {
    try {
      const allWebhooks = await db.select().from(webhooks)
        .where(eq(webhooks.type, 'navigation'))
        .where(eq(webhooks.active, true));
      
      const results = [];
      let successful = 0;
      
      // Notify each webhook
      for (const webhook of allWebhooks) {
        try {
          const success = await this.notifyWebhook(webhook);
          
          if (success) {
            successful++;
            results.push({
              webhookId: webhook.id,
              applicationName: webhook.applicationName,
              status: 'success'
            });
          } else {
            results.push({
              webhookId: webhook.id,
              applicationName: webhook.applicationName,
              status: 'failed',
              error: 'Notification failed'
            });
          }
        } catch (error) {
          results.push({
            webhookId: webhook.id,
            applicationName: webhook.applicationName,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      return {
        total: allWebhooks.length,
        successful,
        results
      };
    } catch (error) {
      console.error('Failed to notify webhooks:', error);
      throw error;
    }
  }

  // Register a new webhook
  async registerWebhook(data: { url: string; applicationName: string; apiKey: string; userId?: number }): Promise<any> {
    try {
      const [webhook] = await db.insert(webhooks).values({
        url: data.url,
        applicationName: data.applicationName,
        apiKey: data.apiKey,
        type: 'navigation',
        userId: data.userId,
        createdAt: new Date()
      }).returning();
      
      // Test the webhook by sending an initial notification
      try {
        await this.notifyWebhook(webhook);
      } catch (error) {
        // Don't fail if the test notification fails
        console.warn(`Test notification failed for new webhook ${webhook.id}:`, error);
      }
      
      return webhook;
    } catch (error) {
      console.error('Failed to register webhook:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const navigationSyncService = new NavigationSyncService();