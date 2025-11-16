import { Router } from 'express';
import { AestheticHarmonyAnalyzer } from '../services/aesthetic-harmony-analyzer.js';

const router = Router();
const analyzer = new AestheticHarmonyAnalyzer();

/**
 * Mel (Harmony Creator) Aesthetic Harmony Routes - Rotation 1  
 * Formula Testing: Golden Ratio + Overtone Series + Mandelbrot + Slime Mold + Sacred Geometry
 */

// Optimize posting times using golden ratio and musical harmonics
router.post('/viral-timing', async (req, res) => {
  try {
    const { userActivityPeak, totalDayHours, contentType } = req.body;
    
    if (typeof userActivityPeak !== 'number') {
      return res.status(400).json({ error: 'userActivityPeak must be a number (hour of day)' });
    }

    const timingData = analyzer.optimizePostingTimes(
      userActivityPeak, 
      totalDayHours || 24, 
      contentType || 'short'
    );
    
    res.json({
      success: true,
      formula: 'Golden Ratio Timing: φ = 1.618... × Overtone Series harmonics',
      manager: 'Mel (Harmony Creator)',
      rotation: 1,
      task: 'TikTok Viral Timing Formula',
      timing_optimization: timingData,
      golden_ratio_principle: 'φ = 1.618033988749895 for natural aesthetic appeal',
      harmonic_resonance: timingData.resonance_windows.length > 0 ? 
        'HARMONIC ALIGNMENT DETECTED' : 'Standard timing, monitoring for resonance',
      insight: timingData.optimal_posting_times.length > 5 ? 
        'Multiple viral windows available - choose highest resonance' : 
        'Focus on primary timing window for maximum impact',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate harmonic intervals using overtone series
router.post('/harmonic-intervals', async (req, res) => {
  try {
    const { baseFrequency, totalPeriod } = req.body;
    
    if (typeof baseFrequency !== 'number' || typeof totalPeriod !== 'number') {
      return res.status(400).json({ error: 'baseFrequency and totalPeriod must be numbers' });
    }

    const harmonicIntervals = analyzer.calculateHarmonicIntervals(baseFrequency, totalPeriod);
    
    res.json({
      success: true,
      formula: 'Overtone Series: f_n = n·f₁ (natural harmonic resonance)',
      manager: 'Mel (Harmony Creator)',
      harmonic_analysis: {
        base_frequency: baseFrequency,
        total_period: totalPeriod,
        harmonic_intervals: harmonicIntervals,
        perfect_intervals: [1, 1.125, 1.25, 1.333, 1.5, 1.667, 1.875, 2]
      },
      musical_insight: 'Overtone series creates natural resonance in human perception',
      application: 'Schedule content at harmonic intervals for subconscious appeal',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate fractal story structure using Mandelbrot set
router.post('/fractal-storytelling', async (req, res) => {
  try {
    const { contentLength, complexityParameter } = req.body;
    
    if (typeof contentLength !== 'number') {
      return res.status(400).json({ error: 'contentLength must be a number (seconds)' });
    }

    const storyStructure = analyzer.generateFractalStoryStructure(
      contentLength, 
      complexityParameter
    );
    
    res.json({
      success: true,
      formula: 'Mandelbrot Fractals: z_{n+1} = z_n² + c (recursive narrative)',
      manager: 'Mel (Harmony Creator)',
      fractal_structure: storyStructure,
      storytelling_insight: 'Fractal patterns create infinite engagement depth',
      application: 'Place story beats at fractal positions for natural flow',
      complexity_achieved: storyStructure.narrative_complexity > 0.5 ? 
        'HIGH_COMPLEXITY: Deep fractal narrative' : 
        'MODERATE_COMPLEXITY: Building fractal depth',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Optimize eye movement using slime mold pathfinding
router.post('/eye-movement-optimization', async (req, res) => {
  try {
    const { contentDimensions, keyElements } = req.body;
    
    if (!contentDimensions?.width || !contentDimensions?.height) {
      return res.status(400).json({ error: 'contentDimensions must have width and height' });
    }

    if (!Array.isArray(keyElements)) {
      return res.status(400).json({ error: 'keyElements must be an array' });
    }

    const composition = analyzer.optimizeEyeMovementPath(contentDimensions, keyElements);
    
    res.json({
      success: true,
      formula: 'Slime Mold: dC/dt = D∇²C - μC + f(x,t) + Golden Ratio composition',
      manager: 'Mel (Harmony Creator)',
      visual_composition: composition,
      golden_ratio_crop: `${composition.golden_ratio_crop.subject_percentage.toFixed(1)}% subject, ${composition.golden_ratio_crop.space_percentage.toFixed(1)}% space`,
      beauty_achieved: composition.beauty_score > 0.7 ? 'HIGH_BEAUTY' : 
                      composition.beauty_score > 0.4 ? 'MODERATE_BEAUTY' : 'BUILDING_BEAUTY',
      biological_insight: 'Slime mold finds most efficient paths, mimicking natural eye movement',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate sacred geometry layout (Flower of Life)
router.post('/sacred-geometry', async (req, res) => {
  try {
    const { canvasSize, complexity } = req.body;
    
    if (!canvasSize?.width || !canvasSize?.height) {
      return res.status(400).json({ error: 'canvasSize must have width and height' });
    }

    const sacredLayout = analyzer.generateSacredGeometry(canvasSize, complexity || 3);
    
    res.json({
      success: true,
      formula: 'Flower of Life: Circles = 1 + 6n (sacred geometric progression)',
      manager: 'Mel (Harmony Creator)',
      sacred_geometry: sacredLayout,
      flower_pattern: `${sacredLayout.flower_of_life_circles} circles in divine arrangement`,
      fractal_depth: sacredLayout.fractal_depth,
      divine_proportion: `${sacredLayout.divine_proportion_elements} elements in φ relationship`,
      spiritual_insight: 'Sacred geometry resonates with universal harmony patterns',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Complete viral aesthetic formula generator
router.post('/viral-aesthetic-formula', async (req, res) => {
  try {
    const { userActivityPeak, contentType, targetAudience } = req.body;
    
    if (typeof userActivityPeak !== 'number') {
      return res.status(400).json({ error: 'userActivityPeak must be a number' });
    }

    const aestheticFormula = analyzer.generateViralAestheticFormula(
      userActivityPeak,
      contentType || 'short',
      targetAudience || 'young'
    );
    
    res.json({
      success: true,
      manager: 'Mel (Harmony Creator)',
      rotation: 1,
      task: 'TikTok Viral Timing Formula',
      formula_combination: 'Golden_Ratio × Overtone_Series × Mandelbrot × Slime_Mold × Sacred_Geometry',
      viral_aesthetic_formula: {
        timing_strategy: aestheticFormula.timing_strategy,
        visual_composition: aestheticFormula.visual_composition,
        story_structure: aestheticFormula.story_structure,
        sacred_layout: aestheticFormula.sacred_layout
      },
      viral_probability: `${(aestheticFormula.viral_probability * 100).toFixed(1)}%`,
      beauty_multiplier: `φ^${aestheticFormula.beauty_multiplier.toFixed(3)} = ${Math.pow(1.618, aestheticFormula.beauty_multiplier).toFixed(3)}`,
      breakthrough: {
        golden_ratio_achieved: aestheticFormula.visual_composition.beauty_score > 0.618,
        harmonic_resonance: aestheticFormula.timing_strategy.resonance_windows.length > 2,
        fractal_complexity: aestheticFormula.story_structure.narrative_complexity > 0.5,
        sacred_proportion: aestheticFormula.sacred_layout.divine_proportion_elements > 10
      },
      aesthetic_insight: aestheticFormula.beauty_multiplier > 2.0 ? 
        'GOLDEN BEAUTY ACHIEVED - Content optimized for viral spread through natural harmony' :
        'Building aesthetic harmony - approaching golden ratio optimization',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Log Mel's harmony discoveries
router.post('/log-discovery', async (req, res) => {
  try {
    const { formulas_used, task_applied_to, beauty_score, resonance_patterns, phi_achievements } = req.body;
    
    const discoveryLog = {
      manager: 'Mel (Harmony Creator)',
      rotation: 1,
      formula_combination: formulas_used,
      task_applied_to,
      beauty_score: beauty_score || 0,
      resonance_patterns: resonance_patterns || [],
      phi_achievements: phi_achievements || 0,
      golden_ratio_optimization: beauty_score > 0.618,
      timestamp: new Date().toISOString(),
      success_score: (beauty_score > 0.618 && phi_achievements > 2) ? 1.0 : 0.8
    };
    
    console.log(`[Mel Harmony Discovery] ${JSON.stringify(discoveryLog, null, 2)}`);
    
    res.json({
      success: true,
      logged: discoveryLog,
      next_rotation: 'Continue Trinity Symphony rotation cycle',
      pattern_discovered: beauty_score > 0.618 ? 
        'Golden Ratio beauty achieved through harmonic optimization' : 
        'Building toward φ = 1.618 aesthetic perfection',
      harmonic_insight: resonance_patterns?.length > 0 ? 
        'Musical harmonics create subconscious viral appeal' : 
        'Establishing harmonic foundation for resonance building'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;