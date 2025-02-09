require('dotenv').config();


const { Client, GatewayIntentBits, SlashCommandBuilder, MessageEmbed, MessageAttachment } = require("discord.js");
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

//global vairiables
let answerHiragana;//I have to fix this somehow in the future
let answerKatakana;
let answerKanji;


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
const checkCodeMinute = () => {
    console.log("every minute code has ran");
    generateLetterHiraganaQuestion();
    generateLetterKatakanaQuestion();
    generateLetterKanjiQuestion();
};


//runs daily at x amount of time
const jobDaily = schedule.scheduleJob({ hour: 0, minute: 0, tz: 'America/New_York' }, checkCodeDaily);
console.log("Scheduled task to check code at 12:00 AM EST daily.");

//runs every x amount of hours
const hours = 0;
const jobHour = schedule.scheduleJob(`0 */${hours} * * *`, checkCodeHour);
console.log(`Scheduled task to run every ${hours} hours.`);

//runs every x amount of minutes
const minutes = 1;
const jobMinute = schedule.scheduleJob(`*/${minutes} * * * *`, checkCodeMinute);
console.log(`Scheduled task to run every ${minutes} minutes.`);


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

//asks a random letter
const generateLetterHiraganaQuestion = async () => {
    const channel = await client.channels.fetch('1336940293362024458');
    try {
        const response = await axios.get('https://zen-japanese-api.vercel.app/hiragana');
        const data = response.data;
        if (!data || (data.hiragana && data.hiragana.length === 0)) {
            console.log('no data found');
            return;
        }
        const randomIndex = randomNumber(0, data.hiragana.length);
        setAnswerHiragana(data.hiragana[randomIndex].roumaji);
        console.log("Answer for hiragana is:", getAnswerHiragana());
        await channel.send(`Guess what's the roumaji of ${data.hiragana[randomIndex].kana}`);
    } catch (error) {
        console.error(error);
    }
};

const generateLetterKatakanaQuestion = async () => {
    const channel = await client.channels.fetch('1338045397972553759');
    try {
        const response = await axios.get("https://zen-japanese-api.vercel.app/katakana");
        const data = response.data;
        if (!data || (data.katakana && data.katakana.length === 0)) {
            console.log('no data found');
            return;
        }
        const randomIndex = randomNumber(0, data.katakana.length);
        setAnswerKatakana(data.katakana[randomIndex].roumaji);
        console.log("Answer for katakana is:", getAnswerkatakana());
        await channel.send(`Guess what's the roumaji of ${data.katakana[randomIndex].kana}`);
    } catch (error) {
        console.error(error);
    }
};

const generateLetterKanjiQuestion = async () => {
    const channel = await client.channels.fetch('1338056201740619857');
    const kanjiEndpoints = ['jouyou', 'kyouiku', 'wanikani']
    const kanjiUrl = `https://zen-japanese-api.vercel.app/kanji/${kanjiEndpoints[randomNumber(0, kanjiEndpoints.length)]}`
    console.log(kanjiUrl);
    try {
        const response = await axios.get(kanjiUrl);
        const data = response.data;
        console.log(Object.keys(data.kanji)[randomNumber(0, Object.keys(data.kanji).length)]);
        if (!data || (data.kanji && data.kanji.length === 0)) {
            console.log('no data found');
            return;
        }
        const randomIndex = randomNumber(0, Object.keys(data.kanji).length);
        const selectedKanji = Object.keys(data.kanji)[randomIndex];
        setAnswerKanji({ meanings: data.kanji[selectedKanji].meanings });
        // console.log(data.kanji[Object.keys(data.kanji)[randomIndex]]);
        console.log("Answer for kanji is:", getAnswerKanji());
        await channel.send(`Guess what's the meaning of ${selectedKanji}`);
    } catch (error) {
        console.error(error);
    }
}

//getter
const getAnswerHiragana= () => {
    return answerHiragana;
}

const getAnswerkatakana = () => {
    return answerKatakana;
}

const getAnswerKanji = () => {
    return answerKanji;
}

//setter
const setAnswerHiragana = (answer) => {
    answerHiragana = answer;
}

const setAnswerKatakana = (answer) => {
    answerKatakana = answer;
}

const setAnswerKanji = (answer) => {
    answerKanji = answer;
}


client.once("ready", async () => {
    console.log("Bot is ready");

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

    const postmanga = new SlashCommandBuilder()
    .setName('postmanga')
    .setDescription('Posts the manga to server')
    .addStringOption(option => 
        option.setName('title')
            .setDescription('Title of the manga')
            .setRequired(true)
    )
    .addStringOption(option => 
        option.setName('rating')
            .setDescription('your personal rating')
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('comment')
            .setDescription('your personal comment on the manga')
            .setRequired(false)
    )


    await client.application.commands.create(postmanga);

    const getchapter = new SlashCommandBuilder()
    .setName('getchapter')
    .setDescription('Posts the a manga chapter to the server')
    .addStringOption(option => 
        option.setName('title')
            .setDescription('String input')
            .setRequired(false)
    );
    await client.application.commands.create(getchapter);

    //Anime
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


    //Light Novel
    const postlightnovel = new SlashCommandBuilder()
    .setName('postlightnovel')
    .setDescription('Posts an light novel to the server on a certain format')
    .addStringOption(option => 
        option.setName('title')
            .setDescription('Light Novel Title')
            .setRequired(true)
    );
    await client.application.commands.create(postlightnovel);

    //JP
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
    
    //extra stuffs
    const timeCheck = new SlashCommandBuilder()
    .setName('timecheck') 
    .setDescription('timecheck')
    await client.application.commands.create(timeCheck);


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

    }else if (interaction.commandName === 'postmanga'){
        const title = interaction.options.getString('title');
        const rating = interaction.options.getString('rating');
        const comment = interaction.options.getString('comment');

        try{
            const res = await axios({
                method: 'GET',
                url: 'https://api.mangadex.org/manga',
                params: {
                title: title
                }
            });

            if (res.data && res.data.data.length > 0) {
                console.log(res.data);
                const manga = res.data.data[0];
                const mangaTitle = manga.attributes.title.en || 'Unknown Title';
                const mangaGenres = manga.attributes.tags.map(tag => tag.attributes.name.en).join(', ');
                let message = `
                    **Title:** ${mangaTitle}\n**Genres:** ${mangaGenres}\n- [MangaDex](https://mangadex.org/title/${manga.id})`
                
                if (rating) {
                    message += `\n**Rating**: ${rating}`;
                }
    
                if (comment) {
                    message += `\n**Comment**: ${comment}`;
                }
            

                await interaction.reply({ content: message });
            } else {
                await interaction.reply('No manga found with that title.');
            }
        } catch (error) {
            console.error('Error fetching manga data:', error);
            await interaction.reply('Sorry, I could not find any manga. Please try again later.');
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
        const answer = interaction.options.getString('answer');
        console.log('/answer just ran');
        const channelId = interaction.channelId;
        console.log(`Channel ID: ${channelId}`);
        if (channelId === '1336940293362024458') {
            if (answer.toLowerCase() === getAnswerHiragana().toLowerCase()) {
                await interaction.reply(`${interaction.user.username} has answered correctly!!! ${timeCheck()}`);
            } else {
                await interaction.reply(`Try again!`);
            }
        }else if (channelId === '1338045397972553759') {
            if (answer.toLowerCase() === getAnswerkatakana().toLowerCase()) {
                await interaction.reply(`${interaction.user.username} has answered correctly!!! ${timeCheck()}`);
            } else {
                await interaction.reply(`Try again!`);
            }
        }else if (channelId === '1338056201740619857') {
            if (getAnswerKanji().meanings.some(meaning => answer.toLowerCase() === meaning.toLowerCase())) {
                await interaction.reply(`${interaction.user.username} has answered correctly!!! ${timeCheck()}`);
            } else {
                await interaction.reply(`Try again!`);
            }
        }
        
    }
    

  
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error('Failed to log in:', error);
});
