/**
 * Common Router Interface
 * 
 * Defines the contract that all routing systems must implement.
 * This ensures type safety across the SafeEnhancementWrapper and
 * ProductionRouterSystem integrations.
 */

import type { RoutingRequest, RoutingDecision } from './anfis-router';
import type { AiProvider } from '@shared/schema';

export interface IRouter {
  route(request: RoutingRequest, providers: AiProvider[]): Promise<RoutingDecision>;
}
