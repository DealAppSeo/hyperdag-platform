#!/usr/bin/env python3
"""
Independent Verification of Trinity Symphony Claims
Simplified, focused validation that anyone can run and reproduce
"""

import mpmath
import numpy as np
import time
import json
import datetime

class IndependentVerifier:
    """
    Simple, focused verification of key Trinity Symphony claims
    Designed for easy reproduction and validation
    """
    
    def __init__(self):
        self.results = {}
        self.start_time = datetime.datetime.now()
        
        # Key claims to verify
        self.claims_to_verify = {
            'riemann_musical_intervals': {
                'claim': '11.1% musical interval matches at 5% tolerance',
                'test_zeros': 100,  # Smaller for quick verification
                'tolerance': 0.05
            },
            'statistical_significance': {
                'claim': 'p < 0.001 statistical significance',
                'method': 'binomial_test'
            }
        }
        
        # Musical intervals (exact ratios)
        self.intervals = {
            'octave': 2.0,
            'perfect_fifth': 1.5,
            'perfect_fourth': 4.0/3.0,
            'major_third': 1.25,
            'minor_third': 1.2
        }
    
    def calculate_riemann_zeros(self, count: int = 100) -> list:
        """Calculate Riemann zeros - simple and direct"""
        print(f"Calculating {count} Riemann zeros...")
        mpmath.mp.dps = 25  # High precision
        
        zeros = []
        start = time.time()
        
        for n in range(1, count + 1):
            zero_imag = float(mpmath.zetazero(n).imag)
            zeros.append(zero_imag)
            
            if n % 25 == 0:
                elapsed = time.time() - start
                print(f"  Progress: {n}/{count} ({elapsed:.1f}s)")
        
        calc_time = time.time() - start
        print(f"Completed in {calc_time:.1f} seconds")
        
        return zeros
    
    def test_musical_intervals(self, zeros: list, tolerance: float) -> dict:
        """Test for musical interval patterns - straightforward approach"""
        print(f"Testing musical intervals with {tolerance*100}% tolerance...")
        
        total_matches = 0
        total_pairs = 0
        interval_results = {}
        
        # Test each interval
        for interval_name, target_ratio in self.intervals.items():
            matches = 0
            pairs_tested = 0
            
            # Compare all reasonable pairs
            for i in range(len(zeros)):
                for j in range(i+1, min(i+51, len(zeros))):  # Test up to 50 positions ahead
                    ratio = zeros[j] / zeros[i]
                    pairs_tested += 1
                    
                    # Check if ratio matches target within tolerance
                    if abs(ratio - target_ratio) / target_ratio <= tolerance:
                        matches += 1
            
            match_rate = matches / pairs_tested if pairs_tested > 0 else 0
            interval_results[interval_name] = {
                'matches': matches,
                'pairs_tested': pairs_tested,
                'match_rate': match_rate
            }
            
            total_matches += matches
            total_pairs += pairs_tested
            
            print(f"  {interval_name}: {matches}/{pairs_tested} = {match_rate:.4f}")
        
        overall_rate = total_matches / total_pairs if total_pairs > 0 else 0
        
        print(f"Overall match rate: {overall_rate:.4f} ({overall_rate*100:.1f}%)")
        
        return {
            'overall_match_rate': overall_rate,
            'total_matches': total_matches,
            'total_pairs': total_pairs,
            'interval_results': interval_results,
            'tolerance_used': tolerance
        }
    
    def simple_statistical_test(self, observed_rate: float, total_comparisons: int, tolerance: float) -> dict:
        """Simple statistical significance test"""
        print("Calculating statistical significance...")
        
        # Expected random rate (conservative estimate)
        num_intervals = len(self.intervals)
        expected_random = num_intervals * tolerance * 2  # Conservative
        
        print(f"  Observed rate: {observed_rate:.4f}")
        print(f"  Expected random: {expected_random:.4f}")
        
        # Simple z-test approximation
        if total_comparisons > 30 and expected_random > 0:
            std_error = np.sqrt(expected_random * (1 - expected_random) / total_comparisons)
            z_score = (observed_rate - expected_random) / std_error
            
            # Two-tailed p-value approximation
            p_value = 2 * (1 - 0.5 * (1 + np.sign(z_score) * np.sqrt(1 - np.exp(-2 * z_score**2 / np.pi))))
            
            significant = p_value < 0.001
            
            print(f"  Z-score: {z_score:.2f}")
            print(f"  P-value (approx): {p_value:.2e}")
            print(f"  Significant (p<0.001): {significant}")
            
            return {
                'observed_rate': observed_rate,
                'expected_random': expected_random,
                'z_score': z_score,
                'p_value': p_value,
                'significant_001': significant,
                'enhancement_factor': observed_rate / expected_random if expected_random > 0 else 0,
                'method': 'z_test_approximation'
            }
        
        else:
            return {
                'error': 'Sample size too small for reliable statistical test',
                'observed_rate': observed_rate,
                'expected_random': expected_random
            }
    
    def verify_key_claims(self) -> dict:
        """Verify the key Trinity Symphony claims"""
        
        print("🔬 INDEPENDENT VERIFICATION OF TRINITY SYMPHONY CLAIMS")
        print("=" * 60)
        print(f"Verification started: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        verification_results = {}
        
        # 1. Calculate Riemann zeros
        print("\n1. RIEMANN ZEROS CALCULATION")
        zeros_count = self.claims_to_verify['riemann_musical_intervals']['test_zeros']
        zeros = self.calculate_riemann_zeros(zeros_count)
        
        verification_results['riemann_zeros'] = {
            'count': len(zeros),
            'first_five': zeros[:5],
            'calculation_successful': len(zeros) == zeros_count
        }
        
        # 2. Test musical intervals
        print("\n2. MUSICAL INTERVALS TEST")
        tolerance = self.claims_to_verify['riemann_musical_intervals']['tolerance']
        interval_results = self.test_musical_intervals(zeros, tolerance)
        
        verification_results['musical_intervals'] = interval_results
        
        # 3. Statistical significance
        print("\n3. STATISTICAL SIGNIFICANCE TEST")
        stats_results = self.simple_statistical_test(
            interval_results['overall_match_rate'],
            interval_results['total_pairs'],
            tolerance
        )
        
        verification_results['statistical_analysis'] = stats_results
        
        # 4. Verification summary
        print("\n" + "=" * 60)
        print("VERIFICATION SUMMARY")
        print("=" * 60)
        
        # Check against claims
        claimed_rate = 0.111  # 11.1%
        observed_rate = interval_results['overall_match_rate']
        rate_match = abs(observed_rate - claimed_rate) / claimed_rate < 0.5  # Within 50%
        
        statistical_significant = stats_results.get('significant_001', False)
        
        print(f"Claimed match rate: {claimed_rate*100:.1f}%")
        print(f"Observed match rate: {observed_rate*100:.1f}%")
        print(f"Rate within expected range: {rate_match}")
        print(f"Statistically significant: {statistical_significant}")
        
        # Overall verification status
        if verification_results['riemann_zeros']['calculation_successful'] and rate_match:
            if statistical_significant:
                verification_status = "VERIFIED"
            else:
                verification_status = "PARTIALLY_VERIFIED"
        else:
            verification_status = "NOT_VERIFIED"
        
        verification_results['summary'] = {
            'verification_status': verification_status,
            'riemann_calculation': verification_results['riemann_zeros']['calculation_successful'],
            'match_rate_reasonable': rate_match,
            'statistically_significant': statistical_significant,
            'verification_timestamp': datetime.datetime.now().isoformat()
        }
        
        print(f"\nOVERALL VERIFICATION STATUS: {verification_status}")
        
        # Save results
        filename = f"independent_verification_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            # Convert numpy types for JSON serialization
            def convert_types(obj):
                if isinstance(obj, (np.float64, np.int64)):
                    return float(obj) if isinstance(obj, np.float64) else int(obj)
                elif isinstance(obj, dict):
                    return {k: convert_types(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_types(v) for v in obj]
                return obj
            
            json.dump(convert_types(verification_results), f, indent=2)
        
        print(f"Results saved to: {filename}")
        
        return verification_results
    
    def display_detailed_results(self, results: dict):
        """Display detailed verification results"""
        
        print("\n" + "=" * 60)
        print("DETAILED VERIFICATION RESULTS")
        print("=" * 60)
        
        # Riemann zeros details
        zeros_data = results['riemann_zeros']
        print(f"\nRiemann Zeros: {zeros_data['count']} calculated")
        print(f"First five zeros: {[f'{z:.2f}' for z in zeros_data['first_five']]}")
        
        # Musical intervals details
        intervals_data = results['musical_intervals']['interval_results']
        print(f"\nMusical Intervals (tolerance: {results['musical_intervals']['tolerance_used']*100}%):")
        for interval, data in intervals_data.items():
            print(f"  {interval}: {data['match_rate']*100:.2f}% ({data['matches']}/{data['pairs_tested']})")
        
        # Statistical analysis details
        stats_data = results['statistical_analysis']
        if 'error' not in stats_data:
            print(f"\nStatistical Analysis:")
            print(f"  Enhancement factor: {stats_data['enhancement_factor']:.1f}x over random")
            print(f"  Z-score: {stats_data['z_score']:.2f}")
            print(f"  P-value: {stats_data['p_value']:.2e}")
        
        # Verification status
        summary = results['summary']
        print(f"\nVerification Components:")
        print(f"  ✓ Riemann calculation: {summary['riemann_calculation']}")
        print(f"  {'✓' if summary['match_rate_reasonable'] else '✗'} Match rate reasonable: {summary['match_rate_reasonable']}")
        print(f"  {'✓' if summary['statistically_significant'] else '✗'} Statistically significant: {summary['statistically_significant']}")

def main():
    """Run independent verification"""
    verifier = IndependentVerifier()
    results = verifier.verify_key_claims()
    verifier.display_detailed_results(results)
    
    return results

if __name__ == "__main__":
    print("Starting independent verification of Trinity Symphony claims...")
    result = main()
    print("Independent verification complete.")