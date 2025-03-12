const { SlashCommandBuilder } = require("discord.js");
const randomNumber = require("../functions/utils/randomNumber");

module.exports = {
   data: new SlashCommandBuilder()
      .setName("flip")
      .setDescription('heads or tails'),
   async execute(interaction){
      const flipResult = randomNumber(0, 1) === 0 ? 'Heads' : 'Tails';
      await interaction.reply(`You flipped: ${flipResult}`);
   }
}