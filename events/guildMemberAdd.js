const { db } = require('../database/firebase');

module.exports = async (member) => {
   try {
      await serverRef.collection('users').doc('_init').set({ initialized: true });
      await serverRef.collection('mangas').doc('_init').set({ initialized: true });
      
      const userId = member.id;
      const discriminator = member.user.discriminator;
      const userRef = db.collection('servers').doc(member.guild.id).collection('users').doc(userId);
      
      const userDoc = await userRef.get();
      if (userDoc.exists) {
         console.log(`User profile for ${member.user.username}#${discriminator} already exists.`);
      } else {
         console.log(`Creating profile for ${member.user.username}#${discriminator}.`);
         await userRef.set({
            username: member.user.username,
            discriminator: discriminator,
            id: userId, 
            joinedAt: member.joinedAt,
         });
      }
   } catch (error) {
   console.error('Error adding new member to Firestore:', error);
   }
}