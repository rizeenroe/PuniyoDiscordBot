const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const db = require("../database/firebase");
const embedText = require("../functions/utils/embedText");

module.exports = {
   data: new SlashCommandBuilder()
      .setName('post')
      .setDescription('Posts the manga/manwha to server')
      .addStringOption(option => 
         option.setName('title')
            .setDescription('Title of the manga')
            .setRequired(true)
      )
      .addStringOption(option => 
         option.setName('rating')
            .setDescription('Your personal rating')
            .setRequired(true)
      )
      .addStringOption(option =>
         option.setName('comment')
            .setDescription('Your personal comment on the manga')
            .setRequired(false)
      ),
   
   async execute(interaction) {
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
            await interaction.followUp({ content: 'Please provide a valid rating between 1 and 10.' });
            return;
         }
      }

      try {
         const res = await axios.get('https://api.mangadex.org/manga', { params: { title: title } });
         if (!res.data || res.data.data.length === 0) {
            await interaction.followUp({ content: 'No manga found with that title. Please try again.' });
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
         if (imageCoverId) {
            const imageData = await axios.get(`https://api.mangadex.org/cover/${imageCoverId}`);
            const imageLocation = imageData.data.data.attributes.fileName;
            imageUrl = `https://uploads.mangadex.org/covers/${mangaId}/${imageLocation}`;
         }

         const status = manga.attributes.status || "Unknown";
         const year = manga.attributes.year || "Unknown";
         const description = manga.attributes.description?.en || "No description available.";

         const sideStories = manga.relationships.filter(rel => rel.type === "manga" && rel.related === "side_story");
         let sideStoriesMessage = sideStories.map(story => `\n- [${story.attributes?.title?.en || "Untitled"}](https://mangadex.org/title/${story.id}) (side story)`).join('');

         let serverMangaRatingMessage = "**Server Rating: **";
         const serverDocRef = db.collection("servers").doc(interaction.guildId);
         const serverDoc = await serverDocRef.get();

         if (serverDoc.exists) {
            const mangaDoc = await serverDocRef.collection("mangas").doc(mangaId).get();
            if (mangaDoc.exists) {
               const mangaData = mangaDoc.data();
               serverMangaRatingMessage += `${mangaData.totalRating} (${mangaData.totalReviews})`;
            }
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
         await interaction.followUp({ content: 'Sorry, I could not find any manga. Please try again later.' });
      }
   }
};
