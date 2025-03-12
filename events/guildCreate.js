const { db } = require('../database/firebase');

module.exports = async (member) => {
   try {
      const serverRef = db.collection('servers').doc(member.guild.id);

      await serverRef.collection('users').doc('_init').set({ initialized: true });
      await serverRef.collection('mangas').doc('_init').set({ initialized: true });
      await serverRef.collection('birthdays').doc('_init').set({ initialized: true });

      console.log(`Created users, mangas, and birthdays collections for server: ${member.guild.name}`);

      if (!member.user.bot) {
         try {
               const userRef = serverRef.collection('users').doc(member.id);
               await userRef.set({
                  username: member.user.username,
                  discriminator: member.user.discriminator,
                  joinDate: member.joinedAt,
                  hiraganaCurrentStreak: 0,
                  katakanaCurrentStreak: 0,
                  kanjiCurrentStreak: 0,
                  hiraganaLongestStreak: 0,
                  katakanaLongestStreak: 0,
                  kanjiLongestStreak: 0,
                  hiraganaPoints: 0,
                  katakanaPoints: 0,
                  kanjiPoints: 0,
                  hiraganaAnswered: false,
                  katakanaAnswered: false,
                  kanjiAnswered: false 
               });
               console.log(`Stored user ${member.user.username} in Firestore`);
         } catch (userError) {
               console.error(`Error storing user ${member.user.username}:`, userError);
         }
      }
   } catch (error) {
       console.error('Error adding new member to Firestore:', error);
   }
};