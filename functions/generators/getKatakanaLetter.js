const db = require('../../database/firebase');
const randomNumber = require('../utils/randomNumber');
const axios = require("axios");

const getKatakanaLetter = async (client, channelId, serverId) => {
    const channel = await client.channels.fetch(channelId);
    try {
        const serverRef = db.collection('servers').doc(serverId);
        const response = await axios.get("https://zen-japanese-api.vercel.app/katakana");
        const data = response.data;
        if (!data || (data.katakana && data.katakana.length === 0)) {
            console.log('no data found');
            return;
        }
        const randomIndex = randomNumber(0, data.katakana.length);
        const selectedKatakana = data.katakana[randomIndex];
        await serverRef.update({
            katakanaAnswer: selectedKatakana.roumaji 
        });
        console.log(`Katakana Answer: ${selectedKatakana.roumaji}`);
        
        await channel.send(`Guess what's the roumaji of ${selectedKatakana.kana}`);
    } catch (error) {
        console.error(error);
    }
};
module.exports = { getKatakanaLetter };