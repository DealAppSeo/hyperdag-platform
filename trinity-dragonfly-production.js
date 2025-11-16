/**
 * Trinity Symphony DragonflyDB Production Integration
 * Enterprise-grade caching with actual DragonflyDB Cloud instance
 */

import redis from 'redis';
import dotenv from 'dotenv';

// Load production environment variables
dotenv.config({ path: '.env.dragonfly' });

class TrinityDragonflyProduction {
    constructor() {
        this.clients = {};
        this.isConnected = false;
        this.useMock = false;
        this.mockClient = new Map();
        this.performanceMetrics = {
            operations: 0,
            hits: 0,
            misses: 0,
            errors: 0,
            totalLatency: 0,
            startTime: Date.now()
        };
    }

    async initialize() {
        console.log('🎼 Trinity Symphony: Connecting to DragonflyDB Cloud...');
        
        // Production DragonflyDB configuration
        const productionConfig = {
            host: 'ar1o3ash4.dragonflydb.cloud',
            port: 6385,
            password: 'lqw9w5vml5d9',
            tls: true
        };

        const dbConfigs = [
            { name: 'CONDUCTOR', db: 0, purpose: 'AI-Prompt-Manager cache' },
            { name: 'LEARNER', db: 1, purpose: 'Pattern discovery cache' },
            { name: 'VALIDATOR', db: 2, purpose: 'HyperDAGManager cache' },
            { name: 'FALLBACK', db: 3, purpose: 'Emergency backup cache' }
        ];

        let connectedCount = 0;

        for (const config of dbConfigs) {
            try {
                console.log(`🔗 Connecting to DragonflyDB ${config.name} (DB${config.db})...`);
                
                const client = redis.createClient({
                    socket: {
                        host: productionConfig.host,
                        port: productionConfig.port,
                        tls: productionConfig.tls,
                        connectTimeout: 5000,
                        lazyConnect: true
                    },
                    password: productionConfig.password,
                    database: config.db
                });

                client.on('error', (err) => {
                    console.log(`❌ DragonflyDB ${config.name} error: ${err.message}`);
                });

                client.on('connect', () => {
                    console.log(`✅ DragonflyDB ${config.name} connected successfully`);
                });

                await client.connect();
                
                // Test the connection
                await client.ping();
                
                this.clients[config.name] = client;
                console.log(`✅ DragonflyDB ${config.name} (DB${config.db}): PRODUCTION CONNECTED`);
                console.log(`   📋 Purpose: ${config.purpose}`);
                connectedCount++;

            } catch (error) {
                console.log(`❌ DragonflyDB ${config.name} connection failed: ${error.message}`);
                this.clients[config.name] = null;
            }
        }

        if (connectedCount === 0) {
            console.log('⚠️ No DragonflyDB connections available. Using mock cache.');
            this.isConnected = false;
            this.useMock = true;
        } else {
            console.log(`🚀 Trinity Symphony PRODUCTION: ${connectedCount}/4 databases connected`);
            console.log(`🎯 Enterprise-grade caching ACTIVE with DragonflyDB Cloud`);
            this.isConnected = true;
            this.useMock = false;
        }

        return this.isConnected;
    }

    async get(key, dbName = 'CONDUCTOR') {
        const startTime = Date.now();
        this.performanceMetrics.operations++;

        try {
            if (this.useMock) {
                const value = this.mockClient.get(key);
                if (value !== undefined) {
                    console.log(`💾 Mock Cache HIT: ${key.substring(0, 50)}...`);
                    this.performanceMetrics.hits++;
                    return JSON.parse(value);
                } else {
                    console.log(`💾 Mock Cache MISS: ${key.substring(0, 50)}...`);
                    this.performanceMetrics.misses++;
                    return null;
                }
            }

            const client = this.clients[dbName];
            if (!client) {
                this.performanceMetrics.errors++;
                return null;
            }

            const value = await client.get(key);
            const latency = Date.now() - startTime;
            this.performanceMetrics.totalLatency += latency;

            if (value) {
                console.log(`⚡ DragonflyDB ${dbName} HIT (${latency}ms): ${key.substring(0, 50)}...`);
                this.performanceMetrics.hits++;
                return JSON.parse(value);
            } else {
                console.log(`💾 DragonflyDB ${dbName} MISS: ${key.substring(0, 50)}...`);
                this.performanceMetrics.misses++;
                return null;
            }
        } catch (error) {
            console.log(`❌ Cache get error: ${error.message}`);
            this.performanceMetrics.errors++;
            return null;
        }
    }

    async set(key, value, ttl = 3600, dbName = 'CONDUCTOR') {
        try {
            if (this.useMock) {
                this.mockClient.set(key, JSON.stringify(value));
                console.log(`💾 Mock Cache SET: ${key.substring(0, 50)}...`);
                return true;
            }

            const client = this.clients[dbName];
            if (!client) {
                console.log(`❌ Cache set error: ${dbName} client not available`);
                return false;
            }

            await client.setEx(key, ttl, JSON.stringify(value));
            console.log(`⚡ DragonflyDB ${dbName} SET (TTL: ${ttl}s): ${key.substring(0, 50)}...`);
            return true;
        } catch (error) {
            console.log(`❌ Cache set error: ${error.message}`);
            return false;
        }
    }

    getPerformanceMetrics() {
        const runtime = (Date.now() - this.performanceMetrics.startTime) / 1000;
        const avgLatency = this.performanceMetrics.operations > 0 
            ? this.performanceMetrics.totalLatency / this.performanceMetrics.operations 
            : 0;
        
        const hitRatio = this.performanceMetrics.operations > 0 
            ? (this.performanceMetrics.hits / this.performanceMetrics.operations) * 100 
            : 0;
        
        const errorRate = this.performanceMetrics.operations > 0 
            ? (this.performanceMetrics.errors / this.performanceMetrics.operations) * 100 
            : 0;

        return {
            hit_ratio_percentage: hitRatio.toFixed(1),
            average_latency_ms: avgLatency.toFixed(2),
            error_rate_percentage: errorRate.toFixed(2),
            total_operations: this.performanceMetrics.operations,
            cache_hits: this.performanceMetrics.hits,
            cache_misses: this.performanceMetrics.misses,
            connection_status: this.isConnected ? 'Production Connected' : 'Mock Cache',
            runtime_seconds: runtime.toFixed(1)
        };
    }

    async cleanup() {
        console.log('🧹 Cleaning up DragonflyDB connections...');
        for (const [name, client] of Object.entries(this.clients)) {
            if (client) {
                try {
                    await client.quit();
                    console.log(`✅ ${name} connection closed`);
                } catch (error) {
                    console.log(`⚠️ Error closing ${name}: ${error.message}`);
                }
            }
        }
    }
}

// Create global instance
const trinityCache = new TrinityDragonflyProduction();

// Graceful shutdown
process.on('SIGINT', async () => {
    await trinityCache.cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await trinityCache.cleanup();
    process.exit(0);
});

export default trinityCache;