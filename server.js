const express = require('express');
require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://192.168.0.29:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


async function writeToGoogleSheets(formData) {
    try {
        console.log('Записываем данные в Google Sheets:', formData);
        
        const serviceAccountAuth = new JWT({
            email: process.env.SERVICE_ACCOUNT_EMAIL,
            key: process.env.PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);
        await doc.loadInfo();

        let sheet = doc.sheetsByIndex[0];
        if (!sheet) {
            sheet = await doc.addSheet({ title: 'Данные формы' });
        }

        await sheet.loadHeaderRow();

        // Обновляем заголовки
        // if (!sheet.headerValues || sheet.headerValues.length === 0 || sheet.headerValues[0] === '') {
        //     await sheet.setHeaderRow(['Имя', 'Номер телефона', 'Telegram / email']);
        //     await sheet.loadHeaderRow();
        // }

        // Подготавливаем данные для записи
        const rowData = {
            'Имя': formData.name || '',
            'Номер телефона': `'` + formData.phone || '',
            'Telegram / email': formData.contact || ''
        };
        
        console.log('Записываем строку:', rowData);

        // Добавляем новую строку с данными
        await sheet.addRow(rowData);

        console.log('Данные успешно записаны в Google Sheets');
        return true;

    } catch (error) {
        console.error('Ошибка записи в Google Sheets:', error);
        throw error;
    }
}

// API endpoint для отправки формы
app.post('/api/submit', async (req, res) => {
    try {
        const { name, phone, contact, telegram } = req.body;
        
        console.log('Получены данные:', req.body);
        
        const phoneNumber = phone || req.body.telephone || '';
        const contactInfo = contact || telegram || req.body.telegram || '';
        
        // Валидация данных
        if (!name || !phoneNumber || !contactInfo) {
            console.log('Валидация не прошла:', { name, phoneNumber, contactInfo });
            return res.status(400).json({ 
                error: 'Все поля обязательны для заполнения',
                success: false,
                received: { name, phone: phoneNumber, contact: contactInfo }
            });
        }

        const formData = { 
            name: name.trim(), 
            phone: phoneNumber.trim(), 
            contact: contactInfo.trim() 
        };
        
        console.log('Обработанные данные формы:', formData);
        
        // Записываем в Google Sheets
        await writeToGoogleSheets(formData);
        
        res.json({ 
            success: true, 
            message: 'Данные успешно сохранены!' 
        });
        
    } catch (error) {
        console.error('Ошибка обработки формы:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера: ' + error.message,
            success: false 
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
