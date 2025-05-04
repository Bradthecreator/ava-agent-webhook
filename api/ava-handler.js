import { Readable } from 'stream';
import axios from 'axios';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Jessica Anne Bogart

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return res.status(500).send('Error parsing form data');
    }

    const audioFile = files.file;
    if (!audioFile) {
      return res.status(400).send('No audio file uploaded');
    }

    try {
      // Transcribe audio with Whisper
      const transcript = await transcribeWithWhisper(audioFile);
      console.log('📝 Transcript:', transcript);

      if (!transcript || !transcript.trim()) {
        const reply = await speak('Sorry, I didn’t catch that. Could you say it again?');
        return sendAudio(reply, res);
      }

      // Get GPT reply
      const gptReply = await askGPT(transcript);
      console.log('💬 GPT:', gptReply);

      const replyAudio = await speak(gptReply);
      return sendAudio(replyAudio, res);
    } catch (error) {
      console.error('❌ Processing failed:', error.message);
      return res.status(500).send('Agent error');
    }
  });
}

// Whisper Transcription
async function transcribeWithWhisper(file) {
  const formData = new FormData();
  formData.append('file', file.filepath ? createReadStream(file.filepath) : file, file.originalFilename || 'audio.wav');
  formData.append('model', 'whisper-1');

  const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      ...formData.getHeaders(),
    },
  });

  return response.data.text;
}

// GPT Chat
async function askGPT(prompt) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are Ava, a helpful, friendly insurance assistant at United Liberty. Answer clearly and helpfully.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.choices[0].message.content;
}

// ElevenLabs TTS
async function speak(text) {
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
    {
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8,
      },
    },
    {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    }
  );

  return response.data;
}

// Send audio buffer to caller
function sendAudio(audioBuffer, res) {
  res.setHeader('Content-Type', 'audio/mpeg');
  res.status(200).send(audioBuffer);
}
