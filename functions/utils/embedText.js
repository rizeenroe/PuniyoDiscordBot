const { EmbedBuilder } = require("discord.js");

const embedText = async (message, interaction, image) => {

   let embed = new EmbedBuilder()
       .setColor(0x0099ff)
       .setDescription(message)
       .setTimestamp();

   if (image) {
       embed.setImage(image);
   }

   if (interaction) {
       embed.setAuthor({
           name: interaction.user.globalName || interaction.user.username,
           iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 128 })
       });
   }

   return embed;
};
module.exports = embedText;