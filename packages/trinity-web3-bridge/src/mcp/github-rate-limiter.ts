/**
 * @title GitHub Rate Limiter
 * @dev Manages GitHub API quotas with priority-aware scheduling and backoff.
 */

export class GitHubRateLimiter {
    private remaining: number = 5000;
    private resetAt: number = Date.now() + 3600000;

    /**
     * Executes a GitHub operation with respect to rate limits and priority.
     */
    async execute<T>(
        operation: () => Promise<T>,
        priority: 'high' | 'normal' | 'low' = 'normal'
    ): Promise<T> {
        const threshold = this.getThreshold(priority);

        if (this.remaining < threshold) {
            const waitMs = Math.max(0, this.resetAt - Date.now());
            console.warn(`GitHubRateLimiter: quota low (${this.remaining}). Waiting ${waitMs}ms for ${priority} priority operation.`);
            await new Promise(resolve => setTimeout(resolve, Math.min(waitMs, 5000))); // Cap wait for safety
        }

        try {
            const result = await operation();
            // Update local state (in real logic, this would parse headers)
            this.remaining--;
            return result;
        } catch (error: any) {
            if (error.status === 403) {
                console.error('GitHubRateLimiter: Rate limit exceeded. Blocking until reset.');
                // Update resetAt from headers if available
            }
            throw error;
        }
    }

    private getThreshold(priority: string): number {
        // Reserve capacity for high-priority operations
        switch (priority) {
            case 'high': return 5;
            case 'normal': return 50;
            case 'low': return 200;
            default: return 50;
        }
    }
}
