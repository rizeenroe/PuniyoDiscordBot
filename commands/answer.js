const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const db = require("../database/firebase");
const embedText = require("../functions/utils/embedText");
const answerHandler = require("../functions/utils/answerHandler");

module.exports = {
   data: new SlashCommandBuilder()
      .setName('answer')
      .setDescription('Use this command to asnwer for letter questions only (may change in the future)')
      .addStringOption(option =>
         option.setName('answer')
            .setDescription('Put your answer here')
            .setRequired(true)
      ),
   
   async execute(interaction){
      await interaction.deferReply();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const answer = interaction.options.getString('answer');
      const channelId = interaction.channelId;
      const userId = interaction.user.id;
      
      //checking for user in the users collection
      const subcollectionRef = db.collection("servers").doc(interaction.guildId).collection("users");
      const userCollectionRef = subcollectionRef.doc(userId);
      
      
      try {
         const userDoc = await userCollectionRef.get();
         const userData = userDoc.exists ? userDoc.data() : {}; ;
         const serversRef = db.collection('servers');
         const serverDoc = await serversRef.doc(interaction.guildId).get();
         
         if (serverDoc.exists) {
            const data = serverDoc.data();
            if ((channelId === data.askHiraganaChannel && userData.hiraganaAnswered) || 
               (channelId === data.askKatakanaChannel && userData.katakanaAnswered) || 
               (channelId === data.askKanjiChannel && userData.kanjiAnswered)) {
               const embed = await embedText("You have already answered this question!", interaction, false);
               await interaction.followUp({ embeds: [embed] });
               return;
            }

            const askHiraganaChannel = data.askHiraganaChannel;
            const askKatakanaChannel = data.askKatakanaChannel;
            const askKanjiChannel = data.askKanjiChannel;

            if (channelId === askHiraganaChannel) {
               if (answer.toLowerCase() === data.hiraganaAnswer) {
                     const message = await answerHandler(userId, userCollectionRef, interaction, 'hiragana');
                     const embed = await embedText(message, interaction, false);
                     await interaction.followUp({ embeds: [embed] });
               } else {
                     await userCollectionRef.update({
                        hiraganaCurrentStreak: 0
                     }, { merge: true });
                     const embed = await embedText("Try Again!", interaction, false);
                     await interaction.followUp({ embeds: [embed] });
               }
            } else if (channelId === askKatakanaChannel) {
               if (answer.toLowerCase() === data.katakanaAnswer) {
                     const message = await answerHandler(userId, userCollectionRef, interaction, 'katakana');
                     const embed = await embedText(message, interaction, false);
                     await interaction.followUp({ embeds: [embed] });
               } else {
                     await userCollectionRef.update({
                        katakanaCurrentStreak: 0
                     }, { merge: true });
                     const embed = await embedText("Try Again!", interaction, false);
                     await interaction.followUp({ embeds: [embed] });
               }
            } else if (channelId === askKanjiChannel) {
               if (data.kanjiAnswer.some(meaning => answer.toLowerCase() === meaning.toLowerCase())) {
                     await userCollectionRef.update({
                        kanjiCurrentStreak: 0
                     }, { merge: true });
                     const message = await answerHandler(userId, userCollectionRef, interaction, 'kanji');
                     const embed = await embedText(message, interaction, false);
                     await interaction.followUp({ embeds: [embed] });
               } else {
                     const embed = await embedText("Try Again!", interaction, false);
                     await interaction.followUp({ embeds: [embed] });
               }
            } else {
               const embed = await embedText("This channel is not set up for the quiz.", interaction, false);
               await interaction.followUp({ embeds: [embed] });
            }
         } else {
            console.log(`No document found in server ID`);
            const embed = await embedText("Server data not found.", interaction, false);
            await interaction.followUp({ embeds: [embed] });
         }
      } catch (error) {
         console.error('Error fetching data from Firestore:', error);
         const embed = await embedText("There was an error processing your answer.", interaction, false);
         await interaction.followUp({ embeds: [embed] });
      }
   }
};