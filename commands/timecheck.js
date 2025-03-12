const { SlashCommandBuilder } = require("discord.js");
const timeCheck = require("../functions/utils/timeCheck");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timecheck")
        .setDescription("Replies with the current time."),
    
    async execute(interaction) {
        await interaction.reply(`${timeCheck()}`);
    }
};
