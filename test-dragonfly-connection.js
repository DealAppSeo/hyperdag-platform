#!/usr/bin/env node
/**
 * Trinity Symphony DragonflyDB Connection Test
 * Validates all database connections and performance
 */

import { trinityCache } from './trinity-dragonfly-integration.js';

async function testDragonflyConnection() {
    console.log('🎼 Trinity Symphony DragonflyDB Connection Test');
    console.log('==================================================');
    
    try {
        // Initialize cache
        await trinityCache.initialize();
        
        // Test each database
        const databases = ['CONDUCTOR', 'LEARNER', 'VALIDATOR', 'FALLBACK'];
        const results = [];
        
        for (const dbName of databases) {
            console.log(`\n🔍 Testing ${dbName} database...`);
            
            try {
                const client = trinityCache.clients[dbName];
                if (!client) {
                    throw new Error(`Client not initialized for ${dbName}`);
                }
                
                // Test basic operations
                const testKey = `test:${dbName.toLowerCase()}:${Date.now()}`;
                const testValue = `test_value_${Math.random()}`;
                
                // Performance test
                const startTime = Date.now();
                const operations = 100;
                
                for (let i = 0; i < operations; i++) {
                    await client.set(`${testKey}:${i}`, `${testValue}_${i}`, { EX: 60 });
                }
                
                for (let i = 0; i < operations; i++) {
                    const result = await client.get(`${testKey}:${i}`);
                    if (result !== `${testValue}_${i}`) {
                        throw new Error(`Data integrity check failed for ${dbName}`);
                    }
                }
                
                // Cleanup
                for (let i = 0; i < operations; i++) {
                    await client.del(`${testKey}:${i}`);
                }
                
                const duration = Date.now() - startTime;
                const opsPerSecond = Math.round((operations * 2) / (duration / 1000));
                
                console.log(`   ✅ ${dbName}: SUCCESS`);
                console.log(`   ⚡ Performance: ${operations * 2} operations in ${duration}ms (${opsPerSecond} ops/sec)`);
                
                results.push({
                    database: dbName,
                    success: true,
                    duration_ms: duration,
                    ops_per_second: opsPerSecond
                });
                
            } catch (error) {
                console.log(`   ❌ ${dbName}: FAILED - ${error.message}`);
                results.push({
                    database: dbName,
                    success: false,
                    error: error.message
                });
            }
        }
        
        // Test advanced features
        console.log('\n🚀 Testing advanced caching features...');
        
        // Test AI response caching
        const testPrompt = {
            prompt: "Test AI orchestration prompt",
            model: "test-model",
            urgency: 0.5
        };
        
        const testResponse = {
            content: "Test AI response content",
            provider: "test-provider",
            model: "test-model",
            success: true
        };
        
        // Cache and retrieve
        await trinityCache.cacheAIResponse(testPrompt, testResponse);
        const cached = await trinityCache.getCachedAIResponse(testPrompt);
        
        if (cached && cached.content === testResponse.content) {
            console.log('   ✅ AI Response Caching: SUCCESS');
        } else {
            console.log('   ❌ AI Response Caching: FAILED');
        }
        
        // Test workflow caching
        const testWorkflow = {
            type: "test-workflow",
            tasks: ["task1", "task2"],
            priority: 1
        };
        
        const testDecision = {
            execution_plan: "sequential",
            resource_allocation: { cpu: 2, memory: 512 },
            estimated_duration: 5000
        };
        
        await trinityCache.cacheWorkflowDecision(testWorkflow, testDecision);
        const cachedWorkflow = await trinityCache.getCachedWorkflowDecision(testWorkflow);
        
        if (cachedWorkflow && cachedWorkflow.execution_plan === testDecision.execution_plan) {
            console.log('   ✅ Workflow Caching: SUCCESS');
        } else {
            console.log('   ❌ Workflow Caching: FAILED');
        }
        
        // Get performance metrics
        const metrics = await trinityCache.getPerformanceMetrics();
        
        console.log('\n📊 Performance Summary:');
        console.log(`   Cache Hit Ratio: ${(metrics.cache_hit_ratio * 100).toFixed(1)}%`);
        console.log(`   Average Latency: ${metrics.average_latency_ms.toFixed(2)}ms`);
        console.log(`   Total Operations: ${metrics.total_operations}`);
        console.log(`   Error Rate: ${(metrics.error_rate * 100).toFixed(2)}%`);
        
        // Summary
        const successfulDbs = results.filter(r => r.success).length;
        console.log('\n🎯 Connection Test Results:');
        console.log(`   Successful Connections: ${successfulDbs}/${databases.length}`);
        
        if (successfulDbs === databases.length) {
            console.log('   ✅ All DragonflyDB databases accessible');
            console.log('   ✅ Performance tests completed');
            console.log('   ✅ Trinity Symphony cache ready!');
        } else {
            console.log('   ⚠️  Some connections failed - check configuration');
        }
        
        // Environment setup guide
        if (!trinityCache.isConnected) {
            console.log('\n📋 DragonflyDB Setup Guide:');
            console.log('   1. Sign up at: https://www.dragonflydb.io/cloud');
            console.log('   2. Create a new instance');
            console.log('   3. Set environment variables:');
            console.log('      export DRAGONFLY_HOST=your-instance.cloud.dragonflydb.io');
            console.log('      export DRAGONFLY_PORT=6379');
            console.log('      export DRAGONFLY_PASSWORD=your-password');
            console.log('      export DRAGONFLY_TLS=true');
            console.log('   4. Restart your application');
        }
        
        return successfulDbs === databases.length;
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        return false;
    } finally {
        // Close connections
        await trinityCache.close();
    }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testDragonflyConnection()
        .then(success => {
            console.log('\n' + '='.repeat(50));
            if (success) {
                console.log('✅ DragonflyDB connection test completed successfully');
                process.exit(0);
            } else {
                console.log('❌ DragonflyDB connection test failed');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Test execution error:', error);
            process.exit(1);
        });
}

export { testDragonflyConnection };