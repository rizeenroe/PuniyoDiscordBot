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

client.once("ready", async () => {
    console.log("Bot is ready");

    const random = new SlashCommandBuilder()
        .setName('random')
        .setDescription('Searches a random manga for a user')
        .addStringOption(option =>
            option.setName('genre')
                .setDescription('String input')
                .setRequired(false));

    await client.application.commands.create(random);

    const search = new SlashCommandBuilder()
        .setName('getraw')
        .setDescription('Searches the raw for a manga for a user')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('String input')
                .setRequired(true));

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


    // const getchapter = new SlashCommandBuilder()
    // .setName('getchapter')
    // .setDescription("Posts the a manga's chapter to the server")
    // .addStringOption(option => 
    //     option.setName('title')
    //         .setDescription('String input')
    //         .setRequired(false)
    // );

    // await client.application.commands.create(getchapter);



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


    


});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content.includes('puniyo')) {
        message.reply({
            content: 'Hi, very sorry I cannot produce any bab... I mean mangas yet... come back later :))',
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

client.on('interactionCreate', async (interaction) => {
   if (!interaction.isCommand()) return;

   if (interaction.commandName === 'search') {
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

            //    console.log( res.data.data.id);
               
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


    }else if (interaction.commandName === 'random') {
        const genre = interaction.options.getString('genre');
  
        if (genre) {
            // console.log("Genre specified:", genre);
         
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
  
                // console.log(manga.attributes.tags);
  
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
    }else if (interaction.commandName === 'getraw') {
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

    }else if (interaction.commandName === 'postmanga') {
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

                // console.log( res.data.data.id);
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


    }else if (interaction.commandName === 'randomanime') {
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
        
    }else if (interaction.commandName === 'postanime') {
        const title = interaction.options.getString('title');

       
        const url = `https://api.jikan.moe/v4/anime`
        // let animeNotFound = true;
        // let reseponse;
        // while(animeNotFound){
        //     response = await fetch(url);
        //     data
        // }

        response = await fetch(url);
        

        
        if (!response.ok) {
            console.error('Failed to fetch anime:', response.status);
            await interaction.editReply({
                content: 'Oops! Something went wrong while fetching anime. Please try again later.',
                ephemeral: true,
            });
            return;
        }

        const data = await response.json();
        console.log(data[0].title);
        
        await interaction.deferReply(); 


        // Extract necessary data
        const animeTitle = data.title;
        const animeSynopsis = data.synopsis || "No synopsis available.";
        const episodes = data.episodes || "N/A";
        const aired = data.aired?.string || "Unknown";
        const image = data.images?.jpg.image_url || "";
        const mal = data.url || "";
        const animeType = data.type || "Unknown";
        const animeGenres = data.genres?.map(genre => genre.name) || ["Unknown"];

        // Create embed object
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

        
    }else if (interaction.commandName === 'postlightnovel'){
        await interaction.reply('Command is Not Available');

    }else if (interaction.commandName === 'getchapter'){
        await interaction.reply('Command is Not Available');

    }

  
});






client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error('Failed to log in:', error);
});
