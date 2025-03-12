const { SlashCommandBuilder } = require("discord.js");
const db = require("../database/firebase");

module.exports = {
   data: new SlashCommandBuilder()
      .setName('addbirthday')
      .setDescription('Add a user in the birthday list')
      .addStringOption(option =>
         option.setName('user')
               .setDescription('Mention the user you want to add on the birthday list.')
               .setRequired(true)
      )
      .addStringOption(option => 
         option.setName('month')
               .setDescription('Enter the Birth Month')
               .setRequired(true)
      )
      .addStringOption(option => 
         option.setName('date')
               .setDescription('Enter the Birth Date')
               .setRequired(true)
      )
      .addStringOption(option => 
         option.setName('year')
               .setDescription('Enter the birth year')
               .setRequired(true)
      ),
   
      async execute(interaction){
         await interaction.deferReply();
         await new Promise(resolve => setTimeout(resolve, 1000));
      
         const birthdayUser = interaction.options.getString('user').substring(2, 20);
         console.log(`User ID: ${birthdayUser}`);
         let member;
         try {
             member = await interaction.guild.members.fetch(birthdayUser);
             console.log(`User found: ${member.user.tag}`);
         } catch {
             console.log("User not found in server.");
         }
         const month = parseInt(interaction.options.getString('month'));
         const date = parseInt(interaction.options.getString('date'));
         const year = parseInt(interaction.options.getString('year'));
      
         if (isNaN(month) || isNaN(date) || isNaN(year)) {
             return interaction.followUp("Please provide a valid birthday in the format MM/DD/YYYY.");
         }
      
         const serverId = interaction.guildId;
         const birthdaysRef = db.collection("servers").doc(serverId).collection("birthdays");
         const usersRef = db.collection("servers").doc(serverId).collection("users");
      
         try {
            const userDoc = await usersRef.doc(birthdayUser).get();
            let userData = userDoc.exists ? userDoc.data() : {};
            const username = member?.user.globalName || birthdayUser;
            if (!userData.username) userData.username = username;
            if (!userData.dateJoined) userData.dateJoined = new Date().toISOString();
            await usersRef.doc(birthdayUser).set(userData, { merge: true });
            await birthdaysRef.doc(birthdayUser).set({
                username: username,
                month: month,
                day: date,
                year: year,
                addedBy: interaction.user.username,
                dateAdded: new Date().toISOString()
            });
      
            const message = `🎉 Successfully added **${username}**'s birthday!\n
                             📅 **Date:** ${month}/${date}/${year}\n
                             🛠️ **Added by:** ${interaction.user.username}`;
      
            const embed = await embedText(message, interaction, false);
            await interaction.followUp({ embeds: [embed] });
         } catch (error) {
            console.error('Error processing birthday:', error);
            interaction.followUp("There was an error adding the birthday. Please try again later.");
         }
      }
}
