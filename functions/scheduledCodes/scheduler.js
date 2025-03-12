const schedule = require('node-schedule');
const { mangaLeaderboardUpdater } = require("../updaters");
const { updateBirthdayList } = require("../updaters");
const { generateLetterHiraganaQuestion } = require("../generators");
const { generateLetterKatakanaQuestion } = require("../generators");
const { generateLetterKanjiQuestion } = require("../generators");
const { client } = require('../bot');  // Importing client from bot.js
const { db } = require('../firebaseConfig');  // Make sure db is imported from your firebase config

// Every day at 12:00 AM EST
const checkCodeDaily = () => {
    console.log("Checking code at 12: AM EST...");
};

// Every x amount of hours
const checkCodeHour = () => {
    console.log("Every hour code has ran");
};

// Every x amount of minutes
const checkCodeMinute = async () => {
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

                generateLetterHiraganaQuestion(askHiraganaChannel, serverId);
                generateLetterKatakanaQuestion(askKatakanaChannel, serverId);
                generateLetterKanjiQuestion(askKanjiChannel, serverId);
            } else {
                console.log(`No document found for server ID: ${serverId}`);
            }
            
        } catch (error) {
            console.error(`Error processing server ${serverId}:`, error);
        }
    }
};

// Runs daily at 12:00 AM EST
const jobDaily = schedule.scheduleJob({ hour: 0, minute: 0, tz: 'America/New_York' }, checkCodeDaily);

// Runs every x amount of hours (every 1 hour in this case)
const hours = 1;  // Every hour
const jobHour = schedule.scheduleJob(`0 */${hours} * * *`, checkCodeHour);

// Runs every x amount of minutes (every 1 minute in this case)
const minutes = 1;  // Every minute
const jobMinute = schedule.scheduleJob(`*/${minutes} * * * *`, checkCodeMinute);

