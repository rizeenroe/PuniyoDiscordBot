const { SlashCommandBuilder } = require("discord.js");
const randomNumber = require("../functions/utils/randomNumber");

module.exports = {
   data: new SlashCommandBuilder()
      .setName("rolls")
      .setDescription("Rolls a random number within a specified range")
      .addIntegerOption(option =>
         option.setName("lowest")
            .setDescription("The lowest value of the range")
            .setRequired(false)
      )
      .addIntegerOption(option =>
         option.setName("highest")
            .setDescription("The highest value of the range")
            .setRequired(false)
      ),
   async execute(interaction) {
      const lowest = interaction.options.getInteger("lowest");
      const highest = interaction.options.getInteger("highest");

      if (lowest !== null && highest === null) {
         await interaction.reply("You must provide a 'highest' value if you specify a 'lowest' value.");
         return;
      }
      if (lowest !== null && highest !== null && lowest >= highest) {
         await interaction.reply("The 'lowest' value must be smaller than the 'highest' value.");
         return;
      }
      const random = randomNumber(lowest || 1, highest || 100);
      await interaction.reply(`You rolled: ${random}`);
   }
};
