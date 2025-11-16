#!/usr/bin/env python3
import requests
import json
import time

def test_ai_providers():
    base_url = "http://localhost:5000"
    providers = ['openai', 'anthropic', 'deepseek', 'myninja', 'asi1', 'huggingface', 'perplexity']
    
    print("🧪 Quick AI Provider Validation")
    print("-" * 40)
    
    working_count = 0
    response_times = []
    
    for provider in providers:
        try:
            start = time.time()
            response = requests.post(
                f"{base_url}/api/web3-ai/request",
                json={"service": "ai", "provider": provider, "data": {"prompt": "TEST"}},
                timeout=10
            )
            end = time.time()
            response_time = (end - start) * 1000
            
            if response.status_code == 200:
                working_count += 1
                response_times.append(response_time)
                print(f"✅ {provider}: {response_time:.1f}ms")
            else:
                print(f"❌ {provider}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ {provider}: {str(e)[:50]}")
    
    print(f"\n📊 Results:")
    print(f"Working providers: {working_count}/{len(providers)}")
    
    if response_times:
        avg_time = sum(response_times) / len(response_times)
        sub_800_count = sum(1 for t in response_times if t < 800)
        print(f"Average response time: {avg_time:.1f}ms")
        print(f"Sub-800ms responses: {sub_800_count}/{len(response_times)} ({sub_800_count/len(response_times)*100:.1f}%)")
    
    # Test ANFIS auto-routing
    print(f"\n🧠 Testing ANFIS Auto-Routing:")
    try:
        start = time.time()
        response = requests.post(
            f"{base_url}/api/web3-ai/request",
            json={"service": "ai", "provider": "anfis-auto", "data": {"prompt": "Generate a simple Python function"}},
            timeout=15
        )
        end = time.time()
        
        if response.status_code == 200:
            print(f"✅ ANFIS routing: {(end-start)*1000:.1f}ms")
            data = response.json()
            if data.get('success'):
                print(f"   Response quality: Good")
        else:
            print(f"❌ ANFIS routing failed: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ ANFIS routing error: {str(e)[:50]}")
    
    return working_count >= 5

if __name__ == "__main__":
    success = test_ai_providers()
    print(f"\n🎯 Validation {'PASSED' if success else 'FAILED'}")