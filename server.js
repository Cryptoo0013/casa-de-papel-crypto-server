const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Читаем ключи из переменных окружения
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const spreadsheetId = '1cF1EP1-HhBH_KoPZ2V4zVEkzXcXxVlmvJWlyTpf51Rw'; // <-- ID твоей таблицы

// Авторизация Google
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Маршрут для приёма данных
app.post('/submit', async (req, res) => {
  try {
    const { name, phone, contact } = req.body;
    const date = new Date().toLocaleString('ru-RU');

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Аркуш1!A:D', // <-- название листа
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[name, phone, contact, date]],
      },
    });

    res.status(200).send({ message: 'Данные успешно добавлены!' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Ошибка при записи в Google Sheets' });
  }
});

app.get('/', (req, res) => {
  res.send('Сервер работает!');
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
