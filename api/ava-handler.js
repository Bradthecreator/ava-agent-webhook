import fetch from 'node-fetch';
import twilio from 'twilio';

const ELEVENLABS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Jessica Anne Bogart
const AVA_GREETING = 'Hi, this is Ava with United Liberty. How can I assist you today?';

export default async function handler(req, res) {
  const twiml = new twilio.twiml.VoiceResponse();

  try {
    const greetingAudio = await textToSpeech(AVA_GREETING);
    twiml.play(greetingAudio);
    twiml.start().stream({ url: process.env.AVA_STREAM_URL });

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  } catch (err) {
    console.error('Ava Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function textToSpeech(text) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY_PROD,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8,
      },
    }),
  });

  if (!response.ok) throw new Error('Failed to generate ElevenLabs audio');

  const audioBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');
  return `data:audio/mpeg;base64,${audioBase64}`;
}
