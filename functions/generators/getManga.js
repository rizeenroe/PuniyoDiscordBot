const axios = require('axios');
const db = require("../../database/firebase");
const embedText = require("../../functions/utils/embedText");

const getManga = async (interaction) => {
   await interaction.deferReply();
   const genre = interaction.options.getString('genre');

   try {
      let manga;

      if (genre) {
         let genreMatch = false;
         while (!genreMatch) {
            const res = await axios.get('https://api.mangadex.org/manga/random');
            manga = res.data.data;
            const mangaTags = manga.attributes.tags;

            genreMatch = mangaTags.some(tag =>
               tag.attributes.name.en.toLowerCase() === genre.toLowerCase()
            );
         }
      } else {
         const res = await axios.get('https://api.mangadex.org/manga/random');
         manga = res.data.data;
      }

      if (manga) {
         const mangaId = manga.id;

         if (!db) {
            console.error('Firebase DB is not initialized.');
            await interaction.followUp('Error: Firestore DB not initialized.');
            return;
         }

         const mangasRef = db.collection("servers").doc(interaction.guildId).collection("mangas");
         const mangaDocRef = mangasRef.doc(mangaId);
         const mangaDoc = await mangaDocRef.get();

         let mangaData = {};
         if (mangaDoc.exists) {
            mangaData = mangaDoc.data();
         }

         const ratingsArray = Object.values(mangaData.users || {}).map(user => user.rating);
         mangaData.totalRating = ratingsArray.length ? (ratingsArray.reduce((a, b) => a + b, 0) / ratingsArray.length) : 0;
         const mangaTitle = manga.attributes.title.en || 'Unknown Title';
         const myAnimeListId = manga.attributes.links?.mal || null;
         const malLink = myAnimeListId ? `\n- [MyAnimeList](https://myanimelist.net/manga/${myAnimeListId})` : "";
         const imageCoverId = manga.relationships.find(rel => rel.type === "cover_art")?.id;
         let imageUrl = "";

         if (imageCoverId) {
            const imageData = await axios.get(`https://api.mangadex.org/cover/${imageCoverId}`);
            const imageLocation = imageData.data.data.attributes.fileName;
            imageUrl = `https://uploads.mangadex.org/covers/${mangaId}/${imageLocation}`;
         }

         const mangaGenres = manga.attributes.tags.map(tag => tag.attributes.name.en).join(', ');
         const status = manga.attributes.status || "Unknown";
         const year = manga.attributes.year || "Unknown";
         const description = manga.attributes.description?.en || "No description available.";

         const sideStories = manga.relationships.filter(rel => rel.type === "manga" && rel.related === "side_story");
         let sideStoriesMessage = sideStories.map(story => `\n- [${story.attributes?.title?.en || "Untitled"}](https://mangadex.org/title/${story.id}) (side story)`).join('');

         let serverMangaRatingMessage = "**Server Rating: **";
         const serverDocRef = db.collection("servers").doc(interaction.guildId);
         const serverDoc = await serverDocRef.get();

         if (serverDoc.exists) {
            const serverMangaDoc = await serverDocRef.collection("mangas").doc(mangaId).get();
            if (serverMangaDoc.exists) {
               const serverMangaData = serverMangaDoc.data();
               serverMangaRatingMessage += `${serverMangaData.totalRating} (${serverMangaData.totalReviews})`;
            } else {
               serverMangaRatingMessage += `0 (0)`;
            }
         }

         let message = `**Title:** ${mangaTitle}`;
         message += `\n**Genres:** ${mangaGenres}`;
         message += `\n**Year:** ${year}`;
         message += `\n**Status:** ${status}`;
         message += `\n- [MangaDex](https://mangadex.org/title/${mangaId})${malLink}`;
         if (sideStories.length > 0) message += sideStoriesMessage;
         message += `\n\n${serverMangaRatingMessage}`;
         message += `\n\n\n**Description:** ${description}`;
         if (!imageUrl) message += `\n**No Cover Found**`;

         // Create and send the embed
         const embed = await embedText(message, interaction, imageUrl);
         await interaction.followUp({ embeds: [embed] });

      } else {
         await interaction.followUp("No manga found.");
      }

   } catch (error) {
      console.error('Error fetching manga:', error);
      await interaction.followUp('An error occurred while fetching manga.');
   }
};

module.exports = { getManga };
