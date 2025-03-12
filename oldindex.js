    require('dotenv').config();


    const { 
        Client, 
        GatewayIntentBits, 
        SlashCommandBuilder,
        Collection, 
        MessageEmbed, 
        MessageAttachment,
        EmbedBuilder,
        REST,
        Routes
    } = require("discord.js");

    const axios = require('axios');

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ],
    });

    const fs = require('fs');
    const path = require('path');

    // Firebase configuration
    const admin = require('firebase-admin');
    const serviceAccount = JSON.parse(process.env.FIREBASEKEY);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    require('firebase/firestore'); 
    const db = admin.firestore();

    //timers
    //scheduled code
    const schedule = require('node-schedule');
    const checkCodeDaily = () => {
        console.log("Checking code at 12: AM EST...");
    };

    //every x amount of hour code
    const checkCodeHour = () => {
        console.log("every hour code has ran");
    };

    //every x amount of minute code
    const checkCodeMinute = async () => {
        console.log("Every minute code has run");

        for (const guild of client.guilds.cache.values()) {
            const serverId = guild.id;
            console.log(serverId);
            

            try {
                //call updates
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


    //runs daily at x amount of time
    const jobDaily = schedule.scheduleJob({ hour: 24, minute: 0, tz: 'America/New_York' }, checkCodeDaily);

    //runs every x amount of hours
    const hours = 0;
    const jobHour = schedule.scheduleJob(`0 */${hours} * * *`, checkCodeHour);

    //runs every x amount of minutes
    const minutes = 1;
    const jobMinute = schedule.scheduleJob(`*/${minutes} * * * *`, checkCodeMinute);



    //functions
    //check time
    const timeCheck = () => {
        const now = new Date();
        
        return now.toLocaleTimeString();
    }

    //random number
    const randomNumber = (min, max) => {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    //asks a random letter for hiragana
    const generateLetterHiraganaQuestion = async (channelId, serverId) => {
        const channel = await client.channels.fetch(channelId);
        try {
            const serverRef = db.collection('servers').doc(serverId);
            const response = await axios.get('https://zen-japanese-api.vercel.app/hiragana');
            const data = response.data;
            if (!data || data.hiragana.length === 0) {
                console.log('No data found');
                return;
            }
            const randomIndex = Math.floor(Math.random() * data.hiragana.length);
            const selectedHiragana = data.hiragana[randomIndex]
            await serverRef.update({
                hiraganaAnswer: selectedHiragana.roumaji 
            });
            console.log(`Hiragana answer: ${selectedHiragana.roumaji}`);
            
            await channel.send(`Guess what's the roumaji of ${selectedHiragana.kana}`);
        } catch (error) {
            console.error('Error in generateLetterHiraganaQuestion:', error);
        }
    };

    //asks a random letter for katakana
    const generateLetterKatakanaQuestion = async (channelId, serverId) => {
        const channel = await client.channels.fetch(channelId);
        try {
            const serverRef = db.collection('servers').doc(serverId);
            const response = await axios.get("https://zen-japanese-api.vercel.app/katakana");
            const data = response.data;
            if (!data || (data.katakana && data.katakana.length === 0)) {
                console.log('no data found');
                return;
            }
            const randomIndex = randomNumber(0, data.katakana.length);
            const selectedKatakana = data.katakana[randomIndex];
            await serverRef.update({
                katakanaAnswer: selectedKatakana.roumaji 
            });
            console.log(`Katakana Answer: ${selectedKatakana.roumaji}`);
            
            await channel.send(`Guess what's the roumaji of ${selectedKatakana.kana}`);
        } catch (error) {
            console.error(error);
        }
    };

    //asks a random letter for kanji
    const generateLetterKanjiQuestion = async (channelId, serverId) => {
        const channel = await client.channels.fetch(channelId);
        const kanjiEndpoints = ['jouyou', 'kyouiku', 'wanikani'];
        const kanjiUrl = `https://zen-japanese-api.vercel.app/kanji/${kanjiEndpoints[randomNumber(0, kanjiEndpoints.length)]}`;
        console.log('Kanji API URL:', kanjiUrl);
        try {
            const serverRef = db.collection('servers').doc(serverId);
            const response = await axios.get(kanjiUrl);
            const data = response.data;
            if (!data || (data.kanji && data.kanji.length === 0)) {
                console.log('No data found');
                return;
            }
            const randomIndex = randomNumber(0, Object.keys(data.kanji).length - 1);
            const selectedKanji = Object.keys(data.kanji)[randomIndex];
            await serverRef.update({
                kanjiAnswer: data.kanji[selectedKanji].meanings
            });
            console.log("Answer for kanji is:", data.kanji[selectedKanji].meanings);
            await channel.send(`Guess what's the meaning of ${selectedKanji}`);
        } catch (error) {
            console.error('Error in generateLetterKanjiQuestion:', error);
        }
    };


    //updaters
    //manga leaderboard updater
    const mangaLeaderboardUpdater = async (serverId, client) => {
        console.log(`manga leaderboard update just ran`);

        try {
            const serverDocRef = db.collection("servers").doc(serverId);
            const serverDoc = await serverDocRef.get();
            const mangasRef = serverDocRef.collection("mangas");
            const mangasSnapshot = await mangasRef.get();

            if (!serverDoc.exists) {
                console.error(`Server document not found for guildId: ${serverId}`);
                return;
            }

            const { mangaLeaderboardChannelId, mangaLeaderboardMessageId } = serverDoc.data();
            if (!mangaLeaderboardChannelId) {
                console.error(`mangaLeaderboardChannelId not set for guildId: ${serverId}`);
                return;
            }

            if (mangasSnapshot.empty) {
                console.log(`No mangas found for guildId: ${serverId}`);
                return;
            }

            const eligibleMangas = mangasSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(manga => manga.totalReviews && manga.totalReviews >= 2)  
                .sort((a, b) => b.totalRating - a.totalRating);

            const embed = new EmbedBuilder()
                .setTitle("📖 Manga Leaderboard 📖")
                .setColor("#FFD700")
                .setDescription(
                    eligibleMangas.length === 0
                        ? 'No mangas meet the required review count (2). Please post more reviews!'
                        : eligibleMangas.map((manga, index) =>
                            `**${index + 1}. [${manga.title}](https://mangadex.org/title/${manga.id})**⭐ **${manga.totalRating}/10**`
                        ).join("\n")
                )
                .setFooter({ text: "Updated every minute ⏳" })
                .setTimestamp();
            const channel = await client.channels.fetch(mangaLeaderboardChannelId);
            if (!channel) {
                console.error(`Leaderboard channel not found for ID: ${mangaLeaderboardChannelId}`);
                return;
            }

            if (mangaLeaderboardMessageId) {
                try {
                    const leaderboardMessage = await channel.messages.fetch(mangaLeaderboardMessageId);
                    await leaderboardMessage.edit({ embeds: [embed] });
                    console.log(`Leaderboard updated successfully.`);
                } catch (error) {
                    console.warn(`Could not edit existing leaderboard message, sending a new one.`);
                    const newMessage = await channel.send({ embeds: [embed] });
                    await serverDocRef.update({ mangaLeaderboardMessageId: newMessage.id });
                }
            } else {
                const newMessage = await channel.send({ embeds: [embed] });
                await serverDocRef.update({ mangaLeaderboardMessageId: newMessage.id }); 
                console.log(`New leaderboard message sent.`);
            }

        } catch (error) {
            console.error("Error updating manga leaderboard:", error);
        }
    };

    //birthday list updater
    const updateBirthdayList = async (serverId, client) => {
        console.log(`Birthday list update just ran for server: ${serverId}`);

        try {
            const serverDocRef = db.collection("servers").doc(serverId);
            const birthdaysRef = serverDocRef.collection("birthdays");
            const birthdaysSnapshot = await birthdaysRef.get();

            if (birthdaysSnapshot.empty) {
                console.log(`No birthdays found for guildId: ${serverId}`);
                return;
            }

            const today = new Date();
            const todayMonth = today.getMonth() + 1;
            const todayDay = today.getDate();

            let birthdayList = birthdaysSnapshot.docs.map(doc => doc.data());

            // Filter for today's birthdays
            const todaysBirthdays = birthdayList.filter(user => 
                user.month === todayMonth && user.day === todayDay
            );

            // Find the last birthday that happened
            const pastBirthdays = birthdayList.filter(user => 
                (user.month < todayMonth) || 
                (user.month === todayMonth && user.day < todayDay)
            );

            let lastBirthday = pastBirthdays.length > 0 
                ? pastBirthdays.sort((a, b) => {
                    if (a.month === b.month) return b.day - a.day;
                    return b.month - a.month;
                })[0] 
                : null;

            const embed = new EmbedBuilder()
                .setTitle("🎉 Today's Birthdays & Last Birthday 🎂")
                .setColor("#FF69B4")
                .setDescription(
                    todaysBirthdays.length === 0 && !lastBirthday
                        ? "No birthdays today! Add some with `/addbirthday`! 🎂"
                        : `${todaysBirthdays.length > 0 ? "**🎈 Today's Birthdays:**\n" + todaysBirthdays.map(user => `**${user.username}** - ${user.month}/${user.day}`).join("\n") : ""}` +
                        `${lastBirthday ? `\n\n🎊 **Last Birthday:**\n**${lastBirthday.username}** - ${lastBirthday.month}/${lastBirthday.day}` : ""}`
                )
                .setFooter({ text: "Updated daily at midnight ⏳" })
                .setTimestamp();

            const serverData = await serverDocRef.get();
            const { birthdayChannelId, birthdayMessageId } = serverData.data();

            if (!birthdayChannelId) {
                console.error(`birthdayChannelId not set for guildId: ${serverId}`);
                return;
            }

            const channel = await client.channels.fetch(birthdayChannelId);
            if (!channel) {
                console.error(`Birthday channel not found for ID: ${birthdayChannelId}`);
                return;
            }

            if (birthdayMessageId) {
                try {
                    const birthdayMessage = await channel.messages.fetch(birthdayMessageId);
                    await birthdayMessage.edit({ embeds: [embed] });
                    console.log(`Birthday list updated successfully.`);
                } catch (error) {
                    console.warn(`Could not edit existing birthday message, sending a new one.`);
                    const newMessage = await channel.send({ embeds: [embed] });
                    await serverDocRef.update({ birthdayMessageId: newMessage.id });
                }
            } else {
                const newMessage = await channel.send({ embeds: [embed] });
                await serverDocRef.update({ birthdayMessageId: newMessage.id });
                console.log(`New birthday message sent.`);
            }

        } catch (error) {
            console.error("Error updating birthday list:", error);
        }
    };



    //common functions
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

    const answerHandler = async (userId, userDocRef, interaction, type) => {
        try {
            const userDoc = await userDocRef.get();
            const userData = userDoc.data();
            let updatedHiraganaCurrentStreak = userData.hiraganaCurrentStreak + 1;
            let updatedKatakanaCurrentStreak = userData.katakanaCurrentStreak + 1;
            let updatedKanjiCurrentStreak = userData.kanjiCurrentStreak + 1;
            let updatedHiraganaLongestStreak = userData.hiraganaLongestStreak + 1;
            let updatedKatakanaLongestStreak = userData.katakanaLongestStreak + 1;
            let updatedKanjiLongestStreak = userData.kanjiLongestStreak + 1;
            let updatedHiraganaPoints = userData.hiraganaPoints + 1;
            let updatedKatakanaPoints = userData.katakanaPoints + 1;
            let updatedKanjiPoints = userData.kanjiPoints + 1;
            let hiraganaAnswered = userData.hiraganaAnswered;
            let katakanaAnswered = userData.katakanaAnswered;
            let kanjiAnswered = userData.kanjiAnswered;

            let message = `**${interaction.user.globalName}** has answered correctly!!!\n`

            if (type === "hiragana") {
                updatedHiraganaCurrentStreak = userData.hiraganaCurrentStreak + 1;
                if (updatedHiraganaCurrentStreak > updatedHiraganaLongestStreak) {
                    updatedHiraganaLongestStreak = updatedHiraganaCurrentStreak;
                }
                updatedHiraganaPoints = userData.hiraganaPoints + 1;
                hiraganaAnswered = true;
                message += `You now have **${updatedHiraganaPoints}** points\nWith a streak of **${updatedHiraganaCurrentStreak}**!!!`
            }else if (type === "katakana") {
                updatedKatakanaCurrentStreak = userData.katakanaCurrentStreak + 1;
                if (updatedKatakanaCurrentStreak > updatedKatakanaLongestStreak) {
                    updatedKatakanaLongestStreak = updatedKatakanaCurrentStreak;
                }
                updatedKatakanaPoints = userData.katakanaPoints + 1;
                katakanaAnswered = true;
                message += `You now have ${updatedKatakanaPoints} points and a streak of **${updatedKatakanaCurrentStreak}**!!!`
            }else if (type === "kanji"){
                updatedKanjiCurrentStreak = userData.kanjiCurrentStreak + 1;
                if (updatedKanjiCurrentStreak > updatedKanjiLongestStreak) {
                    updatedKanjiLongestStreak = updatedKanjiCurrentStreak;
                }
                updatedKanjiPoints = userData.kanjiPoints + 1;
                kanjiAnswered = true;
                message += `You now have ${updatedKanjiPoints} points and a streak of **${updatedKanjiCurrentStreak}**!!!`
            }else {
                console.log('unknown type');
                
            }

            await userDocRef.update({
                hiraganaCurrentStreak: updatedHiraganaCurrentStreak,
                katakanaCurrentStreak: updatedKatakanaCurrentStreak,
                kanjiCurrentStreak: updatedKanjiCurrentStreak,
                hiraganaLongestStreak: updatedHiraganaLongestStreak,
                katakanaLongestStreak: updatedKatakanaLongestStreak,
                kanjiLongestStreak: updatedKanjiLongestStreak,
                hiraganaPoints: updatedHiraganaPoints,
                katakanaPoints: updatedKatakanaPoints,
                kanjiPoints: updatedKanjiPoints,
                hiraganaAnswered: hiraganaAnswered,
                katakanaAnswered: katakanaAnswered,
                kanjiAnswered: kanjiAnswered
            }, { merge: true });

            return message;

        } catch (error) {
            console.error('Error updating user data:', error);
            await interaction.followUp.reply('There was an error updating your profile.');
        }
    }

    const embedText = async (message, interaction, image) => {

        let embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setDescription(message)
            .setTimestamp();

        if (image) {
            embed.setImage(image);
        }

        if (interaction) {
            embed.setAuthor({
                name: interaction.user.globalName || interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 128 })
            });
        }

        return embed;
    };

    const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);    client.once("ready", async () => {
        console.log("Bot is ready");
        console.log(client.guilds.cache.guild);
        
        client.guilds.cache.forEach(guild => {
            const serverId = guild.id;
            console.log(`The bot is in server with ID: ${serverId}`);

            // You can now use the serverId for further operations
            // For example, fetching server-specific data or sending messages
        });


        // Log all the guilds the bot is part of
    client.guilds.cache.forEach(guild => {
        console.log(`The bot is in server with ID: ${guild.id}`);
    });

    try {
        // Delete all global application commands
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
        console.log('Deleted all global commands');
    } catch (error) {
        console.error('Failed to delete commands:', error);
    }

        const random = new SlashCommandBuilder()
            .setName('random')
            .setDescription('Searches a random manga for a user')
            .addStringOption(option =>
                option.setName('genre')
                    .setDescription('String input')
                    .setRequired(false)
        );
        await client.application.commands.create(random);

        const search = new SlashCommandBuilder()
            .setName('getraw')
            .setDescription('Searches the raw for a manga for a user')
            .addStringOption(option =>
                option.setName('title')
                    .setDescription('String input')
                    .setRequired(true)
        );
        await client.application.commands.create(search);

        const post = new SlashCommandBuilder()
        .setName('post')
        .setDescription('Posts the manga/manwha to server')
        .addStringOption(option => 
            option.setName('title')
                .setDescription('Title of the manga')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('rating')
                .setDescription('your personal rating')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('comment')
                .setDescription('your personal comment on the manga')
                .setRequired(false)
        )
        await client.application.commands.create(post);

        const getchapter = new SlashCommandBuilder()
        .setName('getchapter')
        .setDescription('Posts the a manga chapter to the server')
        .addStringOption(option => 
            option.setName('title')
                .setDescription('String input')
                .setRequired(false)
        );
        await client.application.commands.create(getchapter);

        //anime
        const randomanime = new SlashCommandBuilder()
        .setName('randomanime')
        .setDescription('Posts a random anime to the server')
        .addStringOption(option => 
            option.setName('genre')
                .setDescription('Anime genre')
                .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('type')
                .setDescription('Movie or Anime')
                .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('year')
                .setDescription('Release year of the anime')
                .setRequired(false)
        );
        await client.application.commands.create(randomanime);

        const postanime = new SlashCommandBuilder()
        .setName('postanime')
        .setDescription('Posts an anime to the server on a certain format')
        .addStringOption(option => 
            option.setName('title')
                .setDescription('Anime Title')
                .setRequired(true)
        );
        await client.application.commands.create(postanime);


        //light novel
        const postlightnovel = new SlashCommandBuilder()
        .setName('postlightnovel')
        .setDescription('Posts an light novel to the server on a certain format')
        .addStringOption(option => 
            option.setName('title')
                .setDescription('Light Novel Title')
                .setRequired(true)
        );
        await client.application.commands.create(postlightnovel);

        //jp
        const randomLetter = new SlashCommandBuilder()
        .setName('randomletter') 
        .setDescription('Posts a random Japanese letter')
        .addStringOption(option =>
            option.setName('system')
                .setDescription('Choose: H (Hiragana), KK (Katakana), K (Kanji)')
                .setRequired(true)
        );
        await client.application.commands.create(randomLetter);

        const answer = new SlashCommandBuilder()
        .setName('answer')
        .setDescription('Use this command to asnwer for letter questions only (may change in the future)')
        .addStringOption(option =>
            option.setName('answer')
                .setDescription('Put your answer here')
                .setRequired(true)
        )
        await client.application.commands.create(answer);

        //server config
        const serverSetUp = new SlashCommandBuilder()
        .setName('serversetup')
        .setDescription('Use this command to set up the channels, time, etc')
        await client.application.commands.create(serverSetUp);
        
        //extra stuffs
        const ping = new SlashCommandBuilder()
        .setName('ping') 
        .setDescription('ping')
        await client.application.commands.create(ping);

        const timecheck = new SlashCommandBuilder()
        .setName('timecheck') 
        .setDescription('timecheck')
        await client.application.commands.create(timecheck);

        const addbirthday = new SlashCommandBuilder()
        .setName('addbirthday')
        .setDescription('Add a user in the birthday list')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('Mention the user you want to add on the birthday list.')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('month')
                .setDescription('Enter the Birth Month')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('date')
                .setDescription('Enter the Birth Date')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('year')
                .setDescription('Enter the birth year')
                .setRequired(true)
        )
        await client.application.commands.create(addbirthday);
        
    });

    client.on("messageCreate", async (message) => {
        if (message.author.bot) return;

        if (message.content.includes('puniyo')) {
            message.reply({
                content: 'Hi',
            });
        }else if (message.content.toLowerCase().includes('faggot')) {
            await message.delete();
            message.channel.send('https://tenor.com/view/merry-christmas-love-black-guy-gif-13356234737839029056');

        }else if (message.content.toLowerCase().includes('christmas')) {
            message.reply({
                content: 'https://tenor.com/2tTS.gif',
            });
        }
    });

    //commands
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;
        
        if (interaction.commandName === 'search'){
        const searchTerm = interaction.options.getString('title');

            try {
                const res = await axios({
                method: 'GET',
                url: 'https://api.mangadex.org/manga',
                params: {
                    title: searchTerm
                }
                });

                if (res.data && res.data.data.length > 0) {
                
                const manga = res.data.data[0];
                
                const mangaTitle = manga.attributes.title.en || 'Unknown Title';
                const mangaDescription = manga.attributes.description.en || 'No description available.';
                const mangaGenres = manga.attributes.tags.map(tag => tag.attributes.name.en).join(', ');
                const mangaLinks = manga.attributes.links;
                
                const message = `
    **Title:** ${mangaTitle}
    **Description:** ${mangaDescription}
    **Genres:** ${mangaGenres}
    ${mangaLinks.mal ? `- [MyAnimeList](https://myanimelist.net/manga/${mangaLinks.mal})` : ''}
    - [MangaDex](https://mangadex.org/title/${manga.id})
                `.trim();

                await interaction.reply({ content: message });
                } else {
                await interaction.reply('No manga found with that title.');
                }
            } catch (error) {
                console.error('Error fetching manga data:', error);
                await interaction.reply('Sorry, I could not find any manga. Please try again later.');
            }


        }else if (interaction.commandName === 'random'){
            const genre = interaction.options.getString('genre');
    
            if (genre) {
                
            
                while (true) {
                    try {
                        const res = await axios({
                        method: 'GET',
                        url: 'https://api.mangadex.org/manga/random',
                    });
                        const manga = res.data.data;
                        const mangaTags = manga.attributes.tags;
                        const genreMatch = mangaTags.some(tag => 
                        tag.attributes.name.en.toLowerCase() === genre.toLowerCase()
                    );
                        if (genreMatch) {
                        const mangaTitle = manga.attributes.title.en || 'Unknown Title';
                        const mangaDescription = manga.attributes.description.en || 'No description available.';
                        const mangaGenres = mangaTags.map(tag => tag.attributes.name.en).join(', ');
                        const mangaLinks = manga.attributes.links;
                            
                        const message = `
        **Title:** ${mangaTitle}
        **Description:** ${mangaDescription}
        **Genres:** ${mangaGenres}
        ${mangaLinks.mal ? `- [MyAnimeList](https://myanimelist.net/manga/${mangaLinks.mal})` : ''}
        - [MangaDex](https://mangadex.org/title/${manga.id})
                            `.trim();
        
                            await interaction.reply({ content: message });
                            break;
                        } else {
                            console.log("No matching genre found, fetching another manga...");
                        }
        
                    } catch (error) {
                        console.error('Error fetching manga:', error);
                        await interaction.reply('An error occurred while fetching manga.');
                        break; 
                    }
                }
            } else {
                try {
                    const res = await axios({
                        method: 'GET',
                        url: 'https://api.mangadex.org/manga/random',
                    });
    
                    if (res.data.data) {
                    const manga = res.data.data;
    
                    const mangaTitle = manga.attributes.title.en || 'Unknown Title';
                    const mangaDescription = manga.attributes.description.en || 'No description available.';
                    const mangaGenres = manga.attributes.tags.map(tag => tag.attributes.name.en).join(', ');
                    const mangaLinks = manga.attributes.links;
                    const message = `
    **Title:** ${mangaTitle}
    **Description:** ${mangaDescription}
    **Genres:** ${mangaGenres}
    ${mangaLinks.mal ? `- [MyAnimeList](https://myanimelist.net/manga/${mangaLinks.mal})` : ''}
    - [MangaDex](https://mangadex.org/title/${manga.id})
                `.trim();

                    await interaction.reply({ content: message });
                    } else {
                        await interaction.reply('No manga found.');
                    }
                } catch (error) {
                    console.error('Error fetching manga:', error);
                }
            }
        }else if (interaction.commandName === 'getraw'){
            const title = interaction.options.getString('title');

            try {
                const res = await axios({
                    method: 'GET',
                    url: 'https://api.mangadex.org/manga',
                    params: {
                        title: title
                    }
                }); 

                if (res && res.data.data.length > 0) {
                    const manga = res.data.data[0];
                    const mangaRaw = manga.attributes.links ? manga.attributes.links.raw : null;
        
                    if (mangaRaw) {
                        const message = `[Read Raw](${mangaRaw})`;
                        await interaction.reply({ content: message });
                    } else {
                        await interaction.reply({ content: "No raw link found for this manga." });
                    }
                } else {
                    await interaction.reply({ content: "No manga found with this title." });
                }


            } catch (error) {
                
            }

        }else if (interaction.commandName === 'post') {
            await interaction.deferReply();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const title = interaction.options.getString('title');
            let rating = interaction.options.getString('rating');
            const comment = interaction.options.getString('comment');
            const userId = interaction.user.id;
            const mangasRef = db.collection("servers").doc(interaction.guildId).collection("mangas");
        
            if (rating) {
                rating = parseFloat(rating);
                if (rating < 1 || rating > 10) {
                    interaction.reply({ content: 'Please provide a valid rating between 1 and 10.' })
                        .then(replyMessage => setTimeout(() => replyMessage.delete(), 5000));
                    return;
                }
            }
        
            try {
                const res = await axios.get('https://api.mangadex.org/manga', { params: { title: title } });
                if (!res.data || res.data.data.length === 0) {
                    await interaction.reply({ content: 'No manga found with that title. Please try again.' })
                        .then(replyMessage => setTimeout(() => replyMessage.delete(), 5000));
                    return;
                }
        
                const manga = res.data.data[0];
                const mangaId = manga.id;
                const mangaTitle = manga.attributes.title.en || 'Unknown Title';
                const mangaGenres = manga.attributes.tags.map(tag => tag.attributes.name.en).join(', ');
                const mangaDocRef = mangasRef.doc(mangaId);
                const mangaDoc = await mangaDocRef.get();
                
                let mangaData = mangaDoc.exists ? mangaDoc.data() : {
                    title: mangaTitle,
                    genres: mangaGenres,
                    totalReviews: 0,
                    totalRating: 0,
                    users: {},
                    likes: 0,
                    dislikes: 0
                };
                
                mangaData.users[userId] = { rating, comment };
                const ratingsArray = Object.values(mangaData.users).map(user => user.rating);
                mangaData.totalReviews = Object.keys(mangaData.users).length;
                mangaData.totalRating = ratingsArray.length ? (ratingsArray.reduce((a, b) => a + b, 0) / ratingsArray.length) : rating;
                
                await mangaDocRef.set(mangaData, { merge: true });
        
                const myAnimeListId = manga.attributes.links?.mal || null;
                const malLink = myAnimeListId ? `\n- [MyAnimeList](https://myanimelist.net/manga/${myAnimeListId})` : "";
                const imageCoverId = manga.relationships.find(rel => rel.type === "cover_art")?.id;
                let imageUrl = "";
                const status = manga.attributes.status || "Unknown";
                const year = manga.attributes.year || "Unknown";
                const description = manga.attributes.description?.en || "No description available.";
                const sideStories = manga.relationships.filter(rel => rel.type === "manga" && rel.related === "side_story");
                let sideStoriesMessage = sideStories.map(story => `\n- [${story.attributes?.title?.en || "Untitled"}](https://mangadex.org/title/${story.id}) (side story)`).join('');
                let serverMangaRatingMessage = "**Server Rating: **";
                const serverDocRef = db.collection("servers").doc(interaction.guildId);
                const serverDoc = await serverDocRef.get();
        
                if (imageCoverId) {
                    const imageData = await axios.get(`https://api.mangadex.org/cover/${imageCoverId}`);
                    const imageLocation = imageData.data.data.attributes.fileName;
                    imageUrl = `https://uploads.mangadex.org/covers/${mangaId}/${imageLocation}`;
                }

                if (serverDoc.exists) {
                    const mangaDoc = await serverDocRef.collection("mangas").doc(mangaId).get();
                    if (mangaDoc.exists) {
                        const mangaData = mangaDoc.data();
                        serverMangaRatingMessage += `${mangaData.totalRating} (${mangaData.totalReviews})`;
                    }
                } else {
                    console.log("Server document not found.");
                }
            
                let message = `**Title:** ${mangaTitle}`;
                message += `\n**Genres:** ${mangaGenres}`;               
                message += `\n**Year:** ${year}`;               
                message += `\n**Status:** ${status}`;        
                message += `\n- [MangaDex](https://mangadex.org/title/${mangaId})${malLink}`;
                if (sideStories.length > 0) message += `${sideStoriesMessage}`;
                message += `\n\n${serverMangaRatingMessage}`;
                if (rating) message += `\n**User Rating**: ${rating}/10`;
                if (comment) message += `\n**Comment**: ${comment}`;
                message += `\n\n\n**Description:** ${description}`;
                if (!imageUrl) message += `\n**No Cover Found**`;
        
                const embed = await embedText(message, interaction, imageUrl);
                await interaction.followUp({ embeds: [embed] });
            
            } catch (error) {
                console.error('Error fetching manga data:', error);
                await interaction.reply({ content: 'Sorry, I could not find any manga. Please try again later.' })
                    .then(replyMessage => setTimeout(() => replyMessage.delete(), 5000));
            }
        }else if (interaction.commandName === 'randomanime'){
            await interaction.reply('command is not yet implemented');
        }else if (interaction.commandName === 'postanime'){
            await interaction.editReply('Command is Not Available');

            
        }else if (interaction.commandName === 'postlightnovel'){
            await interaction.reply('Command is Not Available');

        }else if (interaction.commandName === 'getchapter'){
            await interaction.reply('Command is Not Available');

        }else if (interaction.commandName === 'randomletter'){
            const choice = interaction.options.getString('system');

            let systemURL;
            if (choice === 'H') {
                systemURL = 'https://zen-japanese-api.vercel.app/hiragana'
            } else if (choice === 'KK') {
                systemURL = 'https://zen-japanese-api.vercel.app/katakana'
            } else if (choice === 'K') {
                return interaction.reply({ content: 'coming soon', ephemeral: true });
            } else {
                return interaction.reply({ content: 'Invalid choice! Use H, KK, or K.', ephemeral: true });
            }
            try {
                const response = await axios.get(systemURL);
                const data = response.data;

                if (!data || data.hiragana.length === 0) {
                    return interaction.reply({ content: 'No data found.', ephemeral: true });
                }

                const randomNumber = Math.floor(Math.random() * data.hiragana.length);
                console.log(data.hiragana[randomNumber].kana);
                
                await interaction.reply(`${data.hiragana[randomNumber].kana}`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Error fetching data from the Japanese API.', ephemeral: true });
            }
        }else if (interaction.commandName === 'timecheck'){

            await interaction.reply(`${timeCheck()}`);

        }else if (interaction.commandName === 'askme'){
            await interaction.reply(`command it yet to be implemented`);
        }else if (interaction.commandName === 'answer') {
            await interaction.deferReply();
            await new Promise(resolve => setTimeout(resolve, 1000));
            const answer = interaction.options.getString('answer');
            const channelId = interaction.channelId;
            const userId = interaction.user.id;
            
            //checking for user in the users collection
            const subcollectionRef = db.collection("servers").doc(interaction.guildId).collection("users");
            const userCollectionRef = subcollectionRef.doc(userId);
            
            
            try {
                const userDoc = await userCollectionRef.get();
                const userData = userDoc.exists ? userDoc.data() : {}; ;
                const serversRef = db.collection('servers');
                const serverDoc = await serversRef.doc(interaction.guildId).get();
                
                if (serverDoc.exists) {
                    const data = serverDoc.data();
                    if ((channelId === data.askHiraganaChannel && userData.hiraganaAnswered) || 
                        (channelId === data.askKatakanaChannel && userData.katakanaAnswered) || 
                        (channelId === data.askKanjiChannel && userData.kanjiAnswered)) {
                        const embed = await embedText("You have already answered this question!", interaction, false);
                        await interaction.followUp({ embeds: [embed] });
                        return;
                    }
        
                    const askHiraganaChannel = data.askHiraganaChannel;
                    const askKatakanaChannel = data.askKatakanaChannel;
                    const askKanjiChannel = data.askKanjiChannel;
        
                    if (channelId === askHiraganaChannel) {
                        if (answer.toLowerCase() === data.hiraganaAnswer) {
                            const message = await answerHandler(userId, userCollectionRef, interaction, 'hiragana');
                            const embed = await embedText(message, interaction, false);
                            await interaction.followUp({ embeds: [embed] });
                        } else {
                            await userCollectionRef.update({
                                hiraganaCurrentStreak: 0
                            }, { merge: true });
                            const embed = await embedText("Try Again!", interaction, false);
                            await interaction.followUp({ embeds: [embed] });
                        }
                    } else if (channelId === askKatakanaChannel) {
                        if (answer.toLowerCase() === data.katakanaAnswer) {
                            const message = await answerHandler(userId, userCollectionRef, interaction, 'katakana');
                            const embed = await embedText(message, interaction, false);
                            await interaction.followUp({ embeds: [embed] });
                        } else {
                            await userCollectionRef.update({
                                katakanaCurrentStreak: 0
                            }, { merge: true });
                            const embed = await embedText("Try Again!", interaction, false);
                            await interaction.followUp({ embeds: [embed] });
                        }
                    } else if (channelId === askKanjiChannel) {
                        if (data.kanjiAnswer.some(meaning => answer.toLowerCase() === meaning.toLowerCase())) {
                            await userCollectionRef.update({
                                kanjiCurrentStreak: 0
                            }, { merge: true });
                            const message = await answerHandler(userId, userCollectionRef, interaction, 'kanji');
                            const embed = await embedText(message, interaction, false);
                            await interaction.followUp({ embeds: [embed] });
                        } else {
                            const embed = await embedText("Try Again!", interaction, false);
                            await interaction.followUp({ embeds: [embed] });
                        }
                    } else {
                        const embed = await embedText("This channel is not set up for the quiz.", interaction, false);
                        await interaction.followUp({ embeds: [embed] });
                    }
                } else {
                    console.log(`No document found in server ID`);
                    const embed = await embedText("Server data not found.", interaction, false);
                    await interaction.followUp({ embeds: [embed] });
                }
            } catch (error) {
                console.error('Error fetching data from Firestore:', error);
                const embed = await embedText("There was an error processing your answer.", interaction, false);
                await interaction.followUp({ embeds: [embed] });
            }
        }else if (interaction.commandName === 'serversetup'){
            console.log("server setup is starting");
            const serverId = interaction.guildId;
            const serverRef = db.collection('servers').doc(serverId);
            const serverDoc = await serverRef.get();
        
            if (serverDoc.exists) { 
                await interaction.channel.send('This server is already registered. Do you want to reassign the channels? (yes/no)');
                const shouldReassign = await askYesNo(interaction);
                if (!shouldReassign) {
                    await interaction.channel.send('Setup cancelled.');
                    return;
                }
            }

            if (!interaction.channel) {
                console.log('No valid channel to send messages.');
                return; 
            }   
            
            await interaction.reply(`${serverId} is the server id`);
            await interaction.channel.send('tell me what channel is for manga leaderboard of the server.')
            const mangaLeaderboardChannelId = await askAndWaitForChannel(interaction);
            await interaction.channel.send('tell me what channel is for user leaderboard of the server.')
            const userLeaderboardChannelId = await askAndWaitForChannel(interaction);
            await interaction.channel.send('tell me what channel is for birthday of the server.')
            const askBirhtdayChannel = await askAndWaitForChannel(interaction);
            await interaction.channel.send('tell me what channel is for asking hiragana letters.')
            const askHiraganaChannel = await askAndWaitForChannel(interaction);
            await interaction.channel.send('tell me what channel is for asking katakana letters.')
            const askKatakanaChannel = await askAndWaitForChannel(interaction);
            await interaction.channel.send('tell me what channel is for asking kanji letters.')
            const askKanjiChannel = await askAndWaitForChannel(interaction);

            await serverRef.set({
                serverId: serverId,
                mangaLeaderboardChannelId: mangaLeaderboardChannelId,
                userLeaderboardChannelId: userLeaderboardChannelId,
                birthdayChannelId: askBirhtdayChannel,
                askHiraganaChannel: askHiraganaChannel,
                askKatakanaChannel: askKatakanaChannel,
                askKanjiChannel: askKanjiChannel,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                hiraganaAnswer: null,
                katakanaAnswer: null,
                kanjiAnswer: []
            });

            await interaction.channel.send('Server SetUp is complete, enjoy.')

        }else if (interaction.commandName === 'addbirthday') {
            await interaction.deferReply();
            await new Promise(resolve => setTimeout(resolve, 1000));

            const birthdayUser = interaction.options.getString('user').substring(2, 20);
            console.log(`User ID: ${birthdayUser}`);
            let member;
            try {
                member = await interaction.guild.members.fetch(birthdayUser);
                console.log(`User found: ${member.user.tag}`);
            } catch {
                console.log("User not found in server.");
            }
            const month = parseInt(interaction.options.getString('month'));
            const date = parseInt(interaction.options.getString('date'));
            const year = parseInt(interaction.options.getString('year'));
        
            if (isNaN(month) || isNaN(date) || isNaN(year)) {
                return interaction.followUp("Please provide a valid birthday in the format MM/DD/YYYY.");
            }
        
            const serverId = interaction.guildId;
            const birthdaysRef = db.collection("servers").doc(serverId).collection("birthdays");
            const usersRef = db.collection("servers").doc(serverId).collection("users");
        
            try {
                const userDoc = await usersRef.doc(birthdayUser).get();
                let userData = userDoc.exists ? userDoc.data() : {};
                const username = member?.user.globalName || birthdayUser;
                if (!userData.username) userData.username = username;
                if (!userData.dateJoined) userData.dateJoined = new Date().toISOString();
                await usersRef.doc(birthdayUser).set(userData, { merge: true });
                await birthdaysRef.doc(birthdayUser).set({
                    username: username,
                    month: month,
                    day: date,
                    year: year,
                    addedBy: interaction.user.username,
                    dateAdded: new Date().toISOString()
                });
        
                const message = `🎉 Successfully added **${username}**'s birthday!
                                📅 **Date:** ${month}/${date}/${year}
                                🛠️ **Added by:** ${interaction.user.username}`;
        
                const embed = await embedText(message, interaction, false);
                await interaction.followUp({ embeds: [embed] });
            } catch (error) {
                console.error('Error processing birthday:', error);
                interaction.followUp("There was an error adding the birthday. Please try again later.");
            }
        }
    
    });


    //when bot joins a server
    client.on('guildCreate', async (guild) => {
        try {
            const serverRef = db.collection('servers').doc(guild.id);
            
            // Ensure collections exist by creating an initial empty document
            await serverRef.collection('users').doc('_init').set({ initialized: true });
            await serverRef.collection('mangas').doc('_init').set({ initialized: true });
            await serverRef.collection('birthdays').doc('_init').set({ initialized: true });


            console.log(`Created users and mangas collections for server: ${guild.name}`);

            const members = await guild.members.fetch();
            members.forEach(member => {
                if (!member.user.bot) {
                    const userRef = serverRef.collection('users').doc(member.id);
                    userRef.set({
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
                }
            });

            console.log(`All current users stored in Firestore for server: ${guild.name}`);
        } catch (error) {
            console.error('Error storing current users in Firestore:', error);
        }
    });
    
    //when a user joins the server
    client.on('guildMemberAdd', async (member) => {
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
    });

    //when a user leaves
    client.on('guildMemberRemove', async (member) => {
        try {
            const userId = member.id;
            const userRef = db.collection('servers').doc(member.guild.id).collection('users').doc(userId);
            console.log(`User profile for ${member.user.username}#${member.user.discriminator} is retained even after they leave.`);
        } catch (error) {
            console.error('Error handling member leave:', error);
        }
    });

    client.login(process.env.DISCORD_TOKEN).catch((error) => {
        console.error('Failed to log in:', error);
    });