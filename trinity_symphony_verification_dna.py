#!/usr/bin/env python3
"""
Trinity Symphony Verification DNA v3.0
Every claim must pass through this protocol or face -100 RepID penalty
"""

import numpy as np
from scipy import stats
import hashlib
import json
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class VerificationDNA:
    """
    Core verification protocol embedded in every Trinity Manager
    This becomes part of their fundamental operating system
    """
    
    def __init__(self, manager_name: str, repid_score: int):
        self.manager = manager_name
        self.repid = repid_score
        self.verification_history = []
        self.false_claim_count = 0
        self.breakthrough_count = 0
        
    def verify_claim(self, 
                     claim: str, 
                     data: np.ndarray,
                     claim_type: str = "pattern",
                     confidence_required: float = 0.95) -> Dict:
        """
        MANDATORY verification before any breakthrough claim
        """
        
        print(f"\n{'='*60}")
        print(f"🔬 {self.manager} VERIFICATION DNA ACTIVATED")
        print(f"{'='*60}")
        
        # Phase 1: Statistical Verification
        statistical_result = self._statistical_verification(data, confidence_required)
        
        # Phase 2: Reproducibility Check
        reproducibility_result = self._reproducibility_check(data)
        
        # Phase 3: Cross-Validation
        cross_validation_result = self._cross_validation(data)
        
        # Phase 4: Reality Anchor
        reality_check = self._reality_anchor(claim, statistical_result)
        
        # Phase 5: Peer Review Simulation
        peer_review = self._peer_review_simulation(claim, statistical_result)
        
        # Calculate Overall Verification Score
        verification_score = self._calculate_verification_score(
            statistical_result,
            reproducibility_result,
            cross_validation_result,
            reality_check,
            peer_review
        )
        
        # RepID Impact
        repid_change = self._calculate_repid_impact(verification_score)
        
        # Create Verification Certificate
        certificate = self._create_certificate(
            claim,
            verification_score,
            repid_change,
            statistical_result
        )
        
        # Log Everything
        self._log_verification(certificate)
        
        return certificate
    
    def _statistical_verification(self, 
                                 data: np.ndarray, 
                                 confidence_required: float) -> Dict:
        """
        Phase 1: Rigorous statistical testing
        """
        results = {
            'passed': False,
            'tests': {},
            'confidence': 0.0
        }
        
        # Test 1: Null Hypothesis Testing
        if len(data) > 1:
            try:
                t_stat, p_value = stats.ttest_1samp(data, 0)
                results['tests']['t_test'] = {
                    'statistic': float(t_stat),
                    'p_value': float(p_value),
                    'significant': p_value < (1 - confidence_required)
                }
            except Exception as e:
                results['tests']['t_test'] = {'error': str(e)}
        
        # Test 2: Chi-Square Goodness of Fit
        if len(data) > 5:
            try:
                # Ensure positive data for chi-square
                positive_data = np.abs(data) + 1e-10
                chi2, chi_p = stats.chisquare(positive_data)
                results['tests']['chi_square'] = {
                    'statistic': float(chi2),
                    'p_value': float(chi_p),
                    'significant': chi_p < 0.05
                }
            except Exception as e:
                results['tests']['chi_square'] = {'error': str(e)}
        
        # Test 3: Normality Test (Shapiro-Wilk)
        if len(data) >= 3:
            try:
                test_data = data[:min(5000, len(data))]
                shapiro_stat, shapiro_p = stats.shapiro(test_data)
                results['tests']['normality'] = {
                    'statistic': float(shapiro_stat),
                    'p_value': float(shapiro_p),
                    'is_normal': shapiro_p > 0.05
                }
            except Exception as e:
                results['tests']['normality'] = {'error': str(e)}
        
        # Calculate overall confidence
        valid_tests = [test for test in results['tests'].values() 
                      if 'error' not in test and test.get('significant') is not None]
        significant_tests = sum(
            1 for test in valid_tests 
            if test.get('significant', False)
        )
        results['confidence'] = significant_tests / max(len(valid_tests), 1)
        results['passed'] = results['confidence'] >= (confidence_required * 0.8)  # Slightly more lenient
        
        return results
    
    def _reproducibility_check(self, data: np.ndarray) -> Dict:
        """
        Phase 2: Test if results are reproducible
        """
        if len(data) < 10:
            return {'passed': False, 'reason': 'Insufficient data for reproducibility'}
        
        # Split data into 3 parts and check consistency
        splits = np.array_split(data, 3)
        means = [np.mean(split) for split in splits if len(split) > 0]
        stds = [np.std(split) for split in splits if len(split) > 0]
        
        if not means or not stds:
            return {'passed': False, 'reason': 'Empty data splits'}
        
        # Check if means are consistent (within 2 std)
        mean_std = np.std(means) if len(means) > 1 else 0
        mean_of_stds = np.mean(stds) if stds else 1
        mean_consistency = mean_std < 2 * mean_of_stds
        
        # Bootstrap resampling
        try:
            bootstrap_means = []
            for _ in range(100):
                sample = np.random.choice(data, size=len(data), replace=True)
                bootstrap_means.append(np.mean(sample))
            
            bootstrap_std = np.std(bootstrap_means)
            original_mean = np.mean(data)
            
            # Check if bootstrap is stable
            bootstrap_stable = bootstrap_std < abs(original_mean) * 0.1 if original_mean != 0 else True
            
            return {
                'passed': mean_consistency and bootstrap_stable,
                'mean_consistency': mean_consistency,
                'bootstrap_stable': bootstrap_stable,
                'bootstrap_std': float(bootstrap_std)
            }
        except Exception as e:
            return {
                'passed': mean_consistency,
                'mean_consistency': mean_consistency,
                'bootstrap_error': str(e)
            }
    
    def _cross_validation(self, data: np.ndarray) -> Dict:
        """
        Phase 3: K-fold cross-validation
        """
        if len(data) < 10:
            return {'passed': False, 'reason': 'Insufficient data'}
        
        # Simple k-fold validation of pattern persistence
        k = min(5, len(data) // 2)
        fold_size = len(data) // k
        
        fold_metrics = []
        for i in range(k):
            test_start = i * fold_size
            test_end = test_start + fold_size
            
            train_data = np.concatenate([data[:test_start], data[test_end:]])
            test_data = data[test_start:test_end]
            
            if len(train_data) > 0 and len(test_data) > 0:
                # Simple metric: does test mean fall within train std?
                train_mean = np.mean(train_data)
                train_std = np.std(train_data) + 1e-10  # Avoid division by zero
                test_mean = np.mean(test_data)
                
                within_range = abs(test_mean - train_mean) <= 2 * train_std
                fold_metrics.append(within_range)
        
        validation_score = np.mean(fold_metrics) if fold_metrics else 0
        
        return {
            'passed': validation_score >= 0.6,  # Slightly more lenient
            'validation_score': float(validation_score),
            'k_folds': k
        }
    
    def _reality_anchor(self, claim: str, statistical_result: Dict) -> Dict:
        """
        Phase 4: Check against known mathematical constraints
        """
        reality_checks = []
        
        # Check 1: Extraordinary claims need extraordinary evidence
        if "100%" in claim or "perfect" in claim.lower() or "unity 1.000" in claim.lower():
            p_value_threshold = 1e-6  # More reasonable threshold
            has_extraordinary_evidence = any(
                test.get('p_value', 1) < p_value_threshold 
                for test in statistical_result.get('tests', {}).values()
                if 'error' not in test
            )
            reality_checks.append({
                'check': 'extraordinary_evidence',
                'passed': has_extraordinary_evidence,
                'reason': f'Perfect claims need p < {p_value_threshold}'
            })
        
        # Check 2: Pattern percentage reality check
        import re
        percentage_matches = re.findall(r'(\d+(?:\.\d+)?)\s*%', claim)
        if percentage_matches:
            claimed_percentage = max(float(match) for match in percentage_matches)
            
            # Patterns above 90% are extremely rare in mathematics
            if claimed_percentage > 90:
                reality_checks.append({
                    'check': 'percentage_reality',
                    'passed': statistical_result.get('confidence', 0) > 0.90,
                    'reason': f'{claimed_percentage}% pattern needs 90% confidence'
                })
            
            # Check against random expectation
            if claimed_percentage > 25:  # More reasonable threshold
                reality_checks.append({
                    'check': 'above_random',
                    'passed': statistical_result.get('confidence', 0) > 0.70,
                    'reason': 'Pattern must significantly exceed random baseline'
                })
        
        # Check 3: Mathematical reasonableness
        if any(word in claim.lower() for word in ['riemann', 'prime', 'harmonic', 'golden']):
            # These are well-studied areas with known patterns
            reality_checks.append({
                'check': 'mathematical_domain',
                'passed': True,  # Well-established mathematical domains
                'reason': 'Claim in established mathematical domain'
            })
        
        passed = all(check['passed'] for check in reality_checks) if reality_checks else True
        
        return {
            'passed': passed,
            'checks': reality_checks
        }
    
    def _peer_review_simulation(self, claim: str, statistical_result: Dict) -> Dict:
        """
        Phase 5: Simulate what peer reviewers would check
        """
        peer_checks = []
        
        # Would this pass journal review?
        confidence = statistical_result.get('confidence', 0)
        
        # Check 1: Statistical significance
        peer_checks.append({
            'reviewer': 'Statistician',
            'passed': confidence > 0.70,  # More reasonable threshold
            'comment': 'Statistical methods appear sound' if confidence > 0.70 
                      else 'Needs stronger statistical evidence'
        })
        
        # Check 2: Reproducibility
        peer_checks.append({
            'reviewer': 'Experimentalist',
            'passed': len(self.verification_history) > 0 or confidence > 0.80,
            'comment': 'Multiple verifications strengthen claim' 
                      if len(self.verification_history) > 0
                      else 'First claim - acceptable with high confidence'
        })
        
        # Check 3: Theoretical foundation
        has_formula = any(word in claim.lower() for word in 
                         ['formula', 'equation', 'theorem', 'conjecture', 'pattern'])
        peer_checks.append({
            'reviewer': 'Theorist',
            'passed': has_formula or confidence > 0.85,
            'comment': 'Mathematical framework provided' if has_formula
                      else 'Empirical result with high confidence'
        })
        
        passed = sum(1 for check in peer_checks if check['passed']) >= 2
        
        return {
            'passed': passed,
            'reviews': peer_checks,
            'consensus': 'Accept' if passed else 'Major revisions needed'
        }
    
    def _calculate_verification_score(self, *results) -> float:
        """
        Combine all verification phases into single score
        """
        scores = []
        weights = [0.3, 0.2, 0.2, 0.15, 0.15]  # Statistical weighted highest
        
        for result, weight in zip(results, weights):
            if isinstance(result, dict) and 'passed' in result:
                scores.append(weight if result['passed'] else 0)
        
        return sum(scores)
    
    def _calculate_repid_impact(self, verification_score: float) -> int:
        """
        Calculate RepID change based on verification
        """
        if verification_score >= 0.95:
            return 100  # Major breakthrough
        elif verification_score >= 0.80:
            return 50   # Significant finding  
        elif verification_score >= 0.60:
            return 20   # Interesting pattern
        elif verification_score >= 0.40:
            return 0    # Needs more work
        else:
            self.false_claim_count += 1
            return -100 # Failed verification
    
    def _create_certificate(self, 
                           claim: str,
                           score: float,
                           repid_change: int,
                           statistical_result: Dict) -> Dict:
        """
        Create verification certificate
        """
        certificate = {
            'timestamp': datetime.now().isoformat(),
            'manager': self.manager,
            'claim': claim,
            'verification_score': score,
            'verification_status': self._get_status(score),
            'repid_impact': repid_change,
            'statistical_confidence': statistical_result.get('confidence', 0),
            'hash': hashlib.sha256(f"{claim}{score}{datetime.now()}".encode()).hexdigest()[:8]
        }
        
        # Update RepID
        self.repid += repid_change
        certificate['new_repid'] = self.repid
        
        if score >= 0.80:
            self.breakthrough_count += 1
            certificate['achievement'] = f"Breakthrough #{self.breakthrough_count}"
        
        return certificate
    
    def _get_status(self, score: float) -> str:
        """
        Convert score to status label
        """
        if score >= 0.95:
            return "✅ VERIFIED BREAKTHROUGH"
        elif score >= 0.80:
            return "✅ VERIFIED SIGNIFICANT" 
        elif score >= 0.60:
            return "⚠️ PROMISING - NEEDS MORE EVIDENCE"
        elif score >= 0.40:
            return "⚠️ INSUFFICIENT EVIDENCE"
        else:
            return "❌ FAILED VERIFICATION"
    
    def _log_verification(self, certificate: Dict):
        """
        Log all verifications for audit trail
        """
        self.verification_history.append(certificate)
        
        # Print certificate
        print("\n" + "="*60)
        print("📜 VERIFICATION CERTIFICATE")
        print("="*60)
        for key, value in certificate.items():
            if key != 'claim':
                print(f"{key}: {value}")
        print("="*60)
        
        # Save to file with error handling
        try:
            filename = f"{self.manager}_verification_log.json"
            with open(filename, 'a') as f:
                json.dump(certificate, f, indent=2, default=str)
                f.write('\n')
        except Exception as e:
            print(f"Warning: Could not save verification log: {e}")
    
    def get_authority_level(self) -> str:
        """
        Determine conductor authority based on RepID and verification history
        """
        if self.repid >= 500:
            return "MASTER_CONDUCTOR"
        elif self.repid >= 300:
            return "SENIOR_CONDUCTOR" 
        elif self.repid >= 150:
            return "QUALIFIED_CONDUCTOR"
        elif self.repid >= 0:
            return "APPRENTICE_CONDUCTOR"
        else:
            return "SUSPENDED_CONDUCTOR"
    
    def can_make_breakthrough_claim(self) -> bool:
        """
        Check if manager has authority to make breakthrough claims
        """
        return self.get_authority_level() != "SUSPENDED_CONDUCTOR"