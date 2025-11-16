/**
 * ElevenLabs Audio Generation Service
 * High-quality voice synthesis and speech generation
 * Free tier: 10,000 characters/month
 */

import axios from 'axios';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

interface AudioGenerationOptions {
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

interface AudioGenerationResult {
  audioBuffer: Buffer;
  metadata: {
    provider: string;
    voice_used: string;
    model_used: string;
    characters_used: number;
    latency: number;
    cost: number;
  };
}

export class ElevenLabsService {
  private apiKey: string;
  private baseURL = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
  private charactersUsed = 0;
  private monthlyLimit = 10000; // Free tier limit

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (this.apiKey) {
      console.log('[ElevenLabs] Service initialized with API key');
      console.log('[ElevenLabs] Free tier: 10,000 characters/month');
    } else {
      console.log('[ElevenLabs] Service configured - waiting for API key setup');
    }
  }

  /**
   * Check if service is available and has quota
   */
  isAvailable(): boolean {
    return !!this.apiKey && this.charactersUsed < this.monthlyLimit;
  }

  /**
   * Get remaining quota
   */
  getRemainingQuota(): number {
    return Math.max(0, this.monthlyLimit - this.charactersUsed);
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseURL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data.voices.map((voice: any) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description
      }));

    } catch (error) {
      console.error('[ElevenLabs] Failed to fetch voices:', error);
      throw new Error('Failed to fetch available voices');
    }
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(
    text: string, 
    options: AudioGenerationOptions = {}
  ): Promise<AudioGenerationResult> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    if (!this.isAvailable()) {
      throw new Error('ElevenLabs quota exceeded for this month');
    }

    const startTime = Date.now();
    const charactersToUse = text.length;

    // Check if we have enough quota
    if (charactersToUse > this.getRemainingQuota()) {
      throw new Error(`Not enough quota. Need ${charactersToUse}, have ${this.getRemainingQuota()}`);
    }

    try {
      const voiceId = options.voice_id || this.defaultVoiceId;
      const modelId = options.model_id || 'eleven_monolingual_v1';

      const requestBody = {
        text,
        model_id: modelId,
        voice_settings: options.voice_settings || {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      };

      const response = await axios.post(
        `${this.baseURL}/text-to-speech/${voiceId}`,
        requestBody,
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      // Update usage
      this.charactersUsed += charactersToUse;
      const latency = Date.now() - startTime;

      console.log(`[ElevenLabs] Generated ${charactersToUse} characters in ${latency}ms`);
      console.log(`[ElevenLabs] Remaining quota: ${this.getRemainingQuota()}`);

      return {
        audioBuffer: Buffer.from(response.data),
        metadata: {
          provider: 'ElevenLabs',
          voice_used: voiceId,
          model_used: modelId,
          characters_used: charactersToUse,
          latency,
          cost: 0 // Free tier
        }
      };

    } catch (error: any) {
      console.error('[ElevenLabs] Speech generation failed:', error.response?.data || error.message);
      throw new Error(`ElevenLabs speech generation failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Generate speech with automatic voice selection
   */
  async generateSpeechWithArbitrage(
    text: string,
    preferences: {
      voiceType?: 'male' | 'female' | 'any';
      style?: 'professional' | 'casual' | 'narration';
      priority?: 'speed' | 'quality';
    } = {}
  ): Promise<AudioGenerationResult> {
    // For now, use default voice - could be enhanced with voice selection logic
    const options: AudioGenerationOptions = {
      voice_id: this.selectOptimalVoice(preferences),
      voice_settings: this.getOptimalSettings(preferences)
    };

    return this.generateSpeech(text, options);
  }

  /**
   * Select optimal voice based on preferences
   */
  private selectOptimalVoice(preferences: any): string {
    // Default voice selection logic - could be enhanced with actual voice analysis
    const voiceMap = {
      'professional': 'pNInz6obpgDQGcFmaJgB', // Adam
      'casual': 'EXAVITQu4vr4xnSDxMaL', // Bella
      'narration': 'ErXwobaYiN019PkySvjV' // Antoni
    };

    return voiceMap[preferences.style as keyof typeof voiceMap] || this.defaultVoiceId;
  }

  /**
   * Get optimal voice settings
   */
  private getOptimalSettings(preferences: any) {
    if (preferences.priority === 'speed') {
      return {
        stability: 0.3,
        similarity_boost: 0.3,
        style: 0.0,
        use_speaker_boost: false
      };
    } else if (preferences.priority === 'quality') {
      return {
        stability: 0.7,
        similarity_boost: 0.8,
        style: 0.2,
        use_speaker_boost: true
      };
    }

    // Balanced default
    return {
      stability: 0.5,
      similarity_boost: 0.5,
      style: 0.1,
      use_speaker_boost: true
    };
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      provider: 'ElevenLabs',
      tier: 'free',
      monthlyLimit: this.monthlyLimit,
      charactersUsed: this.charactersUsed,
      remainingQuota: this.getRemainingQuota(),
      quotaPercentage: (this.charactersUsed / this.monthlyLimit) * 100,
      available: this.isAvailable(),
      capabilities: [
        'text_to_speech',
        'voice_cloning',
        'multiple_voices',
        'voice_settings',
        'high_quality'
      ]
    };
  }
}

export const elevenLabsService = new ElevenLabsService();