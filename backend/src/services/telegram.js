const axios = require("axios");
const FormData = require("form-data");

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!botToken || !chatId) {
  console.warn("Telegram not configured: missing token or chat id");
} else {
  const tokenTail = botToken.slice(-4);
  console.log(`Telegram configured: chatId=${chatId}, token=****${tokenTail}`);
}

const sendTelegramMessage = async (text) => {
  if (!botToken || !chatId) {
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await axios.post(url, {
    chat_id: chatId,
    text
  });
};

const sendTelegramPhoto = async (photoBuffer, caption) => {
  if (!botToken || !chatId || !photoBuffer) {
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("photo", photoBuffer, {
    filename: "tip.png",
    contentType: "image/png"
  });

  if (caption) {
    form.append("caption", caption);
  }

  await axios.post(url, form, { headers: form.getHeaders() });
};

module.exports = { sendTelegramMessage, sendTelegramPhoto };
