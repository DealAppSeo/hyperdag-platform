//! Hierarchical Scoring System for RepID
//! 
//! Implements ANFIS-inspired scoring with decay mechanics and multiplicative factors

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::{RepIDCategory, DecayParameters, F};

/// Hierarchical scoring engine for RepID calculations
#[derive(Debug, Clone)]
pub struct HierarchicalScorer {
    /// Base scoring weights for each category
    pub category_weights: HashMap<RepIDCategory, f32>,
    /// Time-based decay configuration
    pub decay_config: Option<DecayParameters>,
    /// Multiplicative factors for cross-category synergies
    pub synergy_matrix: HashMap<(RepIDCategory, RepIDCategory), f32>,
}

impl HierarchicalScorer {
    /// Create a new hierarchical scorer with default weights
    pub fn new() -> Self {
        let mut category_weights = HashMap::new();
        category_weights.insert(RepIDCategory::Governance, 1.0);
        category_weights.insert(RepIDCategory::Community, 0.8);
        category_weights.insert(RepIDCategory::Technical, 1.2);
        category_weights.insert(RepIDCategory::FaithTech, 0.9);
        category_weights.insert(RepIDCategory::DeFi, 1.1);

        let mut synergy_matrix = HashMap::new();
        // Governance + Technical = leadership bonus
        synergy_matrix.insert((RepIDCategory::Governance, RepIDCategory::Technical), 1.3);
        // Community + FaithTech = purpose alignment bonus
        synergy_matrix.insert((RepIDCategory::Community, RepIDCategory::FaithTech), 1.25);
        // Technical + DeFi = innovation bonus
        synergy_matrix.insert((RepIDCategory::Technical, RepIDCategory::DeFi), 1.2);

        Self {
            category_weights,
            decay_config: None,
            synergy_matrix,
        }
    }

    /// Set custom decay parameters
    pub fn with_decay(mut self, decay_params: DecayParameters) -> Self {
        self.decay_config = Some(decay_params);
        self
    }

    /// Add custom category weight
    pub fn set_category_weight(&mut self, category: RepIDCategory, weight: f32) {
        self.category_weights.insert(category, weight);
    }

    /// Add synergy between two categories
    pub fn set_synergy(&mut self, cat1: RepIDCategory, cat2: RepIDCategory, multiplier: f32) {
        self.synergy_matrix.insert((cat1.clone(), cat2.clone()), multiplier);
        self.synergy_matrix.insert((cat2, cat1), multiplier); // Symmetric
    }

    /// Calculate hierarchical score with decay and synergies
    pub fn calculate_score(
        &self,
        user_scores: &[(RepIDCategory, u32)],
        timestamp: u64,
        time_window: u64,
    ) -> ScoreResult {
        let mut base_score = 0.0;
        let mut active_categories = Vec::new();

        // Calculate base weighted scores
        for (category, raw_score) in user_scores {
            if *raw_score > 0 {
                active_categories.push(category.clone());
                
                let weight = self.category_weights.get(category).unwrap_or(&1.0);
                base_score += (*raw_score as f32) * weight;
            }
        }

        // Apply synergy multipliers
        let mut synergy_bonus = 0.0;
        for i in 0..active_categories.len() {
            for j in (i + 1)..active_categories.len() {
                let cat1 = &active_categories[i];
                let cat2 = &active_categories[j];
                
                if let Some(&multiplier) = self.synergy_matrix.get(&(cat1.clone(), cat2.clone())) {
                    let score1 = user_scores.iter()
                        .find(|(c, _)| c == cat1)
                        .map(|(_, s)| *s as f32)
                        .unwrap_or(0.0);
                    let score2 = user_scores.iter()
                        .find(|(c, _)| c == cat2)
                        .map(|(_, s)| *s as f32)
                        .unwrap_or(0.0);
                        
                    synergy_bonus += (score1 + score2) * (multiplier - 1.0);
                }
            }
        }

        let mut final_score = base_score + synergy_bonus;

        // Apply time-based decay if configured
        let mut decay_applied = false;
        if let Some(decay_params) = &self.decay_config {
            if timestamp > time_window {
                let time_diff = timestamp - time_window;
                let decay_rate = decay_params.base_decay_rate as f32 / 10000.0; // Basis points to fraction
                let decay_amount = final_score * decay_rate * (time_diff as f32 / 86400.0); // Daily decay
                
                final_score -= decay_amount;
                decay_applied = true;

                // Apply minimum threshold
                if final_score < decay_params.min_threshold as f32 {
                    final_score = decay_params.min_threshold as f32;
                }
            }
        }

        // Apply multiplicative factor for sustained activity
        let multiplicative_bonus = if let Some(decay_params) = &self.decay_config {
            active_categories.len() as f32 * decay_params.multiplicative_factor
        } else {
            0.0
        };

        final_score += multiplicative_bonus;

        ScoreResult {
            base_score: base_score as u32,
            synergy_bonus: synergy_bonus as u32,
            multiplicative_bonus: multiplicative_bonus as u32,
            final_score: final_score as u32,
            active_categories,
            decay_applied,
            timestamp,
        }
    }

    /// Convert scores to Plonky3 field elements for circuit generation
    pub fn to_field_elements(&self, score_result: &ScoreResult) -> Vec<F> {
        let mut elements = Vec::new();
        
        elements.push(F::from_u32(score_result.base_score));
        elements.push(F::from_u32(score_result.synergy_bonus));
        elements.push(F::from_u32(score_result.multiplicative_bonus));
        elements.push(F::from_u32(score_result.final_score));
        elements.push(F::new(score_result.timestamp));
        elements.push(F::from_u32(if score_result.decay_applied { 1 } else { 0 }));
        
        elements
    }

    /// Generate ANFIS-style fuzzy rules for dynamic scoring
    pub fn generate_fuzzy_rules(&self) -> Vec<FuzzyRule> {
        let mut rules = Vec::new();

        // Rule 1: High governance + High technical = Leadership tier
        rules.push(FuzzyRule {
            conditions: vec![
                (RepIDCategory::Governance, ScoreRange::High),
                (RepIDCategory::Technical, ScoreRange::High),
            ],
            output_multiplier: 1.5,
            description: "Leadership tier - Strong governance and technical skills".to_string(),
        });

        // Rule 2: High community + High faith-tech = Purpose-driven tier
        rules.push(FuzzyRule {
            conditions: vec![
                (RepIDCategory::Community, ScoreRange::High),
                (RepIDCategory::FaithTech, ScoreRange::High),
            ],
            output_multiplier: 1.3,
            description: "Purpose-driven tier - Strong community and faith-tech alignment".to_string(),
        });

        // Rule 3: Multiple medium scores = Well-rounded bonus
        rules.push(FuzzyRule {
            conditions: vec![
                (RepIDCategory::Governance, ScoreRange::Medium),
                (RepIDCategory::Community, ScoreRange::Medium),
                (RepIDCategory::Technical, ScoreRange::Medium),
            ],
            output_multiplier: 1.2,
            description: "Well-rounded contributor - Balanced across categories".to_string(),
        });

        rules
    }
}

/// Result of hierarchical scoring calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreResult {
    /// Base score before multipliers
    pub base_score: u32,
    /// Bonus from category synergies
    pub synergy_bonus: u32,
    /// Bonus for sustained activity
    pub multiplicative_bonus: u32,
    /// Final calculated score
    pub final_score: u32,
    /// Categories with non-zero scores
    pub active_categories: Vec<RepIDCategory>,
    /// Whether time-based decay was applied
    pub decay_applied: bool,
    /// Timestamp used for calculation
    pub timestamp: u64,
}

/// Fuzzy rule for ANFIS-style scoring
#[derive(Debug, Clone)]
pub struct FuzzyRule {
    /// Conditions that must be met
    pub conditions: Vec<(RepIDCategory, ScoreRange)>,
    /// Multiplier applied when conditions are met
    pub output_multiplier: f32,
    /// Human-readable description
    pub description: String,
}

/// Score ranges for fuzzy logic
#[derive(Debug, Clone, PartialEq)]
pub enum ScoreRange {
    Low,      // 0-33
    Medium,   // 34-66
    High,     // 67-100
    Expert,   // 100+
}

impl ScoreRange {
    pub fn from_score(score: u32) -> Self {
        match score {
            0..=33 => ScoreRange::Low,
            34..=66 => ScoreRange::Medium,
            67..=100 => ScoreRange::High,
            _ => ScoreRange::Expert,
        }
    }
}

impl Default for HierarchicalScorer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hierarchical_scoring() {
        let scorer = HierarchicalScorer::new();
        
        let user_scores = vec![
            (RepIDCategory::Governance, 75),
            (RepIDCategory::Technical, 85),
            (RepIDCategory::Community, 50),
        ];

        let result = scorer.calculate_score(&user_scores, 1000000000, 999999999);
        
        assert!(result.final_score > 0);
        assert_eq!(result.active_categories.len(), 3);
        assert!(!result.decay_applied); // No decay config
    }

    #[test]
    fn test_decay_application() {
        let decay_params = DecayParameters {
            base_decay_rate: 500, // 5%
            multiplicative_factor: 1.2,
            min_threshold: 10,
        };
        
        let scorer = HierarchicalScorer::new().with_decay(decay_params);
        
        let user_scores = vec![
            (RepIDCategory::Technical, 100),
        ];

        // Test with old timestamp (should trigger decay)
        let result = scorer.calculate_score(&user_scores, 2000000000, 1000000000);
        assert!(result.decay_applied);
    }
}