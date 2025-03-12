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
};
module.exports = answerHandler;