import fetch from 'node-fetch';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req, res) {
  try {
    const { audioUrl } = req.body;
    if (!audioUrl) return res.status(400).json({ error: 'Missing audioUrl' });

    // Step 1: Download Twilio audio
    const audioResponse = await fetch(audioUrl + '.mp3');
    const audioBuffer = await audioResponse.arrayBuffer();

    // Step 2: Transcribe with Whisper
    const formData = new FormData();
    formData.append('file', Buffer.from(audioBuffer), 'audio.mp3');
    formData.append('model', 'whisper-1');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const whisperData = await whisperResponse.json();
    console.log('Whisper transcript:', transcript);

    console.log('Caller said:', transcript);

    // Step 3: Send to GPT-4
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are Ava, a friendly and helpful insurance assistant for United Liberty Insurance Agency. Be professional and concise, and help the caller with their insurance question.' },
          { role: 'user', content: transcript },
        ],
      }),
    });

    const gptData = await gptResponse.json();

if (!gptData.choices || !gptData.choices[0]) {
  throw new Error('GPT did not return a valid response.');
}

const replyText = gptData.choices[0].message.content;

    console.log('Ava says:', replyText);

    // Step 4: Use ElevenLabs to generate voice
    const elevenResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL/stream', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: replyText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
        },
      }),
    });

    const speechAudio = await elevenResponse.arrayBuffer();

    // Step 5: Return voice to Twilio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(speechAudio));
  } catch (err) {
   console.error('Ava Error:', err.message);
res.status(500).json({ error: err.message });
  }
}

