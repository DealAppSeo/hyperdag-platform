//! RepID Verifier Implementation using Plonky3
//! 
//! Verifies zero-knowledge proofs for RepID threshold verification

use plonky3_challenger::{HashChallenger, SerializingChallenger32};
use plonky3_commit::ExtensionMmcs;
use plonky3_dft::Radix2DitParallel;
use plonky3_field::extension::BinomialExtensionField;
use plonky3_fri::{FriConfig, TwoAdicFriPcs};
use plonky3_merkle_tree::FieldMerkleTreeMmcs;
use plonky3_poseidon2::{Poseidon2, Poseidon2ExternalMatrixGeneral};
use plonky3_symmetric::{PaddingFreeSponge, TruncatedPermutation};
use plonky3_uni_stark::{verify, StarkConfig};

use crate::{
    repid_air::{RepIDAir, BiometricAIR},
    F, Hash, RepIDProof, Result, ZKPError, ThresholdVerificationRequest
};

/// RepID verifier using Plonky3 STARK verification
pub struct RepIDVerifier {
    /// Stark configuration for proof verification
    stark_config: StarkConfig<
        ExtensionMmcs<F, BinomialExtensionField<F, 4>, FieldMerkleTreeMmcs<F, Hash>>,
        HashChallenger<F, Hash, 8, 16>,
        TwoAdicFriPcs<F, Radix2DitParallel, FieldMerkleTreeMmcs<F, Hash>>,
    >,
}

impl RepIDVerifier {
    /// Create a new RepID verifier with matching prover configuration
    pub fn new() -> Self {
        // Must match prover configuration exactly
        let perm = Poseidon2::new_from_rng_128(
            Poseidon2ExternalMatrixGeneral,
            &mut rand::thread_rng()
        );
        
        let hash = PaddingFreeSponge::new(perm, 16, 8, 8);
        let compress = TruncatedPermutation::new(perm, 2);
        let val_mmcs = FieldMerkleTreeMmcs::new(hash, compress);
        let challenger = HashChallenger::new(hash);
        
        let fri_config = FriConfig {
            log_blowup: 1,
            num_queries: 80,
            proof_of_work_bits: 16,
            mmcs: val_mmcs,
        };
        
        let pcs = TwoAdicFriPcs::new(fri_config);
        let stark_config = StarkConfig::new(val_mmcs.clone(), challenger, pcs);

        Self { stark_config }
    }

    /// Verify a RepID threshold verification proof
    pub fn verify_threshold_proof(
        &self,
        proof: &RepIDProof,
        request: &ThresholdVerificationRequest,
    ) -> Result<bool> {
        // Deserialize proof
        let stark_proof: plonky3_uni_stark::Proof<_> = bincode::deserialize(&proof.proof_bytes)
            .map_err(|e| ZKPError::SerializationError(format!("Failed to deserialize proof: {}", e)))?;

        // Create AIR instance with same parameters used for proving
        let air = RepIDAir::new(
            request.categories.len(),
            request.threshold,
            request.time_window,
            request.decay_params.as_ref().map(|d| d.base_decay_rate).unwrap_or(0),
            request.decay_params.as_ref().map(|d| d.multiplicative_factor).unwrap_or(1.0),
        );

        // Verify the proof
        let verification_result = verify(&self.stark_config, &air, &mut rand::thread_rng(), &stark_proof);
        
        match verification_result {
            Ok(_) => Ok(true),
            Err(e) => {
                tracing::warn!("Proof verification failed: {:?}", e);
                Ok(false)
            }
        }
    }

    /// Verify a biometric 4FA proof
    pub fn verify_biometric_proof(
        &self,
        proof: &RepIDProof,
        webauthn_challenge: [u8; 32],
    ) -> Result<bool> {
        // Deserialize proof
        let stark_proof: plonky3_uni_stark::Proof<_> = bincode::deserialize(&proof.proof_bytes)
            .map_err(|e| ZKPError::SerializationError(format!("Failed to deserialize biometric proof: {}", e)))?;

        // Create BiometricAIR instance
        let air = BiometricAIR::new(4, webauthn_challenge);

        // Verify the proof
        let verification_result = verify(&self.stark_config, &air, &mut rand::thread_rng(), &stark_proof);
        
        match verification_result {
            Ok(_) => Ok(true),
            Err(e) => {
                tracing::warn!("Biometric proof verification failed: {:?}", e);
                Ok(false)
            }
        }
    }

    /// Extract public inputs from proof for on-chain verification
    pub fn extract_public_inputs(&self, proof: &RepIDProof) -> Vec<String> {
        proof.public_inputs
            .iter()
            .map(|input| format!("0x{:064x}", input.as_canonical_u64()))
            .collect()
    }

    /// Generate verification data for Solidity contract
    pub fn generate_solidity_verification_data(
        &self,
        proof: &RepIDProof,
        request: &ThresholdVerificationRequest,
    ) -> Result<SolidityVerificationData> {
        // Extract key verification parameters
        let public_inputs = self.extract_public_inputs(proof);
        
        // Generate proof hash for on-chain storage
        let proof_hash = format!("0x{:064x}", 
            md5::compute(&proof.proof_bytes).iter().fold(0u64, |acc, &b| acc.wrapping_add(b as u64))
        );

        // Create verification metadata
        Ok(SolidityVerificationData {
            proof_hash,
            public_inputs,
            threshold: request.threshold,
            timestamp: chrono::Utc::now().timestamp() as u64,
            categories: request.categories.len() as u32,
            meets_threshold: self.verify_threshold_proof(proof, request)?,
        })
    }
}

/// Data structure for Solidity contract verification
#[derive(Debug, Clone)]
pub struct SolidityVerificationData {
    /// Hash of the proof for on-chain storage
    pub proof_hash: String,
    /// Public inputs as hex strings
    pub public_inputs: Vec<String>,
    /// Threshold used for verification
    pub threshold: u32,
    /// Timestamp of verification
    pub timestamp: u64,
    /// Number of categories verified
    pub categories: u32,
    /// Whether the threshold was met
    pub meets_threshold: bool,
}

impl Default for RepIDVerifier {
    fn default() -> Self {
        Self::new()
    }
}

/// Batch verification for multiple proofs (gas optimization)
pub struct BatchVerifier {
    verifier: RepIDVerifier,
}

impl BatchVerifier {
    pub fn new() -> Self {
        Self {
            verifier: RepIDVerifier::new(),
        }
    }

    /// Verify multiple proofs in batch for gas optimization
    pub fn verify_batch(
        &self,
        proofs: &[(RepIDProof, ThresholdVerificationRequest)],
    ) -> Result<Vec<bool>> {
        let mut results = Vec::with_capacity(proofs.len());
        
        for (proof, request) in proofs {
            let result = self.verifier.verify_threshold_proof(proof, request)?;
            results.push(result);
        }
        
        Ok(results)
    }

    /// Generate batch verification data for smart contract
    pub fn generate_batch_verification_data(
        &self,
        proofs: &[(RepIDProof, ThresholdVerificationRequest)],
    ) -> Result<Vec<SolidityVerificationData>> {
        let mut verification_data = Vec::with_capacity(proofs.len());
        
        for (proof, request) in proofs {
            let data = self.verifier.generate_solidity_verification_data(proof, request)?;
            verification_data.push(data);
        }
        
        Ok(verification_data)
    }
}