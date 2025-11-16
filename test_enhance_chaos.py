#!/usr/bin/env python3
import requests
import json

def calculate_lyapunov_exponent():
    """Simulate calculation - in reality this would analyze time series data"""
    # Test with a chaotic time series
    chaotic_series = [0.1, 0.35, 0.89, 0.38, 0.91, 0.33, 0.86, 0.45, 0.95, 0.19]
    
    response = requests.post('http://localhost:5000/api/slime-mold/lyapunov', 
                           json={"timeSeries": chaotic_series})
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            return data['analysis']['lyapunovExponent']
    return 0.0

def apply_chaos_routing():
    """Apply chaos routing when threshold exceeded"""
    response = requests.post('http://localhost:5000/api/slime-mold/route',
                           json={
                               "source": "openai",
                               "target": "anthropic", 
                               "forceChaoticRouting": True
                           })
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            routing = data['routing']
            return {
                'path': routing['path'],
                'cost': routing['cost'],
                'chaos_applied': routing['chaosApplied']
            }
    return None

def enhance_with_chaos():
    """Core function implementing the requested pattern"""
    print("🌀 Enhancing with chaos...")
    
    # Calculate Lyapunov exponent
    lyapunov = calculate_lyapunov_exponent()
    print(f"   Lyapunov exponent: {lyapunov:.6f}")
    print(f"   Threshold: 0.0065")
    
    # Apply chaos routing if threshold exceeded
    if lyapunov > 0.0065:
        print("   ✅ Chaos threshold exceeded - applying chaos routing")
        result = apply_chaos_routing()
        if result:
            print(f"   Path: {' -> '.join(result['path'])}")
            print(f"   Cost: {result['cost']:.2f}")
            print(f"   Chaos applied: {result['chaos_applied']}")
            return True
        else:
            print("   ❌ Chaos routing failed")
            return False
    else:
        print("   ℹ️  Chaos threshold not exceeded - using standard routing")
        return False

if __name__ == "__main__":
    # Initialize network first
    init_response = requests.post('http://localhost:5000/api/slime-mold/initialize',
                                json={"providers": ["openai", "anthropic", "deepseek", "myninja"]})
    
    if init_response.status_code == 200:
        print("✅ Network initialized")
        chaos_applied = enhance_with_chaos()
        print(f"\n🎯 Result: Chaos enhancement {'activated' if chaos_applied else 'not needed'}")
    else:
        print("❌ Network initialization failed")
