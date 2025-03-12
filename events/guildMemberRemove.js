const { db } = require('../database/firebase');

module.exports = async (member) => {
   try {
      const userId = member.id;
      const userRef = db.collection('servers').doc(member.guild.id).collection('users').doc(userId);
      console.log(`User profile for ${member.user.username}#${member.user.discriminator} is retained even after they leave.`);
   } catch (error) {
      console.error('Error handling member leave:', error);
   }
}