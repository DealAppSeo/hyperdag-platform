//! RepID Prover Implementation using Plonky3
//! 
//! Generates zero-knowledge proofs for RepID threshold verification

use std::time::Instant;

use plonky3_challenger::{HashChallenger, SerializingChallenger32};
use plonky3_commit::ExtensionMmcs;
use plonky3_dft::Radix2DitParallel;
use plonky3_field::extension::BinomialExtensionField;
use plonky3_fri::{FriConfig, TwoAdicFriPcs};
use plonky3_matrix::{dense::RowMajorMatrix, Matrix};
use plonky3_merkle_tree::FieldMerkleTreeMmcs;
use plonky3_poseidon2::{Poseidon2, Poseidon2ExternalMatrixGeneral};
use plonky3_symmetric::{PaddingFreeSponge, TruncatedPermutation};
use plonky3_uni_stark::{prove, StarkConfig};
use plonky3_util::log2_ceil_usize;

use crate::{
    repid_air::{RepIDAir, BiometricAIR},
    F, Hash, RepIDProof, ProofMetadata, ThresholdVerificationRequest, 
    Result, ZKPError, RepIDCategory, DecayParameters, ThresholdVerificationResult,
    VerificationMetadata
};

/// RepID prover configuration using optimized Plonky3 components
pub struct RepIDProver {
    /// Stark configuration for proof generation
    stark_config: StarkConfig<
        ExtensionMmcs<F, BinomialExtensionField<F, 4>, FieldMerkleTreeMmcs<F, Hash>>,
        HashChallenger<F, Hash, 8, 16>,
        TwoAdicFriPcs<F, Radix2DitParallel, FieldMerkleTreeMmcs<F, Hash>>,
    >,
}

impl RepIDProver {
    /// Create a new RepID prover with optimized configuration
    pub fn new() -> Self {
        // Configure hash function (Poseidon2 for STARK recursion)
        let perm = Poseidon2::new_from_rng_128(
            Poseidon2ExternalMatrixGeneral,
            &mut rand::thread_rng()
        );
        
        let hash = PaddingFreeSponge::new(perm, 16, 8, 8);
        
        // Configure Merkle tree commitment scheme
        let compress = TruncatedPermutation::new(perm, 2);
        let val_mmcs = FieldMerkleTreeMmcs::new(hash, compress);
        
        // Configure challenger for Fiat-Shamir
        let challenger = HashChallenger::new(hash);
        
        // Configure FRI polynomial commitment scheme
        let fri_config = FriConfig {
            log_blowup: 1,
            num_queries: 80, // Security parameter
            proof_of_work_bits: 16,
            mmcs: val_mmcs,
        };
        
        let pcs = TwoAdicFriPcs::new(fri_config);
        
        // Configure STARK system
        let stark_config = StarkConfig::new(
            val_mmcs.clone(),
            challenger,
            pcs,
        );

        Self { stark_config }
    }

    /// Generate a ZKP proof for RepID threshold verification
    pub fn prove_threshold_verification(
        &self,
        request: &ThresholdVerificationRequest,
        user_scores: &[(RepIDCategory, u32)],
        wallet_address: &str,
    ) -> Result<ThresholdVerificationResult> {
        let start_time = Instant::now();

        // Create execution trace for the verification
        let trace = self.create_threshold_trace(request, user_scores, wallet_address)?;
        
        // Create AIR instance
        let air = RepIDAir::new(
            request.categories.len(),
            request.threshold,
            request.time_window,
            request.decay_params.as_ref().map(|d| d.base_decay_rate).unwrap_or(0),
            request.decay_params.as_ref().map(|d| d.multiplicative_factor).unwrap_or(1.0),
        );

        // Generate proof
        let proof = prove(&self.stark_config, &air, &mut rand::thread_rng(), trace)
            .map_err(|e| ZKPError::ProofGenerationError(format!("Failed to generate proof: {:?}", e)))?;

        let generation_time = start_time.elapsed().as_millis() as u64;

        // Serialize proof
        let proof_bytes = bincode::serialize(&proof)
            .map_err(|e| ZKPError::SerializationError(e.to_string()))?;

        // Calculate whether threshold is met (this is what we prove privately)
        let total_score = user_scores.iter()
            .filter(|(cat, _)| request.categories.contains(cat))
            .map(|(_, score)| *score as u64)
            .sum::<u64>();

        let meets_threshold = total_score >= request.threshold as u64;

        let repid_proof = RepIDProof {
            proof_bytes: proof_bytes.clone(),
            public_inputs: vec![
                F::from_canonical_u32(request.threshold), // Only threshold is public
                F::from_canonical_u64(request.time_window),
            ],
            metadata: ProofMetadata {
                operation_type: "threshold_verification".to_string(),
                timestamp: chrono::Utc::now().timestamp() as u64,
                wallet_hash: format!("{:x}", md5::compute(wallet_address.as_bytes())),
                proof_size: proof_bytes.len(),
                generation_time_ms: generation_time,
            },
        };

        let verification_metadata = VerificationMetadata {
            categories_verified: request.categories.clone(),
            threshold_used: request.threshold,
            time_window_applied: request.time_window,
            decay_applied: request.decay_params.is_some(),
        };

        Ok(ThresholdVerificationResult {
            meets_threshold,
            proof: repid_proof,
            metadata: verification_metadata,
        })
    }

    /// Generate a ZKP proof for biometric 4FA verification
    pub fn prove_biometric_4fa(
        &self,
        webauthn_challenge: [u8; 32],
        biometric_hash: [u8; 32],
        device_attestation: Vec<u8>,
        factor_proofs: &[bool; 4], // 4 authentication factors
    ) -> Result<RepIDProof> {
        let start_time = Instant::now();

        // Create execution trace for biometric verification
        let trace = self.create_biometric_trace(
            webauthn_challenge,
            biometric_hash,
            device_attestation,
            factor_proofs,
        )?;

        // Create BiometricAIR instance
        let air = BiometricAIR::new(4, webauthn_challenge);

        // Generate proof
        let proof = prove(&self.stark_config, &air, &mut rand::thread_rng(), trace)
            .map_err(|e| ZKPError::ProofGenerationError(format!("Biometric proof failed: {:?}", e)))?;

        let generation_time = start_time.elapsed().as_millis() as u64;

        // Serialize proof
        let proof_bytes = bincode::serialize(&proof)
            .map_err(|e| ZKPError::SerializationError(e.to_string()))?;

        Ok(RepIDProof {
            proof_bytes: proof_bytes.clone(),
            public_inputs: vec![
                F::from_canonical_u64(u64::from_le_bytes([
                    webauthn_challenge[0], webauthn_challenge[1], webauthn_challenge[2], webauthn_challenge[3],
                    webauthn_challenge[4], webauthn_challenge[5], webauthn_challenge[6], webauthn_challenge[7],
                ])),
            ],
            metadata: ProofMetadata {
                operation_type: "biometric_4fa".to_string(),
                timestamp: chrono::Utc::now().timestamp() as u64,
                wallet_hash: "biometric_verification".to_string(),
                proof_size: proof_bytes.len(),
                generation_time_ms: generation_time,
            },
        })
    }

    /// Create execution trace for threshold verification
    fn create_threshold_trace(
        &self,
        request: &ThresholdVerificationRequest,
        user_scores: &[(RepIDCategory, u32)],
        wallet_address: &str,
    ) -> Result<RowMajorMatrix<F>> {
        let trace_length = 4; // Minimal trace for threshold verification
        let width = 2 + request.categories.len() + 4; // As defined in RepIDAir
        
        let mut trace = RowMajorMatrix::new(
            vec![F::zero(); trace_length * width],
            width,
        );

        // Wallet hash (consistent across all rows)
        let wallet_hash = F::from_canonical_u64(
            u64::from_le_bytes([
                wallet_address.as_bytes()[0], wallet_address.as_bytes()[1], 
                wallet_address.as_bytes()[2], wallet_address.as_bytes()[3],
                wallet_address.as_bytes()[4], wallet_address.as_bytes()[5],
                wallet_address.as_bytes()[6], wallet_address.as_bytes()[7],
            ])
        );

        let current_timestamp = F::from_canonical_u64(chrono::Utc::now().timestamp() as u64);

        for row in 0..trace_length {
            let mut col = 0;
            
            // Column 0: wallet_hash
            trace.set(row, col, wallet_hash);
            col += 1;
            
            // Column 1: timestamp
            trace.set(row, col, current_timestamp);
            col += 1;

            // Columns 2-N: category scores
            let mut total_score = 0u32;
            for category in &request.categories {
                let score = user_scores.iter()
                    .find(|(cat, _)| cat == category)
                    .map(|(_, score)| *score)
                    .unwrap_or(0);
                
                trace.set(row, col, F::from_canonical_u32(score));
                total_score += score;
                col += 1;
            }

            // Apply multiplicative bonus for sustained activity
            let active_categories = request.categories.iter()
                .map(|cat| {
                    user_scores.iter()
                        .find(|(c, _)| c == cat)
                        .map(|(_, score)| if *score > 0 { 1 } else { 0 })
                        .unwrap_or(0)
                })
                .sum::<u32>();

            let multiplicative_bonus = if let Some(decay) = &request.decay_params {
                (active_categories as f32 * decay.multiplicative_factor) as u32
            } else {
                0
            };

            // Apply time-based decay if needed
            let time_diff = current_timestamp.as_canonical_u64() - request.time_window;
            let decay_applied = time_diff > 0;
            
            let decay_amount = if decay_applied && request.decay_params.is_some() {
                let decay_rate = request.decay_params.as_ref().unwrap().base_decay_rate as f32 / 10000.0;
                (total_score as f32 * decay_rate * time_diff as f32) as u32
            } else {
                0
            };

            let final_score = total_score + multiplicative_bonus - decay_amount;

            // Column N+1: aggregated_score
            trace.set(row, col, F::from_canonical_u32(final_score));
            col += 1;

            // Column N+2: meets_threshold
            let meets_threshold = if final_score >= request.threshold { 1 } else { 0 };
            trace.set(row, col, F::from_canonical_u32(meets_threshold));
            col += 1;

            // Column N+3: decay_applied
            trace.set(row, col, F::from_canonical_u32(if decay_applied { 1 } else { 0 }));
            col += 1;

            // Column N+4: multiplicative_bonus
            trace.set(row, col, F::from_canonical_u32(multiplicative_bonus));
        }

        Ok(trace)
    }

    /// Create execution trace for biometric 4FA verification
    fn create_biometric_trace(
        &self,
        webauthn_challenge: [u8; 32],
        biometric_hash: [u8; 32],
        _device_attestation: Vec<u8>,
        factor_proofs: &[bool; 4],
    ) -> Result<RowMajorMatrix<F>> {
        let trace_length = 2; // Minimal trace for biometric verification
        let width = 3 + 4 + 1; // As defined in BiometricAIR (challenge + hash + attestation + 4 factors + all_verified)
        
        let mut trace = RowMajorMatrix::new(
            vec![F::zero(); trace_length * width],
            width,
        );

        let challenge_value = F::from_canonical_u64(u64::from_le_bytes([
            webauthn_challenge[0], webauthn_challenge[1], webauthn_challenge[2], webauthn_challenge[3],
            webauthn_challenge[4], webauthn_challenge[5], webauthn_challenge[6], webauthn_challenge[7],
        ]));

        let hash_value = F::from_canonical_u64(u64::from_le_bytes([
            biometric_hash[0], biometric_hash[1], biometric_hash[2], biometric_hash[3],
            biometric_hash[4], biometric_hash[5], biometric_hash[6], biometric_hash[7],
        ]));

        for row in 0..trace_length {
            let mut col = 0;

            // Column 0: webauthn_challenge
            trace.set(row, col, challenge_value);
            col += 1;

            // Column 1: biometric_hash
            trace.set(row, col, hash_value);
            col += 1;

            // Column 2: device_attestation (simplified as 1 for valid)
            trace.set(row, col, F::one());
            col += 1;

            // Columns 3-6: factor_verifications
            let mut all_verified = true;
            for &factor in factor_proofs {
                trace.set(row, col, if factor { F::one() } else { F::zero() });
                if !factor {
                    all_verified = false;
                }
                col += 1;
            }

            // Column 7: all_factors_verified
            trace.set(row, col, if all_verified { F::one() } else { F::zero() });
        }

        Ok(trace)
    }
}

impl Default for RepIDProver {
    fn default() -> Self {
        Self::new()
    }
}