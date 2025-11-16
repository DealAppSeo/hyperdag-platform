#!/usr/bin/env python3
# HyperDagManager Health Check - Complete System Diagnostic

import os
import json
import requests
import psutil
from datetime import datetime, timedelta
from collections import Counter

print("=== HYPERDAGMANAGER HEALTH CHECK ===")
print(f"Timestamp: {datetime.now()}")
print(f"Platform: Replit")

# Initialize results
health_report = {
    "system": "HyperDagManager",
    "timestamp": datetime.now().isoformat(),
    "capabilities": {},
    "issues_found": [],
    "recommendations": [],
    "performance": {}
}

# 1. CORE FUNCTIONALITY TEST
print("\n🔧 CORE FUNCTIONALITY TEST:")
try:
    import networkx as nx
    G = nx.DiGraph()
    G.add_edge("test1", "test2", weight=0.9)
    print("✅ NetworkX operational")
    print(f"  Nodes: {G.number_of_nodes()}")
    print(f"  Edges: {G.number_of_edges()}")
    health_report["capabilities"]["graph_library"] = "operational"
except Exception as e:
    print(f"❌ NetworkX error: {e}")
    health_report["capabilities"]["graph_library"] = "failed"
    health_report["issues_found"].append(f"NetworkX library error: {e}")

# Check for existing graphs
try:
    import pickle
    if os.path.exists("discovery_graph.pickle"):
        with open("discovery_graph.pickle", "rb") as f:
            stored_graph = pickle.load(f)
        print(f"✅ Existing graph loaded: {stored_graph.number_of_nodes()} nodes")
        health_report["graph_stats"] = {
            "existing_nodes": stored_graph.number_of_nodes(),
            "existing_edges": stored_graph.number_of_edges()
        }
    else:
        print("⚠️ No existing graph found - starting fresh")
        health_report["graph_stats"] = {"existing_nodes": 0, "existing_edges": 0}
except Exception as e:
    print(f"❌ Graph loading error: {e}")
    health_report["issues_found"].append(f"Graph persistence error: {e}")

# 2. WEB SCRAPING CAPABILITIES
print("\n🌐 WEB ACCESS TEST:")
test_urls = {
    "ProPublica Nonprofits": "https://projects.propublica.org/nonprofits/",
    "Grants.gov": "https://www.grants.gov/search-grants",
    "DevPost": "https://devpost.com/hackathons",
    "IRS EO Search": "https://apps.irs.gov/app/eos/",
    "Google.org": "https://google.org/our-work/",
    "GitHub API": "https://api.github.com/search/repositories?q=hackathon+nonprofit"
}

web_results = {}
for name, url in test_urls.items():
    try:
        response = requests.get(url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        if response.status_code == 200:
            print(f"  ✅ {name}: Accessible")
            web_results[name] = "accessible"
        elif response.status_code == 403:
            print(f"  ❌ {name}: Blocked (403)")
            web_results[name] = "blocked"
        else:
            print(f"  ⚠️ {name}: Status {response.status_code}")
            web_results[name] = f"status_{response.status_code}"
    except Exception as e:
        print(f"  ❌ {name}: {str(e)[:50]}")
        web_results[name] = f"error: {str(e)[:30]}"

health_report["capabilities"]["web_access"] = web_results

# 3. DATABASE CONNECTION TEST
print("\n🗄️ DATABASE CONNECTION TEST:")
try:
    # Test if we have database environment variables
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        print("✅ Database URL configured")
        # Test connection with a simple query
        import psycopg2
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        cursor.execute("SELECT 1;")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        print("✅ PostgreSQL connection successful")
        health_report["capabilities"]["database"] = "connected"
    else:
        print("❌ No DATABASE_URL configured")
        health_report["capabilities"]["database"] = "not_configured"
        health_report["issues_found"].append("DATABASE_URL environment variable missing")
except Exception as e:
    print(f"❌ Database connection error: {e}")
    health_report["capabilities"]["database"] = "failed"
    health_report["issues_found"].append(f"Database error: {e}")

# 4. AI SERVICES TEST
print("\n🤖 AI SERVICES TEST:")
try:
    # Test current system status by checking running server
    response = requests.get("http://localhost:5000/api/system/health", timeout=5)
    if response.status_code == 200:
        system_status = response.json()
        print("✅ HyperDagManager API responsive")
        print(f"  Status: {system_status.get('status', 'unknown')}")
        health_report["capabilities"]["api_server"] = "operational"
        health_report["performance"]["api_response_time"] = response.elapsed.total_seconds()
    else:
        print(f"⚠️ API responded with status: {response.status_code}")
        health_report["capabilities"]["api_server"] = f"status_{response.status_code}"
except Exception as e:
    print(f"❌ Cannot reach HyperDagManager API: {e}")
    health_report["capabilities"]["api_server"] = "unreachable"
    health_report["issues_found"].append(f"API server unreachable: {e}")

# 5. AUTONOMOUS AGENTS STATUS
print("\n🤖 AUTONOMOUS AGENTS STATUS:")
try:
    response = requests.get("http://localhost:5000/api/autonomous-agents/status", timeout=5)
    if response.status_code == 200:
        agents_status = response.json()
        print("✅ Autonomous agents system operational")
        print(f"  Active agents: {len(agents_status.get('agents', []))}")
        total_tasks = 0
        success_rate = 0
        for agent in agents_status.get('agents', []):
            tasks = agent.get('tasks_completed', 0)
            success = agent.get('success_rate', 0)
            total_tasks += tasks
            success_rate += success
        avg_success_rate = success_rate / len(agents_status.get('agents', [1])) if agents_status.get('agents') else 0
        print(f"  Total tasks completed: {total_tasks}")
        print(f"  Average success rate: {avg_success_rate:.1f}%")
        health_report["performance"]["agents"] = {
            "active_count": len(agents_status.get('agents', [])),
            "total_tasks": total_tasks,
            "success_rate": avg_success_rate
        }
    else:
        print(f"⚠️ Agents API status: {response.status_code}")
        health_report["issues_found"].append(f"Agents API returned {response.status_code}")
except Exception as e:
    print(f"❌ Cannot check agents status: {e}")
    health_report["issues_found"].append(f"Agents status check failed: {e}")

# 6. RESOURCE ARBITRAGE ENGINE
print("\n💰 RESOURCE ARBITRAGE ENGINE:")
try:
    response = requests.get("http://localhost:5000/api/resource-arbitrage/status", timeout=5)
    if response.status_code == 200:
        arbitrage_status = response.json()
        print("✅ Resource arbitrage engine operational")
        print(f"  Cost savings achieved: {arbitrage_status.get('cost_savings_percentage', 0)}%")
        print(f"  Opportunities found: {arbitrage_status.get('opportunities_count', 0)}")
        health_report["performance"]["resource_arbitrage"] = arbitrage_status
    else:
        print(f"⚠️ Arbitrage API status: {response.status_code}")
except Exception as e:
    print(f"❌ Cannot check arbitrage status: {e}")

# 7. CROSS-PLATFORM COORDINATION
print("\n🔗 CROSS-PLATFORM COORDINATION:")
try:
    response = requests.get("http://localhost:5000/api/cross-platform/status", timeout=5)
    if response.status_code == 200:
        coordination_status = response.json()
        print("✅ Cross-platform coordination active")
        print(f"  Connected platforms: {len(coordination_status.get('connected_platforms', []))}")
        health_report["capabilities"]["cross_platform"] = "operational"
    else:
        print(f"⚠️ Coordination API status: {response.status_code}")
        health_report["capabilities"]["cross_platform"] = f"status_{response.status_code}"
except Exception as e:
    print(f"❌ Cannot check coordination status: {e}")
    health_report["capabilities"]["cross_platform"] = "failed"

# 8. RESOURCE USAGE
print("\n💾 RESOURCE USAGE:")
try:
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    print(f"  CPU Usage: {cpu_percent}%")
    print(f"  Memory: {memory.percent}%")
    print(f"  Disk: {disk.percent}%")
    
    health_report["performance"]["resources"] = {
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "disk_percent": disk.percent
    }
    
    # Check for resource issues
    if cpu_percent > 80:
        health_report["issues_found"].append("High CPU usage detected")
    if memory.percent > 80:
        health_report["issues_found"].append("High memory usage detected")
    if disk.percent > 80:
        health_report["issues_found"].append("Low disk space")
        
except Exception as e:
    print(f"❌ Cannot check resource usage: {e}")

# 9. GENERATE RECOMMENDATIONS
print("\n💡 GENERATING RECOMMENDATIONS:")

accessible_sites = sum(1 for status in web_results.values() if status == "accessible")
total_sites = len(web_results)

if accessible_sites < total_sites * 0.7:
    health_report["recommendations"].append("Consider implementing proxy or VPN for better web access")

if health_report["capabilities"].get("database") != "connected":
    health_report["recommendations"].append("Database connection needs to be established for full functionality")

if health_report["capabilities"].get("api_server") != "operational":
    health_report["recommendations"].append("API server needs to be started for cross-platform communication")

# 10. FINAL HEALTH REPORT
print("\n📋 COMPREHENSIVE HEALTH CHECK SUMMARY:")
print("=" * 50)
print(json.dumps(health_report, indent=2, default=str))

# Save report to file
with open("health_check_report.json", "w") as f:
    json.dump(health_report, f, indent=2, default=str)

print("\n✅ Health check complete. Report saved to 'health_check_report.json'")

# Quick status summary
operational_count = sum(1 for cap in health_report["capabilities"].values() 
                       if isinstance(cap, str) and cap in ["operational", "connected", "accessible"])
total_capabilities = len([cap for cap in health_report["capabilities"].values() 
                         if isinstance(cap, str)])

print(f"\n📊 SYSTEM HEALTH SCORE: {operational_count}/{total_capabilities} capabilities operational")
print(f"🚨 ISSUES FOUND: {len(health_report['issues_found'])}")
print(f"💡 RECOMMENDATIONS: {len(health_report['recommendations'])}")