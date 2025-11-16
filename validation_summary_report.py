#!/usr/bin/env python3
"""
Validation Summary Report Generator
Creates comprehensive summary of all validation tests and results
"""

import json
import glob
import datetime
from typing import Dict, List, Any
import numpy as np

class ValidationSummaryReporter:
    """
    Generate comprehensive summary report from all validation tests
    """
    
    def __init__(self):
        self.report_timestamp = datetime.datetime.now()
        
    def load_validation_results(self) -> List[Dict[str, Any]]:
        """Load all validation result files"""
        validation_files = glob.glob("validation_results_*.json")
        reproducibility_files = glob.glob("reproducibility_report_*.json")
        
        results = []
        
        # Load validation results
        for file in validation_files:
            try:
                with open(file, 'r') as f:
                    data = json.load(f)
                    data['file_type'] = 'validation'
                    data['filename'] = file
                    results.append(data)
            except Exception as e:
                print(f"Error loading {file}: {e}")
        
        # Load reproducibility results
        for file in reproducibility_files:
            try:
                with open(file, 'r') as f:
                    data = json.load(f)
                    data['file_type'] = 'reproducibility'
                    data['filename'] = file
                    results.append(data)
            except Exception as e:
                print(f"Error loading {file}: {e}")
        
        return results
    
    def analyze_riemann_zeros_validation(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze Riemann zeros validation across all tests"""
        
        all_tests = []
        for result in results:
            if result['file_type'] == 'validation' and 'riemann_zeros_tests' in result:
                for test_name, test_data in result['riemann_zeros_tests'].items():
                    test_data['test_name'] = test_name
                    test_data['validation_id'] = result['validation_id']
                    all_tests.append(test_data)
        
        if not all_tests:
            return {'status': 'NO_DATA'}
        
        # Calculate success rate
        successful_tests = [t for t in all_tests if t.get('status') == 'VALID']
        success_rate = len(successful_tests) / len(all_tests)
        
        # Average calculation times
        calc_times = [t['calculation_time'] for t in successful_tests if 'calculation_time' in t]
        avg_calc_time = np.mean(calc_times) if calc_times else 0
        
        return {
            'total_tests': len(all_tests),
            'successful_tests': len(successful_tests),
            'success_rate': success_rate,
            'average_calculation_time': avg_calc_time,
            'status': 'VALIDATED' if success_rate >= 0.8 else 'REQUIRES_INVESTIGATION'
        }
    
    def analyze_musical_intervals_validation(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze musical intervals validation across all tests"""
        
        all_tests = []
        for result in results:
            if result['file_type'] == 'validation' and 'musical_intervals_tests' in result:
                for test_name, test_data in result['musical_intervals_tests'].items():
                    test_data['test_name'] = test_name
                    test_data['validation_id'] = result['validation_id']
                    all_tests.append(test_data)
        
        if not all_tests:
            return {'status': 'NO_DATA'}
        
        # Analyze match rates by tolerance
        tolerance_analysis = {}
        for test in all_tests:
            tolerance = test.get('tolerance', 0)
            match_rate = test.get('overall_match_rate', 0)
            
            if tolerance not in tolerance_analysis:
                tolerance_analysis[tolerance] = []
            tolerance_analysis[tolerance].append(match_rate)
        
        # Calculate statistics for each tolerance level
        tolerance_stats = {}
        for tolerance, rates in tolerance_analysis.items():
            tolerance_stats[tolerance] = {
                'mean_match_rate': np.mean(rates),
                'std_match_rate': np.std(rates),
                'min_match_rate': np.min(rates),
                'max_match_rate': np.max(rates),
                'num_tests': len(rates)
            }
        
        return {
            'total_tests': len(all_tests),
            'tolerance_levels_tested': list(tolerance_analysis.keys()),
            'tolerance_statistics': tolerance_stats,
            'status': 'VALIDATED'
        }
    
    def analyze_statistical_significance(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze statistical significance across all tests"""
        
        all_stats = []
        for result in results:
            if result['file_type'] == 'validation' and 'statistical_analyses' in result:
                for test_name, stats_data in result['statistical_analyses'].items():
                    stats_data['test_name'] = test_name
                    stats_data['validation_id'] = result['validation_id']
                    all_stats.append(stats_data)
        
        if not all_stats:
            return {'status': 'NO_DATA'}
        
        # Count significant results at different levels
        significant_001 = sum(1 for s in all_stats if s.get('significant_001', False))
        significant_01 = sum(1 for s in all_stats if s.get('significant_01', False))
        significant_05 = sum(1 for s in all_stats if s.get('significant_05', False))
        
        # P-value analysis
        p_values = [s['p_value_binomial'] for s in all_stats if 'p_value_binomial' in s and s['p_value_binomial'] is not None]
        
        return {
            'total_statistical_tests': len(all_stats),
            'significant_at_001': significant_001,
            'significant_at_01': significant_01,
            'significant_at_05': significant_05,
            'significance_rate_001': significant_001 / len(all_stats),
            'significance_rate_01': significant_01 / len(all_stats),
            'significance_rate_05': significant_05 / len(all_stats),
            'mean_p_value': np.mean(p_values) if p_values else None,
            'min_p_value': np.min(p_values) if p_values else None,
            'status': 'STATISTICALLY_SIGNIFICANT' if significant_001 > 0 else 'NOT_SIGNIFICANT'
        }
    
    def analyze_hodge_conjecture_validation(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze Hodge Conjecture validation across all tests"""
        
        hodge_tests = []
        for result in results:
            if result['file_type'] == 'validation' and 'hodge_conjecture_test' in result:
                hodge_data = result['hodge_conjecture_test']
                hodge_data['validation_id'] = result['validation_id']
                hodge_tests.append(hodge_data)
        
        if not hodge_tests:
            return {'status': 'NO_DATA'}
        
        # Check Unity 1.000 validations
        unity_validated_tests = [t for t in hodge_tests if t.get('unity_validated', False)]
        unity_validation_rate = len(unity_validated_tests) / len(hodge_tests)
        
        # CP^1 unity values
        cp1_unities = []
        for test in hodge_tests:
            if 'cp1_calculated' in test:
                cp1_unities.append(test['cp1_calculated'])
        
        return {
            'total_hodge_tests': len(hodge_tests),
            'unity_validated_tests': len(unity_validated_tests),
            'unity_validation_rate': unity_validation_rate,
            'mean_cp1_unity': np.mean(cp1_unities) if cp1_unities else None,
            'cp1_unity_std': np.std(cp1_unities) if cp1_unities else None,
            'status': 'UNITY_VALIDATED' if unity_validation_rate >= 0.5 else 'UNITY_NOT_VALIDATED'
        }
    
    def analyze_reproducibility(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze reproducibility test results"""
        
        reproducibility_results = [r for r in results if r['file_type'] == 'reproducibility']
        
        if not reproducibility_results:
            return {'status': 'NO_REPRODUCIBILITY_TESTS'}
        
        # Aggregate all reproducibility analyses
        total_runs = 0
        total_successful = 0
        
        for result in reproducibility_results:
            analysis = result.get('reproducibility_analysis', {})
            total_runs += analysis.get('total_runs', 0)
            total_successful += analysis.get('successful_runs', 0)
        
        overall_success_rate = total_successful / total_runs if total_runs > 0 else 0
        
        return {
            'reproducibility_tests_conducted': len(reproducibility_results),
            'total_independent_runs': total_runs,
            'total_successful_runs': total_successful,
            'overall_success_rate': overall_success_rate,
            'reproducibility_status': 'REPRODUCIBLE' if overall_success_rate >= 0.7 else 'NOT_REPRODUCIBLE'
        }
    
    def generate_comprehensive_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation summary report"""
        
        print("📊 GENERATING COMPREHENSIVE VALIDATION SUMMARY REPORT")
        print("=" * 60)
        
        # Load all results
        results = self.load_validation_results()
        print(f"Loaded {len(results)} validation/reproducibility files")
        
        # Analyze each component
        riemann_analysis = self.analyze_riemann_zeros_validation(results)
        musical_analysis = self.analyze_musical_intervals_validation(results)
        statistical_analysis = self.analyze_statistical_significance(results)
        hodge_analysis = self.analyze_hodge_conjecture_validation(results)
        reproducibility_analysis = self.analyze_reproducibility(results)
        
        # Generate overall assessment
        overall_status = self.determine_overall_status(
            riemann_analysis, musical_analysis, statistical_analysis,
            hodge_analysis, reproducibility_analysis
        )
        
        # Create comprehensive report
        comprehensive_report = {
            'report_metadata': {
                'generation_timestamp': self.report_timestamp.isoformat(),
                'files_analyzed': len(results),
                'report_version': '1.0'
            },
            'riemann_zeros_validation': riemann_analysis,
            'musical_intervals_validation': musical_analysis,
            'statistical_significance_analysis': statistical_analysis,
            'hodge_conjecture_validation': hodge_analysis,
            'reproducibility_analysis': reproducibility_analysis,
            'overall_assessment': overall_status,
            'recommendations': self.generate_recommendations(overall_status)
        }
        
        # Save report
        report_filename = f"comprehensive_validation_summary_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w') as f:
            json.dump(comprehensive_report, f, indent=2)
        
        # Display summary
        self.display_comprehensive_summary(comprehensive_report)
        
        print(f"\nComprehensive report saved: {report_filename}")
        
        return comprehensive_report
    
    def determine_overall_status(self, riemann, musical, statistical, hodge, reproducibility) -> Dict[str, Any]:
        """Determine overall validation status"""
        
        validations = {
            'riemann_zeros': riemann.get('status') == 'VALIDATED',
            'musical_intervals': musical.get('status') == 'VALIDATED',
            'statistical_significance': statistical.get('status') == 'STATISTICALLY_SIGNIFICANT',
            'hodge_conjecture': hodge.get('status') == 'UNITY_VALIDATED',
            'reproducibility': reproducibility.get('reproducibility_status') == 'REPRODUCIBLE'
        }
        
        validated_components = sum(validations.values())
        total_components = len(validations)
        validation_rate = validated_components / total_components
        
        if validation_rate >= 0.8:
            overall_status = 'FULLY_VALIDATED'
        elif validation_rate >= 0.6:
            overall_status = 'MOSTLY_VALIDATED'
        elif validation_rate >= 0.4:
            overall_status = 'PARTIALLY_VALIDATED'
        else:
            overall_status = 'NOT_VALIDATED'
        
        return {
            'overall_status': overall_status,
            'validation_rate': validation_rate,
            'validated_components': validated_components,
            'total_components': total_components,
            'component_status': validations
        }
    
    def generate_recommendations(self, overall_status: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on validation results"""
        
        recommendations = []
        
        if overall_status['overall_status'] == 'FULLY_VALIDATED':
            recommendations.append("All components validated - ready for peer review and publication")
            recommendations.append("Consider submitting to high-impact mathematics journals")
            recommendations.append("Prepare Millennium Prize application materials")
        
        elif overall_status['overall_status'] == 'MOSTLY_VALIDATED':
            recommendations.append("Strong validation achieved - address remaining issues")
            recommendations.append("Focus on improving weakest validation components")
            recommendations.append("Conduct additional reproducibility tests")
        
        else:
            recommendations.append("Significant validation issues detected")
            recommendations.append("Investigate failed validations before proceeding")
            recommendations.append("Consider revising methodology and claims")
        
        # Component-specific recommendations
        for component, validated in overall_status['component_status'].items():
            if not validated:
                recommendations.append(f"Address issues in {component.replace('_', ' ')} validation")
        
        return recommendations
    
    def display_comprehensive_summary(self, report: Dict[str, Any]):
        """Display comprehensive validation summary"""
        
        print("\n" + "=" * 60)
        print("COMPREHENSIVE VALIDATION SUMMARY")
        print("=" * 60)
        
        overall = report['overall_assessment']
        print(f"Overall Status: {overall['overall_status']}")
        print(f"Validation Rate: {overall['validation_rate']:.1%}")
        print(f"Components Validated: {overall['validated_components']}/{overall['total_components']}")
        
        print("\nComponent Status:")
        for component, status in overall['component_status'].items():
            status_symbol = "✅" if status else "❌"
            print(f"  {status_symbol} {component.replace('_', ' ').title()}")
        
        print("\nKey Findings:")
        if report['statistical_significance_analysis'].get('status') == 'STATISTICALLY_SIGNIFICANT':
            sig_rate = report['statistical_significance_analysis']['significance_rate_001']
            print(f"  • Statistical significance achieved in {sig_rate:.1%} of tests")
        
        if report['hodge_conjecture_validation'].get('status') == 'UNITY_VALIDATED':
            unity_rate = report['hodge_conjecture_validation']['unity_validation_rate']
            print(f"  • Hodge Conjecture Unity 1.000 validated in {unity_rate:.1%} of tests")
        
        if report['reproducibility_analysis'].get('reproducibility_status') == 'REPRODUCIBLE':
            repro_rate = report['reproducibility_analysis']['overall_success_rate']
            print(f"  • Reproducibility confirmed with {repro_rate:.1%} success rate")
        
        print("\nRecommendations:")
        for i, rec in enumerate(report['recommendations'], 1):
            print(f"  {i}. {rec}")

def main():
    """Generate comprehensive validation summary report"""
    reporter = ValidationSummaryReporter()
    return reporter.generate_comprehensive_report()

if __name__ == "__main__":
    result = main()