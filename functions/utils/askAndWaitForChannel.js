const askAndWaitForChannel = async (interaction, varName) => {
   try {
       const filter = (msg) => msg.author.id === interaction.user.id && msg.mentions.channels.size > 0;
       const collected = await interaction.channel.awaitMessages({
           filter,
           max: 1,
           time: 30000,
           errors: ['time']
       });

       const channel = collected.first().mentions.channels.first();

       if (channel) {
           console.log(`Channel ID for ${varName}: ${channel.id}`);
           return channel.id;
       } else {
           await interaction.channel.send('Please mention a valid channel. Try again.');
           return null;
       }
   } catch (error) {
       await interaction.channel.send('No response received. Setup timed out.');
       return null;
   }
};
module.exports = askAndWaitForChannel;