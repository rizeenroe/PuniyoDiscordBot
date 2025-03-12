const { EmbedBuilder } = require('discord.js');
const db = require('../../database/firebase');

const mangaLeaderboardUpdater = async (serverId, client) => {
   console.log(`manga leaderboard update just ran`);

   try {
      const serverDocRef = db.collection("servers").doc(serverId);
      const serverDoc = await serverDocRef.get();
      const mangasRef = serverDocRef.collection("mangas");
      const mangasSnapshot = await mangasRef.get();

      if (!serverDoc.exists) {
         console.error(`Server document not found for guildId: ${serverId}`);
         return;
      }

      const { mangaLeaderboardChannelId, mangaLeaderboardMessageId } = serverDoc.data();
      if (!mangaLeaderboardChannelId) {
         console.error(`mangaLeaderboardChannelId not set for guildId: ${serverId}`);
         return;
      }

      if (mangasSnapshot.empty) {
         console.log(`No mangas found for guildId: ${serverId}`);
         return;
      }

      const eligibleMangas = mangasSnapshot.docs
         .map(doc => ({ id: doc.id, ...doc.data() }))
         .filter(manga => manga.totalReviews && manga.totalReviews >= 2)  
         .sort((a, b) => b.totalRating - a.totalRating);

      const embed = new EmbedBuilder()
         .setTitle("📖 Manga Leaderboard 📖")
         .setColor("#FFD700")
         .setDescription(
            eligibleMangas.length === 0
                  ? 'No mangas meet the required review count (2). Please post more reviews!'
                  : eligibleMangas.map((manga, index) =>
                     `**${index + 1}. [${manga.title}](https://mangadex.org/title/${manga.id})**⭐ **${manga.totalRating}/10**`
                  ).join("\n")
         )
         .setFooter({ text: "Updated every minute ⏳" })
         .setTimestamp();
      const channel = await client.channels.fetch(mangaLeaderboardChannelId);
      if (!channel) {
         console.error(`Leaderboard channel not found for ID: ${mangaLeaderboardChannelId}`);
         return;
      }

      if (mangaLeaderboardMessageId) {
         try {
            const leaderboardMessage = await channel.messages.fetch(mangaLeaderboardMessageId);
            await leaderboardMessage.edit({ embeds: [embed] });
            console.log(`Leaderboard updated successfully.`);
         } catch (error) {
            console.warn(`Could not edit existing leaderboard message, sending a new one.`);
            const newMessage = await channel.send({ embeds: [embed] });
            await serverDocRef.update({ mangaLeaderboardMessageId: newMessage.id });
         }
      } else {
         const newMessage = await channel.send({ embeds: [embed] });
         await serverDocRef.update({ mangaLeaderboardMessageId: newMessage.id }); 
         console.log(`New leaderboard message sent.`);
      }

   } catch (error) {
         console.error("Error updating manga leaderboard:", error);
   }
};
module.exports = { mangaLeaderboardUpdater };