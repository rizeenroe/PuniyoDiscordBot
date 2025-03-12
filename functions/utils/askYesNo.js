const askYesNo = async (interaction) => {
   try {
       const filter = (msg) => msg.author.id === interaction.user.id && ['yes', 'no'].includes(msg.content.toLowerCase());
       const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });

       return collected.first().content.toLowerCase() === 'yes';
   } catch (error) {
       await interaction.channel.send('No response received. Try Again.');
       return false;
   }
};
module.exports = askYesNo;