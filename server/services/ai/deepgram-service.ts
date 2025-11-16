/**
 * Deepgram Speech-to-Text Service
 * Nova-2 model with superior accuracy
 * Free tier: $200 credits (covers significant usage)
 */

import axios from 'axios';

interface DeepgramConfig {
  apiKey?: string;
  baseURL: string;
  models: string[];
}

interface TranscriptionOptions {
  model?: string;
  language?: string;
  punctuate?: boolean;
  diarize?: boolean;
  sentiment?: boolean;
  summarize?: boolean;
  detect_language?: boolean;
}

interface DeepgramResponse {
  transcript: string;
  confidence: number;
  latency: number;
  cost: number;
  provider: string;
  model: string;
  success: boolean;
  metadata?: {
    words?: any[];
    channels?: any[];
    sentiment?: any;
    summary?: string;
  };
}

export class DeepgramService {
  private config: DeepgramConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      apiKey: process.env.DEEPGRAM_API_KEY,
      baseURL: 'https://api.deepgram.com/v1',
      models: [
        'nova-2',
        'nova-2-general',
        'nova-2-meeting',
        'nova-2-phonecall',
        'nova-2-finance',
        'nova-2-conversationalai',
        'nova-2-voicemail',
        'nova-2-video',
        'nova-2-medical',
        'nova-2-drivethru',
        'nova-2-automotive'
      ]
    };

    if (this.config.apiKey) {
      this.isInitialized = true;
      console.log('[Deepgram] Service initialized with API key');
      console.log('[Deepgram] Free tier: $200 credits');
      console.log('[Deepgram] Available models:', this.config.models.length);
    } else {
      console.log('[Deepgram] Service configured - waiting for API key setup');
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Transcribe audio from URL
   */
  async transcribeFromURL(
    audioUrl: string,
    options: TranscriptionOptions = {}
  ): Promise<DeepgramResponse> {
    if (!this.isAvailable()) {
      throw new Error('Deepgram service not available');
    }

    const startTime = Date.now();
    const model = options.model || 'nova-2';

    try {
      const params = new URLSearchParams({
        model,
        language: options.language || 'en',
        punctuate: String(options.punctuate ?? true),
        diarize: String(options.diarize ?? false),
        sentiment: String(options.sentiment ?? false),
        summarize: String(options.summarize ?? false),
        detect_language: String(options.detect_language ?? false)
      });

      const response = await axios.post(
        `${this.config.baseURL}/listen?${params.toString()}`,
        { url: audioUrl },
        {
          headers: {
            'Authorization': `Token ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const latency = Date.now() - startTime;
      const result = response.data.results;
      const transcript = result.channels[0]?.alternatives[0]?.transcript || '';
      const confidence = result.channels[0]?.alternatives[0]?.confidence || 0;

      console.log(`[Deepgram] Transcribed ${transcript.length} characters in ${latency}ms`);

      return {
        transcript,
        confidence,
        latency,
        cost: 0, // Using free credits
        provider: 'deepgram',
        model,
        success: true,
        metadata: {
          words: result.channels[0]?.alternatives[0]?.words,
          channels: result.channels,
          sentiment: result.sentiment,
          summary: result.summary?.short
        }
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('[Deepgram] Transcription error:', error.response?.data || error.message);
      
      return {
        transcript: '',
        confidence: 0,
        latency,
        cost: 0,
        provider: 'deepgram',
        model,
        success: false
      };
    }
  }

  /**
   * Transcribe audio from buffer/file
   */
  async transcribeFromBuffer(
    audioBuffer: Buffer,
    mimeType: string,
    options: TranscriptionOptions = {}
  ): Promise<DeepgramResponse> {
    if (!this.isAvailable()) {
      throw new Error('Deepgram service not available');
    }

    const startTime = Date.now();
    const model = options.model || 'nova-2';

    try {
      const params = new URLSearchParams({
        model,
        language: options.language || 'en',
        punctuate: String(options.punctuate ?? true),
        diarize: String(options.diarize ?? false),
        sentiment: String(options.sentiment ?? false),
        summarize: String(options.summarize ?? false),
        detect_language: String(options.detect_language ?? false)
      });

      const response = await axios.post(
        `${this.config.baseURL}/listen?${params.toString()}`,
        audioBuffer,
        {
          headers: {
            'Authorization': `Token ${this.config.apiKey}`,
            'Content-Type': mimeType
          },
          timeout: 30000
        }
      );

      const latency = Date.now() - startTime;
      const result = response.data.results;
      const transcript = result.channels[0]?.alternatives[0]?.transcript || '';
      const confidence = result.channels[0]?.alternatives[0]?.confidence || 0;

      return {
        transcript,
        confidence,
        latency,
        cost: 0,
        provider: 'deepgram',
        model,
        success: true,
        metadata: {
          words: result.channels[0]?.alternatives[0]?.words,
          channels: result.channels,
          sentiment: result.sentiment,
          summary: result.summary?.short
        }
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('[Deepgram] Buffer transcription error:', error.response?.data || error.message);
      
      return {
        transcript: '',
        confidence: 0,
        latency,
        cost: 0,
        provider: 'deepgram',
        model,
        success: false
      };
    }
  }

  /**
   * Get real-time streaming capabilities info
   */
  getStreamingInfo() {
    return {
      supported: true,
      websocketURL: 'wss://api.deepgram.com/v1/listen',
      realTimeLatency: '<300ms',
      features: [
        'real_time_transcription',
        'live_punctuation',
        'speaker_detection',
        'interim_results',
        'end_of_speech_detection'
      ]
    };
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      provider: 'Deepgram',
      tier: 'free_credits',
      creditAmount: '$200',
      available: this.isAvailable(),
      models: this.config.models,
      capabilities: [
        'speech_to_text',
        'speaker_diarization',
        'sentiment_analysis',
        'summarization',
        'language_detection',
        'real_time_streaming',
        'high_accuracy',
        'domain_specific_models'
      ],
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'hi', 'ja', 'ko', 'zh'],
      accuracy: 'Industry leading (Nova-2 model)',
      specializations: [
        'general', 'meeting', 'phonecall', 'finance', 
        'conversational_ai', 'voicemail', 'video', 
        'medical', 'drivethru', 'automotive'
      ]
    };
  }
}

export const deepgramService = new DeepgramService();