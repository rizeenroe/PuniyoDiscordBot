const { mangaLeaderboardUpdater } = require("../updaters/mangaLeaderboardUpdater");
const { updateBirthdayList } = require("../updaters/birthdayListUpdater");
const { getHiraganaLetter } = require("../generators/getHiraganaLetter");
const { getKatakanaLetter } = require("../generators/getKatakanaLetter");
const { getKanjiLetter } = require("../generators/getKanjiLetter");
const db = require('../../database/firebase');

const checkCodeMinute = async (client) => {  
   console.log("Every minute code has run");

   for (const guild of client.guilds.cache.values()) {
      const serverId = guild.id;

      try {
         // Call updates
         await mangaLeaderboardUpdater(serverId, client);
         await updateBirthdayList(serverId, client);

         const subcollectionRef = db.collection("servers").doc(serverId).collection("users");
         const snapshot = await subcollectionRef.get();
         if (!snapshot.empty) {
            const batch = db.batch();
            snapshot.forEach((doc) => {
               const userDocRef = subcollectionRef.doc(doc.id);
               batch.update(userDocRef, {
                  hiraganaAnswered: false,
                  katakanaAnswered: false,
                  kanjiAnswered: false
               });
            });

            await batch.commit();
            console.log(`Reset answered fields for users in server ${serverId}`);
         }

         const serverDocRef = db.collection("servers").doc(serverId);
         const serverDoc = await serverDocRef.get();

         if (serverDoc.exists) {
            const data = serverDoc.data();
            const askHiraganaChannel = data.askHiraganaChannel;
            const askKatakanaChannel = data.askKatakanaChannel;
            const askKanjiChannel = data.askKanjiChannel;

            await Promise.all([ 
               getHiraganaLetter(client, askHiraganaChannel, serverId),
               getKatakanaLetter(client, askKatakanaChannel, serverId),
               getKanjiLetter(client, askKanjiChannel, serverId)
            ]);
         } else {
            console.log(`No document found for server ID: ${serverId}`);
         }

      } catch (error) {
         console.error(`Error processing server ${serverId}:`, error);
      }
   }
};

module.exports = checkCodeMinute;
