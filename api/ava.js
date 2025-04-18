export default async function handler(req, res) {
  const replyMessage =
    process.env.REPLY_MESSAGE ||
    "Hi, thank you for calling United Liberty Insurance. How can I assist you today?";

  return res.status(200).json({ reply: replyMessage });
}
