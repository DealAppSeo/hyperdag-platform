/**
 * Core type definitions for redundancy services
 */

/**
 * Status of a redundant service
 * - available: Fully operational with all features
 * - degraded: Some features unavailable but core functionality works
 * - limited: Only essential features work in restricted mode
 * - error: System is not operational
 * - idle: System is initialized but not yet active
 */
export type ServiceStatus = 'available' | 'degraded' | 'limited' | 'error' | 'idle';