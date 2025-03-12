const { EmbedBuilder } = require('discord.js');
const db = require('../../database/firebase');

const updateBirthdayList = async (serverId, client) => {
   console.log(`Birthday list update just ran for server: ${serverId}`);
   
           try {
               const serverDocRef = db.collection("servers").doc(serverId);
               const birthdaysRef = serverDocRef.collection("birthdays");
               const birthdaysSnapshot = await birthdaysRef.get();
   
               if (birthdaysSnapshot.empty) {
                   console.log(`No birthdays found for guildId: ${serverId}`);
                   return;
               }
   
               const today = new Date();
               const todayMonth = today.getMonth() + 1;
               const todayDay = today.getDate();
   
               let birthdayList = birthdaysSnapshot.docs.map(doc => doc.data());
   
               // Filter for today's birthdays
               const todaysBirthdays = birthdayList.filter(user => 
                   user.month === todayMonth && user.day === todayDay
               );
   
               // Find the last birthday that happened
               const pastBirthdays = birthdayList.filter(user => 
                   (user.month < todayMonth) || 
                   (user.month === todayMonth && user.day < todayDay)
               );
   
               let lastBirthday = pastBirthdays.length > 0 
                   ? pastBirthdays.sort((a, b) => {
                       if (a.month === b.month) return b.day - a.day;
                       return b.month - a.month;
                   })[0] 
                   : null;
   
               const embed = new EmbedBuilder()
                   .setTitle("🎉 Today's Birthdays & Last Birthday 🎂")
                   .setColor("#FF69B4")
                   .setDescription(
                       todaysBirthdays.length === 0 && !lastBirthday
                           ? "No birthdays today! Add some with `/addbirthday`! 🎂"
                           : `${todaysBirthdays.length > 0 ? "**🎈 Today's Birthdays:**\n" + todaysBirthdays.map(user => `**${user.username}** - ${user.month}/${user.day}`).join("\n") : ""}` +
                           `${lastBirthday ? `\n\n🎊 **Last Birthday:**\n**${lastBirthday.username}** - ${lastBirthday.month}/${lastBirthday.day}` : ""}`
                   )
                   .setFooter({ text: "Updated daily at midnight ⏳" })
                   .setTimestamp();
   
               const serverData = await serverDocRef.get();
               const { birthdayChannelId, birthdayMessageId } = serverData.data();
   
               if (!birthdayChannelId) {
                   console.error(`birthdayChannelId not set for guildId: ${serverId}`);
                   return;
               }
   
               const channel = await client.channels.fetch(birthdayChannelId);
               if (!channel) {
                   console.error(`Birthday channel not found for ID: ${birthdayChannelId}`);
                   return;
               }
   
               if (birthdayMessageId) {
                   try {
                       const birthdayMessage = await channel.messages.fetch(birthdayMessageId);
                       await birthdayMessage.edit({ embeds: [embed] });
                       console.log(`Birthday list updated successfully.`);
                   } catch (error) {
                       console.warn(`Could not edit existing birthday message, sending a new one.`);
                       const newMessage = await channel.send({ embeds: [embed] });
                       await serverDocRef.update({ birthdayMessageId: newMessage.id });
                   }
               } else {
                   const newMessage = await channel.send({ embeds: [embed] });
                   await serverDocRef.update({ birthdayMessageId: newMessage.id });
                   console.log(`New birthday message sent.`);
               }
   
           } catch (error) {
               console.error("Error updating birthday list:", error);
           }
};

module.exports = { updateBirthdayList };
