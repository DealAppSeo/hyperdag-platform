#!/usr/bin/env python3
"""
Reproducibility Test Suite - Independent Verification
Multiple independent runs to test reproducibility of Trinity Symphony claims
"""

import subprocess
import json
import datetime
import hashlib
from typing import List, Dict, Any

class ReproducibilityTester:
    """
    Run multiple independent tests to verify reproducibility
    """
    
    def __init__(self, num_runs: int = 3):
        self.num_runs = num_runs
        self.test_results = []
        self.session_id = hashlib.md5(datetime.datetime.now().isoformat().encode()).hexdigest()[:8]
        
    def run_independent_test(self, run_number: int) -> Dict[str, Any]:
        """Run independent validation test"""
        print(f"Running independent test {run_number}/{self.num_runs}...")
        
        try:
            # Run the comprehensive validation in a separate process
            result = subprocess.run([
                'python3', 'comprehensive_validation_framework.py'
            ], capture_output=True, text=True, timeout=300)  # 5 minute timeout
            
            return {
                'run_number': run_number,
                'return_code': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'status': 'SUCCESS' if result.returncode == 0 else 'FAILED',
                'timestamp': datetime.datetime.now().isoformat()
            }
            
        except subprocess.TimeoutExpired:
            return {
                'run_number': run_number,
                'status': 'TIMEOUT',
                'error': 'Test exceeded 5 minute timeout',
                'timestamp': datetime.datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'run_number': run_number,
                'status': 'ERROR',
                'error': str(e),
                'timestamp': datetime.datetime.now().isoformat()
            }
    
    def analyze_reproducibility(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze reproducibility across multiple runs"""
        
        successful_runs = [r for r in results if r['status'] == 'SUCCESS']
        failed_runs = [r for r in results if r['status'] != 'SUCCESS']
        
        analysis = {
            'total_runs': len(results),
            'successful_runs': len(successful_runs),
            'failed_runs': len(failed_runs),
            'success_rate': len(successful_runs) / len(results) if results else 0,
            'reproducibility_status': 'REPRODUCIBLE' if len(successful_runs) >= 2 else 'NOT_REPRODUCIBLE',
            'failure_analysis': {}
        }
        
        # Analyze failure patterns
        if failed_runs:
            failure_types = {}
            for run in failed_runs:
                failure_type = run['status']
                if failure_type not in failure_types:
                    failure_types[failure_type] = 0
                failure_types[failure_type] += 1
            
            analysis['failure_analysis'] = failure_types
        
        return analysis
    
    def run_reproducibility_suite(self) -> Dict[str, Any]:
        """Run complete reproducibility test suite"""
        
        print("🔬 REPRODUCIBILITY TEST SUITE")
        print("=" * 50)
        print(f"Session ID: {self.session_id}")
        print(f"Running {self.num_runs} independent validation tests")
        print("=" * 50)
        
        # Run independent tests
        for i in range(1, self.num_runs + 1):
            result = self.run_independent_test(i)
            self.test_results.append(result)
            
            print(f"Test {i}: {result['status']}")
            if result['status'] != 'SUCCESS':
                print(f"  Error: {result.get('error', 'Unknown error')}")
        
        # Analyze reproducibility
        analysis = self.analyze_reproducibility(self.test_results)
        
        # Generate final report
        report = {
            'session_id': self.session_id,
            'test_timestamp': datetime.datetime.now().isoformat(),
            'test_configuration': {
                'num_runs': self.num_runs,
                'timeout_seconds': 300
            },
            'individual_results': self.test_results,
            'reproducibility_analysis': analysis,
            'conclusions': self.generate_conclusions(analysis)
        }
        
        # Save report
        filename = f"reproducibility_report_{self.session_id}.json"
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Display summary
        self.display_summary(analysis)
        
        print(f"\nDetailed report saved: {filename}")
        
        return report
    
    def generate_conclusions(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate conclusions from reproducibility analysis"""
        conclusions = []
        
        if analysis['success_rate'] >= 0.8:
            conclusions.append("HIGH REPRODUCIBILITY: ≥80% of tests successful")
        elif analysis['success_rate'] >= 0.5:
            conclusions.append("MODERATE REPRODUCIBILITY: 50-80% success rate")
        else:
            conclusions.append("LOW REPRODUCIBILITY: <50% success rate")
        
        if analysis['successful_runs'] >= 2:
            conclusions.append("Multiple independent validations achieved")
        else:
            conclusions.append("Insufficient independent validations")
        
        if analysis['failed_runs'] > 0:
            conclusions.append(f"Investigation needed for {analysis['failed_runs']} failed tests")
        
        return conclusions
    
    def display_summary(self, analysis: Dict[str, Any]):
        """Display reproducibility summary"""
        print("\n" + "=" * 50)
        print("REPRODUCIBILITY ANALYSIS SUMMARY")
        print("=" * 50)
        
        print(f"Total Tests: {analysis['total_runs']}")
        print(f"Successful: {analysis['successful_runs']}")
        print(f"Failed: {analysis['failed_runs']}")
        print(f"Success Rate: {analysis['success_rate']:.1%}")
        print(f"Reproducibility: {analysis['reproducibility_status']}")
        
        if analysis['failure_analysis']:
            print("\nFailure Breakdown:")
            for failure_type, count in analysis['failure_analysis'].items():
                print(f"  {failure_type}: {count}")

def main():
    """Run reproducibility test suite"""
    tester = ReproducibilityTester(num_runs=3)  # Run 3 independent tests
    return tester.run_reproducibility_suite()

if __name__ == "__main__":
    result = main()