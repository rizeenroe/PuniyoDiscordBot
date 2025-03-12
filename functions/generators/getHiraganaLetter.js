const db = require('../../database/firebase');
const randomNumber = require('../utils/randomNumber');
const axios = require("axios");

const getHiraganaLetter = async (client, channelId, serverId) => {
   const channel = await client.channels.fetch(channelId);
   try {
      const serverRef = db.collection('servers').doc(serverId);
      const response = await axios.get('https://zen-japanese-api.vercel.app/hiragana');
      const data = response.data;
      if (!data || data.hiragana.length === 0) {
            console.log('No data found');
            return;
      }
      const randomIndex = randomNumber(0, data.hiragana.length);
      const selectedHiragana = data.hiragana[randomIndex]
      await serverRef.update({
            hiraganaAnswer: selectedHiragana.roumaji 
      });
      console.log(`Hiragana answer: ${selectedHiragana.roumaji}`);
      
      await channel.send(`Guess what's the roumaji of ${selectedHiragana.kana}`);
   } catch (error) {
      console.error('Error in generateLetterHiraganaQuestion:', error);
   }
};
module.exports = { getHiraganaLetter };