const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const FormData = require('form-data');
const fs = require('fs');

const LINE_NOTIFY_API = 'https://notify-api.line.me/api/notify';

exports.sendLineNotification = async (message, imagePath = null) => {
    try {
        // 1. Get Token from Database
        const settings = await prisma.settings.findFirst();
        if (!settings || !settings.lineNotifyToken) {
            console.log('Skipping LINE Notify: No token found.');
            return;
        }

        const token = settings.lineNotifyToken;

        // 2. Prepare Payload
        const formData = new FormData();
        formData.append('message', message);

        if (imagePath && fs.existsSync(imagePath)) {
            formData.append('imageFile', fs.createReadStream(imagePath));
        }

        // 3. Send Request
        await axios.post(LINE_NOTIFY_API, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
            }
        });

        console.log('LINE Note sent successfully');

    } catch (error) {
        console.error('Failed to send LINE notification:', error.response?.data || error.message);
    }
};
