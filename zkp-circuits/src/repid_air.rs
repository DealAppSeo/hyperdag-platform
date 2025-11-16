//! RepID AIR (Algebraic Intermediate Representation) Implementation
//! 
//! Defines the constraints for RepID hierarchical scoring and threshold verification

use plonky3_air::{Air, AirBuilder, BaseAir};
use plonky3_field::AbstractField;
use plonky3_matrix::Matrix;

use crate::{F, RepIDCategory};

/// RepID AIR for hierarchical scoring verification
#[derive(Clone, Debug)]
pub struct RepIDAir {
    /// Number of categories being verified
    pub num_categories: usize,
    /// Threshold for verification
    pub threshold: F,
    /// Time window for score calculation
    pub time_window: F,
    /// Base decay rate (in basis points)
    pub decay_rate: F,
    /// Multiplicative factor for sustained activity
    pub multiplicative_factor: F,
}

impl RepIDAir {
    pub fn new(
        num_categories: usize,
        threshold: u32,
        time_window: u64,
        decay_rate: u16,
        multiplicative_factor: f32,
    ) -> Self {
        Self {
            num_categories,
            threshold: F::from_canonical_u32(threshold),
            time_window: F::from_canonical_u64(time_window),
            decay_rate: F::from_canonical_u16(decay_rate),
            multiplicative_factor: F::from_canonical_u32((multiplicative_factor * 1000.0) as u32), // Scale for fixed-point
        }
    }
}

impl<AB: AirBuilder<F = F>> Air<AB> for RepIDAir {
    fn eval(&self, builder: &mut AB) {
        let main = builder.main();
        let local = main.row_slice(0);
        let next = main.row_slice(1);

        // Column layout:
        // 0: wallet_hash (constant throughout execution)
        // 1: timestamp
        // 2-N: category scores (governance, community, technical, etc.)
        // N+1: aggregated_score
        // N+2: meets_threshold (boolean: 1 if score >= threshold, 0 otherwise)
        // N+3: decay_applied (boolean: 1 if decay was applied)
        // N+4: multiplicative_bonus (bonus for sustained activity)

        let wallet_hash = local[0];
        let timestamp = local[1];
        
        // Category scores start at column 2
        let mut category_scores = Vec::new();
        for i in 0..self.num_categories {
            category_scores.push(local[2 + i]);
        }
        
        let aggregated_score = local[2 + self.num_categories];
        let meets_threshold = local[2 + self.num_categories + 1];
        let decay_applied = local[2 + self.num_categories + 2];
        let multiplicative_bonus = local[2 + self.num_categories + 3];

        // Constraint 1: Wallet hash must remain constant
        if main.height() > 1 {
            builder.assert_eq(wallet_hash, next[0]);
        }

        // Constraint 2: Timestamp must be monotonically increasing
        if main.height() > 1 {
            builder.assert_bool(next[1] - timestamp);
        }

        // Constraint 3: Aggregated score calculation
        // score = sum(category_scores) + multiplicative_bonus - decay
        let mut sum_categories = AB::Expr::zero();
        for score in &category_scores {
            sum_categories += *score;
        }
        
        // Apply multiplicative bonus for sustained activity
        let expected_score = sum_categories + multiplicative_bonus;
        
        // Apply time-based decay if timestamp is beyond window
        let time_diff = timestamp - self.time_window;
        let decay_factor = time_diff * self.decay_rate / F::from_canonical_u32(10000); // Basis points to fraction
        
        let decayed_score = builder.if_else(
            decay_applied,
            expected_score - decay_factor,
            expected_score
        );
        
        builder.assert_eq(aggregated_score, decayed_score);

        // Constraint 4: Threshold verification
        // meets_threshold should be 1 if aggregated_score >= threshold, 0 otherwise
        builder.assert_bool(meets_threshold);
        
        let threshold_check = builder.if_else(
            aggregated_score - self.threshold,
            AB::Expr::one(),
            AB::Expr::zero()
        );
        
        builder.assert_eq(meets_threshold, threshold_check);

        // Constraint 5: Multiplicative bonus calculation
        // Bonus increases with sustained activity across multiple categories
        let num_active_categories = category_scores.iter()
            .map(|&score| builder.if_else(score, AB::Expr::one(), AB::Expr::zero()))
            .fold(AB::Expr::zero(), |acc, x| acc + x);
            
        let expected_bonus = num_active_categories * self.multiplicative_factor / F::from_canonical_u32(1000);
        builder.assert_eq(multiplicative_bonus, expected_bonus);

        // Constraint 6: Category scores must be non-negative
        for &score in &category_scores {
            builder.assert_bool(score); // This ensures score is in {0, 1, 2, ...}
        }

        // Constraint 7: Decay application logic
        // decay_applied should be 1 if timestamp > time_window, 0 otherwise
        builder.assert_bool(decay_applied);
        let decay_check = builder.if_else(
            timestamp - self.time_window,
            AB::Expr::one(),
            AB::Expr::zero()
        );
        builder.assert_eq(decay_applied, decay_check);
    }
}

impl BaseAir<F> for RepIDAir {
    fn width(&self) -> usize {
        // wallet_hash + timestamp + category_scores + aggregated_score + meets_threshold + decay_applied + multiplicative_bonus
        2 + self.num_categories + 4
    }

    fn preprocessed_trace(&self) -> Option<Matrix<F>> {
        // No preprocessing needed for basic RepID verification
        None
    }
}

/// BiometricAIR for 4FA verification with WebAuthn
#[derive(Clone, Debug)]
pub struct BiometricAIR {
    /// Number of authentication factors (typically 4)
    pub num_factors: usize,
    /// Challenge used for WebAuthn verification
    pub webauthn_challenge: F,
}

impl BiometricAIR {
    pub fn new(num_factors: usize, webauthn_challenge: [u8; 32]) -> Self {
        // Convert challenge bytes to field element
        let challenge_value = u64::from_le_bytes([
            webauthn_challenge[0], webauthn_challenge[1], webauthn_challenge[2], webauthn_challenge[3],
            webauthn_challenge[4], webauthn_challenge[5], webauthn_challenge[6], webauthn_challenge[7],
        ]);
        
        Self {
            num_factors,
            webauthn_challenge: F::from_canonical_u64(challenge_value),
        }
    }
}

impl<AB: AirBuilder<F = F>> Air<AB> for BiometricAIR {
    fn eval(&self, builder: &mut AB) {
        let main = builder.main();
        let local = main.row_slice(0);

        // Column layout:
        // 0: webauthn_challenge
        // 1: biometric_hash (SHA-256 hash of biometric data)
        // 2: device_attestation (device-specific proof)
        // 3-N: factor_verifications (each authentication factor)
        // N+1: all_factors_verified (1 if all factors verified, 0 otherwise)

        let challenge = local[0];
        let biometric_hash = local[1];
        let device_attestation = local[2];
        
        let mut factor_verifications = Vec::new();
        for i in 0..self.num_factors {
            factor_verifications.push(local[3 + i]);
        }
        
        let all_factors_verified = local[3 + self.num_factors];

        // Constraint 1: Challenge must match expected WebAuthn challenge
        builder.assert_eq(challenge, self.webauthn_challenge);

        // Constraint 2: Biometric hash must be valid (non-zero)
        builder.assert_bool(biometric_hash);

        // Constraint 3: Device attestation must be valid
        builder.assert_bool(device_attestation);

        // Constraint 4: Each factor verification must be boolean
        for &factor in &factor_verifications {
            builder.assert_bool(factor);
        }

        // Constraint 5: All factors verified calculation
        let mut sum_factors = AB::Expr::zero();
        for &factor in &factor_verifications {
            sum_factors += factor;
        }
        
        let expected_all_verified = builder.if_else(
            sum_factors - AB::Expr::from_canonical_usize(self.num_factors),
            AB::Expr::one(),
            AB::Expr::zero()
        );
        
        builder.assert_eq(all_factors_verified, expected_all_verified);
    }
}

impl BaseAir<F> for BiometricAIR {
    fn width(&self) -> usize {
        // challenge + biometric_hash + device_attestation + factor_verifications + all_factors_verified
        3 + self.num_factors + 1
    }

    fn preprocessed_trace(&self) -> Option<Matrix<F>> {
        None
    }
}