import fetch from 'node-fetch';
import { Twilio } from 'twilio';

const ELEVENLABS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Jessica Anne Bogart voice ID
const AVA_GREETING = 'Hi, this is Ava with United Liberty. How can I assist you today?';

export const config = {
  runtime: 'edge',
  regions: ['iad'],
};

export default async function handler(req) {
  const twiml = new Twilio.twiml.VoiceResponse();

  // Step 1: Generate greeting audio using ElevenLabs
  const greetingAudio = await textToSpeech(AVA_GREETING);

  // Step 2: Return TwiML response with the greeting and start streaming
  twiml.play(greetingAudio);
  twiml.start().stream({ url: process.env.AVA_STREAM_URL });

  return new Response(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
    status: 200,
  });
}

// Helper function: Convert text to audio using ElevenLabs
async function textToSpeech(text) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
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
