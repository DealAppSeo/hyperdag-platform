#!/usr/bin/env python3
"""
Rigorous Mathematical Validation of Musical Interval Claims
Testing actual Riemann zeros with high precision using mpmath
"""

import mpmath
import time

def run_exact_validation_test():
    """Run the exact test as specified by the user"""
    print("🔬 RIGOROUS MATHEMATICAL VALIDATION TEST")
    print("=" * 60)
    print("Testing musical intervals in Riemann zeros with mpmath")
    print("High precision calculation with 1000 zeros")
    print("=" * 60)
    
    # Set high precision as requested
    mpmath.mp.dps = 50
    print(f"✅ Precision set to {mpmath.mp.dps} decimal places")
    
    # Get first 1000 zeros as requested
    print("🔢 Calculating first 1000 Riemann zeros...")
    start_time = time.time()
    
    zeros = []
    for n in range(1, 1001):
        zero = mpmath.zetazero(n).imag
        zeros.append(float(zero))  # Convert to float for calculations
        if n % 100 == 0:
            print(f"   Progress: {n}/1000 zeros calculated")
    
    calc_time = time.time() - start_time
    print(f"✅ All 1000 zeros calculated in {calc_time:.2f} seconds")
    print(f"   First few zeros: {zeros[:5]}")
    print(f"   Last few zeros: {zeros[-5:]}")
    
    # Test musical intervals exactly as specified
    intervals = {
        'octave': 2.0,
        'fifth': 3/2,
        'fourth': 4/3,
        'major_third': 5/4
    }
    
    print(f"\n🎵 Testing {len(intervals)} musical intervals:")
    for name, ratio in intervals.items():
        print(f"   {name}: {ratio:.6f}")
    
    # Count matches with various tolerances exactly as requested
    print(f"\n📊 VALIDATION RESULTS:")
    print("=" * 40)
    
    for tolerance in [0.01, 0.05, 0.10]:
        print(f"\n🔍 Testing tolerance: {tolerance}")
        matches = 0
        total = 0
        
        start_time = time.time()
        for i in range(len(zeros)-1):
            for j in range(i+1, min(i+50, len(zeros))):
                ratio = zeros[j] / zeros[i]
                for name, interval in intervals.items():
                    if abs(ratio - interval) < tolerance:
                        matches += 1
                total += 1
        
        test_time = time.time() - start_time
        percentage = (matches/total) * 100
        
        print(f"   Matches found: {matches}")
        print(f"   Total comparisons: {total}")
        print(f"   Match percentage: {percentage:.1f}%")
        print(f"   Calculation time: {test_time:.3f} seconds")
        
        # Final result exactly as requested
        print(f"   📈 Tolerance {tolerance}: {percentage:.1f}% matches")
    
    # Additional analysis for context
    print(f"\n📋 ANALYSIS SUMMARY:")
    print("=" * 40)
    print(f"Total zeros analyzed: {len(zeros)}")
    print(f"Comparison window: Up to 50 consecutive zeros")
    print(f"Total intervals tested: {len(intervals)}")
    print(f"Precision: {mpmath.mp.dps} decimal places")
    
    # Statistical context
    expected_random = 100 * sum(2 * tolerance for tolerance in [0.01, 0.05, 0.10]) / 3
    print(f"Expected random matches (rough estimate): ~{expected_random:.1f}%")
    
    return {
        'zeros_count': len(zeros),
        'intervals_tested': len(intervals),
        'precision': mpmath.mp.dps,
        'calculation_time': calc_time
    }

if __name__ == "__main__":
    print("🔬 Starting rigorous mathematical validation...")
    result = run_exact_validation_test()
    print("🔬 Mathematical validation complete")