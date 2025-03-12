const { SlashCommandBuilder } = require("discord.js");
const db = require("../database/firebase");

module.exports = {
   data: new SlashCommandBuilder()
      .setName('serversetup')
      .setDescription('Use this command to set up the channels, time, etc'),

   async execute(interaction){
      console.log("server setup is starting");
      const serverId = interaction.guildId;
      const serverRef = db.collection('servers').doc(serverId);
      const serverDoc = await serverRef.get();
   
      if (serverDoc.exists) { 
         await interaction.channel.send('This server is already registered. Do you want to reassign the channels? (yes/no)');
         const shouldReassign = await askYesNo(interaction);
         if (!shouldReassign) {
            await interaction.channel.send('Setup cancelled.');
            return;
         }
      }

      if (!interaction.channel) {
         console.log('No valid channel to send messages.');
         return; 
      }   
      
      await interaction.reply(`${serverId} is the server id`);
      await interaction.channel.send('tell me what channel is for manga leaderboard of the server.')
      const mangaLeaderboardChannelId = await askAndWaitForChannel(interaction);
      await interaction.channel.send('tell me what channel is for user leaderboard of the server.')
      const userLeaderboardChannelId = await askAndWaitForChannel(interaction);
      await interaction.channel.send('tell me what channel is for birthday of the server.')
      const askBirhtdayChannel = await askAndWaitForChannel(interaction);
      await interaction.channel.send('tell me what channel is for asking hiragana letters.')
      const askHiraganaChannel = await askAndWaitForChannel(interaction);
      await interaction.channel.send('tell me what channel is for asking katakana letters.')
      const askKatakanaChannel = await askAndWaitForChannel(interaction);
      await interaction.channel.send('tell me what channel is for asking kanji letters.')
      const askKanjiChannel = await askAndWaitForChannel(interaction);

      await serverRef.set({
         serverId: serverId,
         mangaLeaderboardChannelId: mangaLeaderboardChannelId,
         userLeaderboardChannelId: userLeaderboardChannelId,
         birthdayChannelId: askBirhtdayChannel,
         askHiraganaChannel: askHiraganaChannel,
         askKatakanaChannel: askKatakanaChannel,
         askKanjiChannel: askKanjiChannel,
         createdAt: admin.firestore.FieldValue.serverTimestamp(),
         hiraganaAnswer: null,
         katakanaAnswer: null,
         kanjiAnswer: []
      });

      await interaction.channel.send('Server SetUp is complete, enjoy.')
   }

}

