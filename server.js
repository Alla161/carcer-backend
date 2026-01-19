import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config';

const app = express();

// Разрешаем запросы с твоего фронта (локально и, при желании, прод-урл)
app.use(cors({
  origin: ['http://localhost:5174'], // сюда потом можно добавить прод-URL фронта
}));

app.use(bodyParser.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const userChats = new Map();

app.post(`/api/telegram/${TELEGRAM_TOKEN}`, async (req, res) => {
  const update = req.body;
  const message = update.message || update.edited_message;

  if (!message) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text || '';

  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    const payload = parts[1];

    if (payload && payload.startsWith('connect_')) {
      const userId = payload.replace('connect_', '');
      userChats.set(userId, chatId);

      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: 'CarCer: Telegram подключен, будем присылать напоминания о ТО.',
      });
    } else {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: 'Привет! Открой приложение CarCer и подключи Telegram через настройки.',
      });
    }
  }

  res.sendStatus(200);
});

app.post('/api/notify-telegram', async (req, res) => {
  const { userId, text } = req.body;

  const chatId = userChats.get(userId);
  if (!chatId) {
    return res.status(400).json({ error: 'Нет сохранённого chat_id для этого пользователя' });
  }

  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text,
  });

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CarCer backend started on port ${PORT}`);
});