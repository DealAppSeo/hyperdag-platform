import { apiRequest } from './queryClient';

/**
 * Analytics service for tracking user behavior
 */
class AnalyticsService {
  /**
   * Track a page view
   * @param data Page view data
   */
  trackPageView(data: { path: string; title?: string }) {
    return this.sendAnalyticsData('/api/analytics/pageview', {
      path: data.path,
      title: data.title || document.title
    });
  }

  /**
   * Track a user event (like button click, form submission, etc.)
   * @param data Event data
   */
  trackEvent(data: { action: string; category?: string; label?: string; value?: number; metadata?: Record<string, any> }) {
    return this.sendAnalyticsData('/api/analytics/event', data);
  }

  /**
   * Helper to send analytics data to the API
   * @param endpoint API endpoint
   * @param data Data to send
   */
  private async sendAnalyticsData(endpoint: string, data: any) {
    try {
      // Add timestamp if not provided
      const payload = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      };

      // Send data asynchronously and don't wait for response to avoid blocking
      // We use a timeout to ensure this runs after more critical operations
      setTimeout(async () => {
        try {
          await apiRequest('POST', endpoint, payload);
        } catch (error) {
          // Fail silently in production, log in development
          if (import.meta.env.VITE_NODE_ENV === 'development') {
            console.error('Analytics error:', error);
          }
        }
      }, 10);

      return true;
    } catch (error) {
      // Never fail the app because of analytics
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.error('Analytics setup error:', error);
      }
      return false;
    }
  }
}

// Export a singleton instance
const analytics = new AnalyticsService();
export default analytics;