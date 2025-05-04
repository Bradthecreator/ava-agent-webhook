export default async function handler(req, res) {
  try {
    res.status(200).send('✅ Ava webhook is working!');
  } catch (error) {
    console.error('❌ Ava handler error:', error);
    res.status(500).send('❌ Internal Server Error');
  }
}
