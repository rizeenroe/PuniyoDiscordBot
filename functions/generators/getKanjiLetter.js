const db = require('../../database/firebase');
const randomNumber = require('../utils/randomNumber');
const axios = require("axios");


const getKanjiLetter = async (client, channelId, serverId) => {
    const channel = await client.channels.fetch(channelId);
    const kanjiEndpoints = ['jouyou', 'kyouiku', 'wanikani'];
    const kanjiUrl = `https://zen-japanese-api.vercel.app/kanji/${kanjiEndpoints[randomNumber(0, kanjiEndpoints.length)]}`;
    console.log('Kanji API URL:', kanjiUrl);
    try {
        const serverRef = db.collection('servers').doc(serverId);
        const response = await axios.get(kanjiUrl);
        const data = response.data;
        if (!data || (data.kanji && data.kanji.length === 0)) {
            console.log('No data found');
            return;
        }
        const randomIndex = randomNumber(0, Object.keys(data.kanji).length - 1);
        const selectedKanji = Object.keys(data.kanji)[randomIndex];
        await serverRef.update({
            kanjiAnswer: data.kanji[selectedKanji].meanings
        });
        console.log("Answer for kanji is:", data.kanji[selectedKanji].meanings);
        await channel.send(`Guess what's the meaning of ${selectedKanji}`);
    } catch (error) {
        console.error('Error in generateLetterKanjiQuestion:', error);
    }
};
module.exports = { getKanjiLetter };