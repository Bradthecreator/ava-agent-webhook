export default function handler(req, res) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Stream url="wss://YOUR_NGROK_WSS_URL_HERE" />
  </Start>
  <Say voice="Polly.Joanna">Hi, this is Ava with United Liberty. How can I assist you today?</Say>
  <Pause length="60" />
</Response>`;

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml);
}
