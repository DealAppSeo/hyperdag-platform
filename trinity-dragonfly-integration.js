/**
 * Trinity Symphony DragonflyDB Integration
 * Ultra-fast caching for AI-Prompt-Manager & HyperDAGManager
 */

import redis from 'redis';
import crypto from 'crypto';

class TrinityDragonflyCache {
    constructor() {
        this.clients = {};
        this.isConnected = false;
        this.metrics = {
            hits: 0,
            misses: 0,
            errors: 0,
            total_operations: 0,
            latency_sum: 0
        };
        
        // Trinity Symphony Database Allocation
        this.databases = {
            CONDUCTOR: 0,    // AI-Prompt-Manager
            LEARNER: 1,      // Pattern Discovery
            VALIDATOR: 2,    // HyperDAGManager
            FALLBACK: 3      // Emergency Backup
        };
        
        // Golden Ratio TTL optimization
        this.ttl = {
            SHORT: 5832,     // ~1.6 hours
            MEDIUM: 9442,    // ~2.6 hours
            LONG: 15274      // ~4.2 hours
        };
    }

    async initialize() {
        console.log('🎼 Initializing Trinity Symphony DragonflyDB...');
        
        try {
            // Use environment variables or fallback to Redis simulation
            const host = process.env.DRAGONFLY_HOST || 'localhost';
            const port = process.env.DRAGONFLY_PORT || 6379;
            const password = process.env.DRAGONFLY_PASSWORD;
            const tls = process.env.DRAGONFLY_TLS === 'true';
            
            const baseConfig = {
                socket: {
                    host,
                    port: parseInt(port),
                    tls: tls ? {} : false,
                    reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
                },
                password,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3
            };

            // Initialize all Trinity databases
            for (const [name, dbIndex] of Object.entries(this.databases)) {
                try {
                    const client = redis.createClient({
                        ...baseConfig,
                        database: dbIndex
                    });

                    client.on('error', (err) => {
                        console.error(`❌ DragonflyDB ${name} (DB${dbIndex}) error:`, err.message);
                        this.metrics.errors++;
                    });

                    client.on('connect', () => {
                        console.log(`✅ DragonflyDB ${name} (DB${dbIndex}) connected`);
                    });

                    await client.connect();
                    this.clients[name] = client;
                    
                    // Test connection
                    const pong = await client.ping();
                    if (pong === 'PONG') {
                        console.log(`🚀 DB${dbIndex} (${name}): Connection verified`);
                    }
                    
                } catch (error) {
                    console.warn(`⚠️  DragonflyDB ${name} connection failed, using fallback: ${error.message}`);
                    // Create mock client for development
                    this.clients[name] = this.createMockClient();
                }
            }

            this.isConnected = Object.keys(this.clients).length > 0;
            
            if (this.isConnected) {
                console.log('✅ Trinity Symphony DragonflyDB initialized successfully');
                await this.performanceTest();
            } else {
                console.log('⚠️  Running with mock cache (no external DragonflyDB)');
            }

        } catch (error) {
            console.error('❌ DragonflyDB initialization failed:', error.message);
            // Initialize with mock clients for development
            for (const name of Object.keys(this.databases)) {
                this.clients[name] = this.createMockClient();
            }
            this.isConnected = false;
        }
    }

    createMockClient() {
        const mockStore = new Map();
        return {
            ping: async () => 'PONG',
            get: async (key) => mockStore.get(key) || null,
            set: async (key, value, options) => {
                mockStore.set(key, value);
                return 'OK';
            },
            hGet: async (hash, field) => mockStore.get(`${hash}:${field}`) || null,
            hSet: async (hash, field, value) => {
                mockStore.set(`${hash}:${field}`, value);
                return 1;
            },
            zAdd: async (key, score, member) => {
                mockStore.set(`${key}:${member}`, score);
                return 1;
            },
            zRange: async (key, start, stop) => {
                const results = [];
                for (const [k, v] of mockStore.entries()) {
                    if (k.startsWith(`${key}:`)) {
                        results.push(k.split(':')[1]);
                    }
                }
                return results.slice(start, stop + 1);
            },
            del: async (key) => {
                mockStore.delete(key);
                return 1;
            },
            exists: async (key) => mockStore.has(key) ? 1 : 0,
            expire: async (key, seconds) => {
                setTimeout(() => mockStore.delete(key), seconds * 1000);
                return 1;
            }
        };
    }

    async performanceTest() {
        console.log('🔬 Running DragonflyDB performance test...');
        
        const startTime = Date.now();
        const testOperations = 100;
        
        try {
            const conductor = this.clients.CONDUCTOR;
            
            // Test write performance
            for (let i = 0; i < testOperations; i++) {
                await conductor.set(`test:perf:${i}`, `value_${i}`, { EX: 60 });
            }
            
            // Test read performance
            for (let i = 0; i < testOperations; i++) {
                await conductor.get(`test:perf:${i}`);
            }
            
            const duration = Date.now() - startTime;
            const opsPerSecond = Math.round((testOperations * 2) / (duration / 1000));
            
            console.log(`⚡ Performance: ${testOperations * 2} operations in ${duration}ms (${opsPerSecond} ops/sec)`);
            
            // Cleanup test data
            for (let i = 0; i < testOperations; i++) {
                await conductor.del(`test:perf:${i}`);
            }
            
        } catch (error) {
            console.error('❌ Performance test failed:', error.message);
        }
    }

    generateCacheKey(data, prefix = '') {
        const hash = crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex')
            .substring(0, 16);
        return prefix ? `${prefix}:${hash}` : hash;
    }

    async getCachedAIResponse(promptData) {
        const startTime = Date.now();
        this.metrics.total_operations++;
        
        try {
            const key = this.generateCacheKey(promptData, 'ai_response');
            const conductor = this.clients.CONDUCTOR;
            
            const cached = await conductor.get(key);
            
            if (cached) {
                this.metrics.hits++;
                const parsedData = JSON.parse(cached);
                const cacheAge = (Date.now() - parsedData.timestamp) / (1000 * 60 * 60); // hours
                
                return {
                    ...parsedData,
                    cache_age_hours: cacheAge.toFixed(2)
                };
            }
            
            this.metrics.misses++;
            return null;
            
        } catch (error) {
            this.metrics.errors++;
            console.error('❌ Cache get error:', error.message);
            return null;
        } finally {
            this.metrics.latency_sum += (Date.now() - startTime);
        }
    }

    async cacheAIResponse(promptData, responseData) {
        try {
            const key = this.generateCacheKey(promptData, 'ai_response');
            const conductor = this.clients.CONDUCTOR;
            
            const cacheData = {
                ...responseData,
                timestamp: Date.now(),
                prompt_hash: this.generateCacheKey(promptData)
            };
            
            await conductor.set(key, JSON.stringify(cacheData), { EX: this.ttl.MEDIUM });
            
            // Also cache in pattern learning database
            await this.updatePatternFrequency('ai_response', {
                provider: responseData.provider,
                model: responseData.model,
                success: responseData.success !== false
            });
            
            return true;
            
        } catch (error) {
            this.metrics.errors++;
            console.error('❌ Cache set error:', error.message);
            return false;
        }
    }

    async getCachedPromptRouting(promptData) {
        try {
            const key = this.generateCacheKey(promptData, 'routing');
            const conductor = this.clients.CONDUCTOR;
            
            const cached = await conductor.get(key);
            if (cached) {
                this.metrics.hits++;
                return JSON.parse(cached);
            }
            
            this.metrics.misses++;
            return null;
            
        } catch (error) {
            this.metrics.errors++;
            return null;
        }
    }

    async cachePromptRouting(promptData, routingDecision) {
        try {
            const key = this.generateCacheKey(promptData, 'routing');
            const conductor = this.clients.CONDUCTOR;
            
            const cacheData = {
                routing_decision: routingDecision,
                timestamp: Date.now(),
                provider: routingDecision.provider,
                model: routingDecision.model,
                estimated_cost: routingDecision.estimated_cost
            };
            
            await conductor.set(key, JSON.stringify(cacheData), { EX: this.ttl.SHORT });
            return true;
            
        } catch (error) {
            this.metrics.errors++;
            return false;
        }
    }

    async getCachedWorkflowDecision(workflowData) {
        try {
            const key = this.generateCacheKey(workflowData, 'workflow');
            const validator = this.clients.VALIDATOR;
            
            const cached = await validator.get(key);
            if (cached) {
                this.metrics.hits++;
                return JSON.parse(cached);
            }
            
            this.metrics.misses++;
            return null;
            
        } catch (error) {
            this.metrics.errors++;
            return null;
        }
    }

    async cacheWorkflowDecision(workflowData, optimizedDAG) {
        try {
            const key = this.generateCacheKey(workflowData, 'workflow');
            const validator = this.clients.VALIDATOR;
            
            const cacheData = {
                decision: optimizedDAG,
                execution_plan: optimizedDAG.execution_plan,
                resource_allocation: optimizedDAG.resource_allocation,
                estimated_duration: optimizedDAG.estimated_duration,
                timestamp: Date.now()
            };
            
            await validator.set(key, JSON.stringify(cacheData), { EX: this.ttl.LONG });
            return true;
            
        } catch (error) {
            this.metrics.errors++;
            return false;
        }
    }

    async cachePattern(patternType, patternData) {
        try {
            const learner = this.clients.LEARNER;
            const key = `pattern:${patternType}:${this.generateCacheKey(patternData)}`;
            
            const pattern = {
                type: patternType,
                data: patternData,
                timestamp: Date.now(),
                frequency: 1
            };
            
            await learner.set(key, JSON.stringify(pattern), { EX: this.ttl.LONG });
            return true;
            
        } catch (error) {
            this.metrics.errors++;
            return false;
        }
    }

    async updatePatternFrequency(patternType, patternData) {
        try {
            const learner = this.clients.LEARNER;
            const hash = `pattern_freq:${patternType}`;
            const field = this.generateCacheKey(patternData);
            
            const current = await learner.hGet(hash, field);
            const frequency = current ? parseInt(current) + 1 : 1;
            
            await learner.hSet(hash, field, frequency.toString());
            await learner.expire(hash, this.ttl.LONG);
            
            return frequency;
            
        } catch (error) {
            this.metrics.errors++;
            return 0;
        }
    }

    async getPerformanceMetrics() {
        const totalOps = this.metrics.total_operations || 1;
        
        return {
            cache_hit_ratio: this.metrics.hits / totalOps,
            average_latency_ms: this.metrics.latency_sum / totalOps,
            error_rate: this.metrics.errors / totalOps,
            total_operations: this.metrics.total_operations,
            hits: this.metrics.hits,
            misses: this.metrics.misses,
            errors: this.metrics.errors,
            is_connected: this.isConnected
        };
    }

    calculateEfficiencyScore(metrics) {
        const hit_ratio_score = metrics.cache_hit_ratio * 0.6;
        const latency_score = Math.max(0, (10 - metrics.average_latency_ms) / 10) * 0.3;
        const reliability_score = (1 - metrics.error_rate) * 0.1;
        
        return ((hit_ratio_score + latency_score + reliability_score) * 100).toFixed(1);
    }

    estimateCostSavings(metrics) {
        const estimated_cost_per_ai_call = 0.002; // $0.002 average
        const cost_savings = metrics.hits * estimated_cost_per_ai_call;
        
        return {
            daily_savings: `$${cost_savings.toFixed(4)}`,
            monthly_projection: `$${(cost_savings * 30).toFixed(2)}`,
            annual_projection: `$${(cost_savings * 365).toFixed(2)}`
        };
    }

    generateOptimizationRecommendations(metrics) {
        const recommendations = [];
        
        if (metrics.cache_hit_ratio < 0.6) {
            recommendations.push("Consider increasing cache TTL for better hit ratios");
        }
        
        if (metrics.average_latency_ms > 5) {
            recommendations.push("Network latency high - consider DragonflyDB region optimization");
        }
        
        if (metrics.error_rate > 0.01) {
            recommendations.push("Error rate elevated - check DragonflyDB connection stability");
        }
        
        if (recommendations.length === 0) {
            recommendations.push("Cache performance optimal - no recommendations");
        }
        
        return recommendations;
    }

    async close() {
        console.log('🔌 Closing DragonflyDB connections...');
        
        for (const [name, client] of Object.entries(this.clients)) {
            try {
                if (client.disconnect) {
                    await client.disconnect();
                }
                console.log(`✅ Closed ${name} connection`);
            } catch (error) {
                console.error(`❌ Error closing ${name}:`, error.message);
            }
        }
    }
}

// Singleton instance
export const trinityCache = new TrinityDragonflyCache();
export { TrinityDragonflyCache };