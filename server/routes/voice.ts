import { Router } from 'express';
import axios from 'axios';

const router = Router();

// ElevenLabs voice synthesis endpoint
router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice = 'Rachel' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      // Fallback message for missing API key
      return res.status(503).json({ 
        error: 'Voice synthesis temporarily unavailable',
        fallback: true 
      });
    }

    // ElevenLabs voice IDs - using high-quality voices
    const voiceIds = {
      'Rachel': '21m00Tcm4TlvDq8ikWAM', // Natural, warm female voice
      'Drew': '29vD33N1CtxCmqQRPOHJ',   // Professional male voice
      'Clyde': '2EiwWnXFnvU5JabPnv8n',  // Middle-aged male
      'Dave': 'CYw3kZ02Hs0563khs1Fj',   // Conversational male
      'Fin': 'D38z5RcWu1voky8WS1ja',    // Young adult male
      'Sarah': 'EXAVITQu4vr4xnSDxMaL',  // Soft female voice
      'Antoni': 'ErXwobaYiN019PkySvjV', // Confident male
      'Thomas': 'GBv7mTt0atIp3Br8iCZE', // Calm narrator
      'Emily': 'LcfcDJNUP1GQjkzn1xUU',  // Friendly female
      'Elli': 'MF3mGyEYCl7XYWbV9V6O',   // Young female
      'Callum': 'N2lVS1w4EtoT3dr4eOWO', // Hoarse male
      'Patrick': 'ODq5zmih8GrVes37Dizd', // Pleasant male
      'Harry': 'SOYHLrjzK2X1ezoPC6cr',  // Elderly male
      'Liam': 'TX3LPaxmHKxFdv7VOQHJ',   // Young male
      'Dorothy': 'ThT5KcBeYPX3keUQqHPh' // Pleasant female
    };

    const voiceId = voiceIds[voice as keyof typeof voiceIds] || voiceIds.Rachel;

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    // Set appropriate headers for audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.data.length.toString(),
      'Accept-Ranges': 'bytes'
    });

    res.send(Buffer.from(response.data));

  } catch (error) {
    console.error('ElevenLabs API error:', error);
    
    // Return error response but don't crash
    res.status(500).json({ 
      error: 'Voice synthesis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    });
  }
});

// Voice configuration endpoint
router.get('/voices', (req, res) => {
  const availableVoices = [
    { id: 'Rachel', name: 'Rachel', description: 'Natural, warm female voice' },
    { id: 'Drew', name: 'Drew', description: 'Professional male voice' },
    { id: 'Clyde', name: 'Clyde', description: 'Middle-aged male' },
    { id: 'Dave', name: 'Dave', description: 'Conversational male' },
    { id: 'Sarah', name: 'Sarah', description: 'Soft female voice' },
    { id: 'Antoni', name: 'Antoni', description: 'Confident male' },
    { id: 'Emily', name: 'Emily', description: 'Friendly female' },
    { id: 'Thomas', name: 'Thomas', description: 'Calm narrator' }
  ];

  res.json({ 
    voices: availableVoices,
    default: 'Rachel'
  });
});

export default router;