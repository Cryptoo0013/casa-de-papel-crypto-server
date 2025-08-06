const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Разрешаем CORS для всех доменов (можно ограничить при необходимости)
app.use(cors());
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

// Лог для старта
console.log("Сервер запущен и готов принимать запросы...");

// Маршрут для приёма данных
app.post('/submit', async (req, res) => {
  try {
    console.log("Получен запрос:", req.body);

    const { name, phone, contact } = req.body;
    if (!name || !phone || !contact) {
      console.log("Ошибка: пустые поля");
      return res.status(400).send({ error: 'Все поля обязательны для заполнения' });
    }

    const date = new Date().toLocaleString('ru-RU');

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Аркуш1!A:D', // <-- название листа
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[name, phone, contact, date]],
      },
    });

    console.log("Данные успешно добавлены:", [name, phone, contact, date]);
    res.status(200).send({ success: true, message: 'Данные успешно добавлены!' });

  } catch (error) {
    console.error("Ошибка при записи в Google Sheets:", error);
    res.status(500).send({ success: false, error: 'Ошибка при записи в Google Sheets' });
  }
});

// Проверочный маршрут
app.get('/', (req, res) => {
  res.send('Сервер работает!');
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
