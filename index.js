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
    generateLetterQuestion();
};


//runs daily at x amount of time
const jobDaily = schedule.scheduleJob({ hour: 0, minute: 0, tz: 'America/New_York' }, checkCodeDaily);
console.log("Scheduled task to check code at 12:00 AM EST daily.");

//runs every x amount of hours
const hours = 0;
const jobHour = schedule.scheduleJob(`0 */${hours} * * *`, checkCodeHour);
console.log(`Scheduled task to run every ${hours} hours.`);

//runs every x amount of minutes
const minutes = 20;
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
const generateLetterQuestion = async () => {
    const channel = await client.channels.fetch('1336940293362024458');

    const urls = [
        "https://zen-japanese-api.vercel.app/hiragana", 
        "https://zen-japanese-api.vercel.app/katakana"
    ];
    const chosenURL = urls[randomNumber(0, urls.length)];

    try {
        const response = await axios.get(chosenURL);
        const data = response.data;

        if (!data || (data.hiragana && data.hiragana.length === 0) || (data.katakana && data.katakana.length === 0)) {
            console.log('no data found');
            return;
        }

        const randomIndex = randomNumber(0, (data.hiragana || data.katakana).length);
        
        if (data.hiragana) {
            setAnswer(data.hiragana[randomIndex].roumaji);
            console.log("Answer is:", answerOfLetter);
            await channel.send(`Guess what's the roumaji of ${data.hiragana[randomIndex].kana}`);

        } else if (data.katakana) {
            setAnswer(data.katakana[randomIndex].roumaji);
            console.log("Answer is:", answerOfLetter);
            await channel.send(`Guess what's the roumaji of ${data.katakana[randomIndex].kana}`);
        }
    } catch (error) {
        console.error(error);
    }

    
};

//getter
const getAnswer = () => {
    return answerOfLetter;
}

//setter
const setAnswer = (answer) => {
    answerOfLetter = answer;
}

//global vairiables
let answerOfLetter = "a";//I have to fix this somehow in the future


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
            .setDescription('String input')
            .setRequired(true)

    );
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
    const randomWord = new SlashCommandBuilder()
    .setName('randomword') 
    .setDescription('Posts a random Japanese word')
    .addStringOption(option =>
        option.setName('system')
            .setDescription('Choose: H (Hiragana), KK (Katakana), K (Kanji)')
            .setRequired(true)
    );
    await client.application.commands.create(randomWord);

    const answerforletter = new SlashCommandBuilder()
    .setName('answerforletter')
    .setDescription('Use this command to asnwer for letter questions only (may change in the future)')
    .addStringOption(option =>
        option.setName('answer')
            .setDescription('Put your answer here')
            .setRequired(true)
    )
    await client.application.commands.create(answerforletter);
    
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
   
                if (res.data && res.data.data) {
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

            if (res && res.data && res.data.data && res.data.data.length > 0) {
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
                const message = `
                    **Title:** ${mangaTitle}
                    **Genres:** ${mangaGenres}
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


    }else if (interaction.commandName === 'randomanime'){
        const genre = interaction.options.getString('genre');
        const year = interaction.options.getString('year');
        const type = interaction.options.getString('type');
        
        await interaction.deferReply(); // Defer reply to avoid timeout
        
        try {
            let foundAnime = false;
        
            while (!foundAnime) {
                const response = await fetch('https://api.jikan.moe/v4/random/anime');
                if (!response.ok) {
                    console.error('Failed to fetch random anime:', response.status);
                    await interaction.editReply({
                        content: 'Oops! Something went wrong while fetching random anime. Please try again later.',
                        ephemeral: true,
                    });
                    return;
                }
        
                const data = await response.json();
                const animeGenres = data.data.genres.map(g => g.name);
                const airedYear = new Date(data.data.aired.from).getFullYear(); // Extract the aired year
                const animeType = data.data.type;
        
                // Check conditions based on provided options
                const matchesGenre = genre ? animeGenres.includes(genre) : true;
                const matchesYear = year ? airedYear.toString() === year : true;
                const matchesType = type ? animeType === type : true;
        
                // Ensure the fetched type is either "Anime" or "Movie"
                const isValidType = animeType === 'TV' || animeType === 'Movie' || animeType === 'Special';
        
                if (matchesGenre && matchesYear && matchesType && isValidType) {
                    foundAnime = true;
        
                    const animeTitle = data.data.title; 
                    const animeSynopsis = data.data.synopsis;
                    const episodes = data.data.episodes;
                    const aired = data.data.aired.string;
                    const image = data.data.images.jpg.image_url;
                    const mal = data.data.url;
        
                    const embed = {
                        color: 0x0099ff,
                        title: animeTitle,
                        description: animeSynopsis,
                        fields: [
                            { name: 'Episodes', value: `${episodes}`, inline: true },
                            { name: 'Aired', value: `${aired}`, inline: true },
                            { name: 'Type', value: `${animeType}`, inline: true },
                            { name: 'Genres', value: `${animeGenres.join(', ')}`, inline: true },
                            { name: 'MyAnimeList', value: `[MyAnimeList](${mal})`, inline: true }
                        ],
                        image: {
                            url: image,
                        },
                        footer: {
                            text: 'Enjoy your anime!',
                        },
                    };
        
                    await interaction.editReply({ embeds: [embed] });
                }
            }
        
            // If no anime is found matching the criteria after several attempts
            if (!foundAnime) {
                await interaction.editReply({ content: 'No anime found matching your criteria.' });
            }
        
        } catch (error) {
            console.error('Failed to fetch random anime:', error);
            await interaction.editReply({
                content: 'Oops! Something went wrong while fetching random anime. Please try again later.',
                ephemeral: true,
            });
        }
        
    }else if (interaction.commandName === 'postanime'){
        await interaction.editReply('Command is Not Available');

        
    }else if (interaction.commandName === 'postlightnovel'){
        await interaction.reply('Command is Not Available');

    }else if (interaction.commandName === 'getchapter'){
        await interaction.reply('Command is Not Available');

    }else if (interaction.commandName === 'randomword'){
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
            await interaction.reply({ content: '⚠️ Error fetching data from the Japanese API.', ephemeral: true });
        }
    }else if (interaction.commandName === 'timecheck'){

        await interaction.reply(`${timeCheck()}`);
        console.log(getAnswer());

    }else if (interaction.commandName === 'askme'){
        await interaction.reply(`command it yet to be implemented`);
    }else if (interaction.commandName === 'answerforletter') {
        const answer = interaction.options.getString('answer');

        console.log('/answer just ran');
        console.log(getAnswer());
        
    
        if (answer.toLowerCase() === getAnswer().toLowerCase()) {
            await interaction.reply(`${interaction.user.username} has answered correctly!!! ${timeCheck()}`);
        } else {
            await interaction.reply(`Try again!`);
        }
    }
    

  
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error('Failed to log in:', error);
});
