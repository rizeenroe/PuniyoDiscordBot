const { SlashCommandBuilder } = require("discord.js");
const { getManga } = require("../functions/generators/getManga")

module.exports = {
   data: new SlashCommandBuilder()
      .setName("random")
      .setDescription("returns a random manga"),
   async execute(interaction){
      getManga(interaction);
   }
}