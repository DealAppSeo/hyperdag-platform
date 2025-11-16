/**
 * Trinity Symphony MotherDuck Integration
 * Cloud-native analytical database for Trinity Symphony AI orchestration
 * Complements DragonflyDB caching with analytical capabilities
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

class TrinityMotherDuckIntegration {
    constructor() {
        this.isConnected = false;
        this.connectionString = 'md:';
        this.analyticsMetrics = {
            queries: 0,
            totalLatency: 0,
            startTime: Date.now()
        };
    }

    async initialize() {
        console.log('🦆 Trinity Symphony: Initializing MotherDuck integration...');
        
        try {
            // Test DuckDB installation
            const duckdbTest = await this.testDuckDBInstallation();
            if (!duckdbTest) {
                console.log('❌ DuckDB not available. Installing...');
                return false;
            }

            // Check for authentication token
            const hasToken = process.env.MOTHERDUCK_TOKEN || process.env.motherduck_token;
            if (!hasToken) {
                console.log('🔑 MotherDuck authentication required');
                console.log('📋 Please set MOTHERDUCK_TOKEN environment variable');
                console.log('🌐 Get your token at: https://motherduck.com');
                return false;
            }

            // Create Trinity analytical tables
            await this.createTrinityTables();
            
            console.log('✅ MotherDuck Trinity Symphony analytics ready');
            this.isConnected = true;
            return true;

        } catch (error) {
            console.log(`❌ MotherDuck initialization failed: ${error.message}`);
            if (error.message.includes('no token provided')) {
                console.log('🔑 Authentication required: Please set MOTHERDUCK_TOKEN');
            }
            this.isConnected = false;
            return false;
        }
    }

    async testDuckDBInstallation() {
        return new Promise((resolve) => {
            const python = spawn('python3', ['-c', 'import duckdb; print("DuckDB available")']);
            
            python.on('close', (code) => {
                resolve(code === 0);
            });
            
            python.on('error', () => {
                resolve(false);
            });
        });
    }

    async createTrinityTables() {
        console.log('🏗️ Creating Trinity Symphony analytical tables...');
        
        const sqlScript = `
-- Trinity Symphony Advanced Analytics Schema
CREATE SCHEMA IF NOT EXISTS trinity_analytics;

-- Core Trinity Request Tracking (Your Enhanced Schema)
CREATE TABLE IF NOT EXISTS trinity_analytics.trinity_requests (
    id UUID DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    manager_type VARCHAR(50), -- 'conductor', 'learner', 'validator', 'fallback'
    provider VARCHAR(50),
    model VARCHAR(100),
    cost_usd DECIMAL(10,6),
    latency_ms INTEGER,
    success BOOLEAN,
    cache_hit BOOLEAN,
    query_embedding FLOAT[],
    complexity_score FLOAT,
    metadata JSON
);

-- Arbitrage Opportunities Detection
CREATE TABLE IF NOT EXISTS trinity_analytics.arbitrage_opportunities (
    id UUID DEFAULT gen_random_uuid(),
    discovered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    opportunity_type VARCHAR(100),
    estimated_savings_usd DECIMAL(10,2),
    confidence_score DECIMAL(3,2),
    provider_from VARCHAR(50),
    provider_to VARCHAR(50),
    conditions JSON,
    status VARCHAR(20) DEFAULT 'active'
);

-- Cache Performance Analytics (Enhanced)
CREATE TABLE IF NOT EXISTS trinity_analytics.cache_analytics (
    id UUID DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    cache_type VARCHAR(50), -- 'dragonfly', 'mock'
    operation VARCHAR(20), -- 'hit', 'miss', 'set'
    key_pattern VARCHAR(200),
    latency_ms FLOAT,
    data_size_bytes INTEGER,
    ttl_seconds INTEGER,
    efficiency_score FLOAT
);

-- ANFIS Routing Intelligence (Enhanced)
CREATE TABLE IF NOT EXISTS trinity_analytics.anfis_routing (
    id UUID DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    prompt_complexity FLOAT,
    selected_provider VARCHAR(50),
    confidence_score FLOAT,
    success_rate FLOAT,
    cost_efficiency FLOAT,
    routing_metadata JSON,
    optimization_applied VARCHAR(100)
);

-- Enterprise Performance Dashboard
CREATE TABLE IF NOT EXISTS trinity_analytics.performance_dashboard (
    id UUID DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metric_type VARCHAR(100),
    metric_value FLOAT,
    unit VARCHAR(20),
    component VARCHAR(50),
    period_type VARCHAR(20) -- 'realtime', 'hourly', 'daily'
);

-- Cost Optimization Tracking (Enhanced)
CREATE TABLE IF NOT EXISTS trinity_analytics.cost_optimization (
    id UUID DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    optimization_type VARCHAR(100),
    original_cost DECIMAL(10,6),
    optimized_cost DECIMAL(10,6),
    savings_percentage DECIMAL(5,2),
    method VARCHAR(100),
    savings_usd DECIMAL(10,2)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orchestration_timestamp ON trinity_analytics.orchestration_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_cache_timestamp ON trinity_analytics.cache_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_anfis_timestamp ON trinity_analytics.anfis_routing(timestamp);
CREATE INDEX IF NOT EXISTS idx_dashboard_timestamp ON trinity_analytics.performance_dashboard(timestamp);
CREATE INDEX IF NOT EXISTS idx_cost_timestamp ON trinity_analytics.cost_optimization(timestamp);

-- Advanced Analytics Views with Cost-Effective Provider Focus
CREATE OR REPLACE VIEW trinity_analytics.realtime_performance AS
SELECT 
    manager_type as component,
    provider,
    COUNT(*) as total_operations,
    AVG(latency_ms) as avg_latency,
    AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) * 100 as success_rate,
    SUM(cost_usd) as total_cost,
    AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
    CASE 
        WHEN provider IN ('groq', 'huggingface') THEN 'free-tier'
        WHEN provider IN ('together-ai', 'anyscale', 'fireworks-ai') THEN 'cost-effective'
        WHEN provider = 'openrouter' THEN 'premium-diverse'
        WHEN provider IN ('openai', 'anthropic') THEN 'premium-critical'
        ELSE 'unknown'
    END as cost_category
FROM trinity_analytics.trinity_requests 
WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY manager_type, provider;

CREATE OR REPLACE VIEW trinity_analytics.cache_efficiency AS
SELECT 
    cache_type,
    operation,
    COUNT(*) as operation_count,
    AVG(latency_ms) as avg_latency,
    SUM(data_size_bytes) as total_data_bytes,
    AVG(efficiency_score) as avg_efficiency
FROM trinity_analytics.cache_analytics 
WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY cache_type, operation;

CREATE OR REPLACE VIEW trinity_analytics.provider_performance AS
SELECT 
    provider,
    model,
    AVG(cost_usd) as avg_cost,
    AVG(latency_ms) as avg_latency,
    SUM(success::int) / COUNT(*)::float as success_rate,
    COUNT(*) as total_requests,
    CASE 
        WHEN provider IN ('groq', 'huggingface') THEN 'free-tier'
        WHEN provider = 'together-ai' THEN 'cost-effective'
        ELSE 'premium'
    END as cost_tier,
    -- Enhanced scoring favoring cost-effective providers
    (SUM(success::int) / COUNT(*)::float * 0.3 + 
     CASE 
        WHEN AVG(cost_usd) = 0 THEN 1.0  -- Max score for free tier
        ELSE (1/AVG(cost_usd)) * 0.4     -- Higher weight for cost
     END + 
     (1/AVG(latency_ms)) * 0.3) as performance_score
FROM trinity_analytics.trinity_requests 
WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY provider, model
ORDER BY performance_score DESC;

CREATE OR REPLACE VIEW trinity_analytics.arbitrage_summary AS
SELECT 
    opportunity_type,
    COUNT(*) as opportunities_found,
    AVG(estimated_savings_usd) as avg_savings,
    SUM(estimated_savings_usd) as total_potential_savings,
    AVG(confidence_score) as avg_confidence
FROM trinity_analytics.arbitrage_opportunities 
WHERE discovered_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
AND status = 'active'
GROUP BY opportunity_type;
`;

        await this.executeDuckDBScript(sqlScript);
        console.log('✅ Trinity Symphony analytical tables created');
    }

    async executeDuckDBScript(sql) {
        return new Promise((resolve, reject) => {
            const pythonScript = `
import duckdb
import sys

try:
    # Connect to MotherDuck
    conn = duckdb.connect('md:')
    
    # Execute SQL
    conn.execute("""${sql.replace(/"/g, '\\"')}""")
    
    print("SQL executed successfully")
    sys.exit(0)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
`;

            const python = spawn('python3', ['-c', pythonScript]);
            
            python.stdout.on('data', (data) => {
                console.log(`🦆 MotherDuck: ${data.toString().trim()}`);
            });

            python.stderr.on('data', (data) => {
                console.log(`❌ MotherDuck Error: ${data.toString().trim()}`);
            });

            python.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`DuckDB script failed with code ${code}`));
                }
            });
        });
    }

    async logTrinityRequest(requestData) {
        if (!this.isConnected) return;

        const {
            managerType,
            provider,
            model,
            costUsd,
            latencyMs,
            success,
            cacheHit,
            complexityScore,
            metadata = {}
        } = requestData;

        const sql = `
INSERT INTO trinity_analytics.trinity_requests 
(manager_type, provider, model, cost_usd, latency_ms, success, cache_hit, complexity_score, metadata)
VALUES ('${managerType}', '${provider}', '${model}', ${costUsd}, ${latencyMs}, ${success}, ${cacheHit}, ${complexityScore}, '${JSON.stringify(metadata)}');
`;

        try {
            await this.executeDuckDBScript(sql);
            this.analyticsMetrics.queries++;
            
            // Trigger arbitrage analysis
            const opportunities = await this.findArbitrageOpportunities();
            return opportunities;
        } catch (error) {
            console.log(`❌ Failed to log Trinity request: ${error.message}`);
            return [];
        }
    }

    async findArbitrageOpportunities() {
        if (!this.isConnected) return [];

        const sql = `
WITH provider_costs AS (
    SELECT 
        provider,
        model,
        AVG(cost_usd) as avg_cost,
        AVG(latency_ms) as avg_latency,
        COUNT(*) as request_count,
        CASE 
            WHEN provider IN ('groq', 'huggingface') THEN 'free-tier'
            WHEN provider IN ('together-ai', 'anyscale', 'fireworks-ai') THEN 'cost-effective'
            WHEN provider = 'openrouter' THEN 'premium-diverse'
            WHEN provider IN ('openai', 'anthropic') THEN 'premium-critical'
            ELSE 'unknown'
        END as cost_tier
    FROM trinity_analytics.trinity_requests 
    WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '1 hour'
    AND success = true
    GROUP BY provider, model
    HAVING COUNT(*) >= 2  -- Lower threshold for new providers
),
cost_differences AS (
    SELECT 
        p1.provider as expensive_provider,
        p1.model as expensive_model,
        p1.avg_cost as expensive_cost,
        p1.cost_tier as expensive_tier,
        p2.provider as cheap_provider,
        p2.model as cheap_model,
        p2.avg_cost as cheap_cost,
        p2.cost_tier as cheap_tier,
        (p1.avg_cost - p2.avg_cost) as savings_per_request,
        CASE 
            WHEN p1.avg_cost = 0 AND p2.avg_cost = 0 THEN 0
            WHEN p1.avg_cost = 0 THEN 0
            ELSE (p1.avg_cost - p2.avg_cost) / p1.avg_cost
        END as savings_percentage
    FROM provider_costs p1
    JOIN provider_costs p2 ON p1.provider != p2.provider
    WHERE (p1.avg_cost > p2.avg_cost OR (p1.avg_cost > 0 AND p2.avg_cost = 0))
    AND ABS(p1.avg_latency - p2.avg_latency) < 200  -- More flexible latency threshold
    AND p2.cost_tier IN ('free-tier', 'cost-effective', 'premium-diverse')  -- Prioritize cost-effective alternatives
)
SELECT 
    CASE 
        WHEN cheap_tier = 'free-tier' THEN 'switch_to_free_tier'
        ELSE 'provider_switch'
    END as opportunity_type,
    CASE 
        WHEN expensive_cost > 0 THEN savings_per_request * 1000
        ELSE 50.0  -- Estimated savings when switching to free tier
    END as estimated_savings_usd,
    CASE 
        WHEN cheap_tier = 'free-tier' THEN 0.95
        ELSE LEAST(savings_percentage, 0.90)
    END as confidence_score,
    expensive_provider as provider_from,
    cheap_provider as provider_to
FROM cost_differences
WHERE (savings_percentage > 0.10 OR cheap_tier = 'free-tier')  -- Lower threshold, prioritize free tier
ORDER BY estimated_savings_usd DESC
LIMIT 10;
`;

        return new Promise((resolve) => {
            const pythonScript = `
import duckdb
import json
import sys

try:
    conn = duckdb.connect('md:')
    result = conn.execute("""${sql.replace(/"/g, '\\"')}""").fetchall()
    
    opportunities = []
    for row in result:
        opportunities.append({
            'opportunity_type': row[0],
            'estimated_savings_usd': float(row[1]),
            'confidence_score': float(row[2]),
            'provider_from': row[3],
            'provider_to': row[4]
        })
    
    print(json.dumps(opportunities))
    sys.exit(0)
except Exception as e:
    print("[]")
    sys.exit(0)
`;

            const python = spawn('python3', ['-c', pythonScript]);
            let output = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.on('close', (code) => {
                try {
                    resolve(JSON.parse(output.trim()));
                } catch (e) {
                    resolve([]);
                }
            });
        });
    }

    async selectOptimalProvider(queryData) {
        if (!this.isConnected) return null;

        const { complexityScore = 0.5, maxCost = 0.01, maxLatency = 2000 } = queryData;

        const sql = `
SELECT 
    provider,
    model,
    avg_cost,
    avg_latency,
    success_rate,
    performance_score
FROM trinity_analytics.provider_performance
WHERE avg_cost <= ${maxCost}
AND avg_latency <= ${maxLatency}
AND success_rate >= 0.85
AND total_requests >= 5
ORDER BY performance_score DESC
LIMIT 1;
`;

        return new Promise((resolve) => {
            const pythonScript = `
import duckdb
import json
import sys

try:
    conn = duckdb.connect('md:')
    result = conn.execute("""${sql.replace(/"/g, '\\"')}""").fetchone()
    
    if result:
        provider_data = {
            'provider': result[0],
            'model': result[1],
            'avg_cost': float(result[2]),
            'avg_latency': float(result[3]),
            'success_rate': float(result[4]),
            'performance_score': float(result[5])
        }
        print(json.dumps(provider_data))
    else:
        print("null")
    sys.exit(0)
except Exception as e:
    print("null")
    sys.exit(0)
`;

            const python = spawn('python3', ['-c', pythonScript]);
            let output = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.on('close', (code) => {
                try {
                    const result = JSON.parse(output.trim());
                    resolve(result);
                } catch (e) {
                    resolve(null);
                }
            });
        });
    }

    async logCacheMetric(cacheType, operation, keyPattern, latencyMs, dataSizeBytes = 0, ttlSeconds = 0) {
        if (!this.isConnected) return;

        const sql = `
INSERT INTO trinity_analytics.cache_analytics 
(cache_type, operation, key_pattern, latency_ms, data_size_bytes, ttl_seconds)
VALUES ('${cacheType}', '${operation}', '${keyPattern}', ${latencyMs}, ${dataSizeBytes}, ${ttlSeconds});
`;

        try {
            await this.executeDuckDBScript(sql);
        } catch (error) {
            console.log(`❌ Failed to log cache metric: ${error.message}`);
        }
    }

    async getRealtimeAnalytics() {
        if (!this.isConnected) {
            return { error: 'MotherDuck not connected' };
        }

        const sql = `
SELECT 
    'performance' as metric_type,
    json_object(
        'total_operations', COALESCE(SUM(total_operations), 0),
        'avg_latency_ms', COALESCE(AVG(avg_latency), 0),
        'avg_success_rate', COALESCE(AVG(success_rate), 0),
        'total_cost', COALESCE(SUM(total_cost), 0),
        'avg_cache_hit_rate', COALESCE(AVG(cache_hit_rate), 0),
        'components', json_group_array(
            json_object(
                'component', component,
                'provider', provider,
                'operations', total_operations,
                'latency', avg_latency,
                'success_rate', success_rate,
                'cost', total_cost,
                'cache_hit_rate', cache_hit_rate
            )
        )
    ) as data
FROM trinity_analytics.realtime_performance
UNION ALL
SELECT 
    'cache_efficiency' as metric_type,
    json_object(
        'operations', json_group_array(
            json_object(
                'cache_type', cache_type,
                'operation', operation,
                'count', operation_count,
                'avg_latency', avg_latency,
                'total_bytes', total_data_bytes,
                'efficiency', avg_efficiency
            )
        )
    ) as data
FROM trinity_analytics.cache_efficiency
UNION ALL
SELECT 
    'provider_rankings' as metric_type,
    json_object(
        'providers', json_group_array(
            json_object(
                'provider', provider,
                'model', model,
                'avg_cost', avg_cost,
                'avg_latency', avg_latency,
                'success_rate', success_rate,
                'performance_score', performance_score,
                'total_requests', total_requests
            )
        )
    ) as data
FROM trinity_analytics.provider_performance
UNION ALL
SELECT 
    'arbitrage_opportunities' as metric_type,
    json_object(
        'opportunities', json_group_array(
            json_object(
                'type', opportunity_type,
                'count', opportunities_found,
                'avg_savings', avg_savings,
                'total_savings', total_potential_savings,
                'confidence', avg_confidence
            )
        )
    ) as data
FROM trinity_analytics.arbitrage_summary;
`;

        return new Promise((resolve, reject) => {
            const pythonScript = `
import duckdb
import json
import sys

try:
    conn = duckdb.connect('md:')
    result = conn.execute("""${sql.replace(/"/g, '\\"')}""").fetchall()
    
    analytics = {}
    for row in result:
        try:
            analytics[row[0]] = json.loads(row[1])
        except:
            analytics[row[0]] = {}
    
    print(json.dumps(analytics))
    sys.exit(0)
except Exception as e:
    print('{"error": "Analytics query failed"}')
    sys.exit(0)
`;

            const python = spawn('python3', ['-c', pythonScript]);
            let output = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.on('close', (code) => {
                try {
                    resolve(JSON.parse(output.trim()));
                } catch (e) {
                    resolve({ error: 'Failed to parse analytics data' });
                }
            });
        });
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            connection_string: this.connectionString,
            queries_executed: this.analyticsMetrics.queries,
            uptime_seconds: Math.floor((Date.now() - this.analyticsMetrics.startTime) / 1000)
        };
    }
}

// Create global instance
const trinityMotherDuck = new TrinityMotherDuckIntegration();

export default trinityMotherDuck;