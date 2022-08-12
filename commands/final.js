const stringSimilarity = require("string-similarity");
const { SlashCommandBuilder, inlineCode, bold, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { logInfo, logError } = require('../common.js');

const RATING_ACCEPTANCE_RATE = 0.4;

const getFinalDate = final => {
    return final.dataValues.date;
}

const getFinalURL = final => {
    return final.dataValues.fileURL;
}

const getUserWhoUploaded = final => {
    return final.dataValues.uploadUser;
}

const getSubjectName = async (subject, interaction) => {
    const Subject = interaction.client.models.get('Subject').model;
    
    const allSubjects = await Subject.findAll();
    const allSubjectsNames = [...allSubjects].map(s => s.dataValues.name);

    const subjectWithRomanLetters = subject.replace('1', 'I').replace('2', 'II').replace('3', 'III');
    const matches = stringSimilarity.findBestMatch(subjectWithRomanLetters.toString(), allSubjectsNames);
    const nameMatched = matches.bestMatch.target;
    const matchRating = matches.bestMatch.rating;

    if (matchRating < RATING_ACCEPTANCE_RATE) {
        throw 'Es difícil saber a qué materia te referís. Por favor, tratá de poner el nombre completo.';
    }
    
    return nameMatched;
}

const getAllFinalsOf = async (subjectName, interaction) => {
    const Final = interaction.client.models.get('Final').model;
    const Subject = interaction.client.models.get('Subject').model;

    const wantedSubject = await Subject.findOne({ where: { name: subjectName } });
    console.log(`${logInfo} - Requesting final for '${wantedSubject.name}'`);
    
    const allFinals = await Final.findAll({ where: { SubjectId: wantedSubject.id }});
    return allFinals;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('final')
        .setDescription('Te da un final de una materia.')
        .addStringOption(option =>
            option.setName('materia')
                .setDescription('La materia que querés buscar.')    
                .setRequired(true)
        ),
    async execute(interaction) {
        const subject = interaction.options.get('materia')['value'];
        try {
            // TODO: let the user pick what final to choose
            const fullSubjectName = await getSubjectName(subject, interaction);
            const allMatchedFinals = await getAllFinalsOf(fullSubjectName, interaction);
            if (allMatchedFinals.length == 0) {
                throw `No se encontró ningún final de ${bold(fullSubjectName)}, por el momento.`
            }
            // TODO: go for each final and let the user choose what to download
            // or maybe just list all of them? and let the user choose which one with a param

            // gets a random final!
            const final = allMatchedFinals[Math.floor(Math.random() * allMatchedFinals.length)];
            const finalDate = new Date(getFinalDate(final)).getFullYear();
            const finalURL = getFinalURL(final);
            const finalUploadUser = getUserWhoUploaded(final);
            const message = (finalDate < 2010) ?
                `${bold(fullSubjectName.toUpperCase())}\n\nAgarré un final al azar de andá a saber cuándo, ahora ponete a estudiar. Subido por ${inlineCode(finalUploadUser)}.` :
                `${bold(fullSubjectName.toUpperCase())}\n\nAgarré un final al azar. Este es del ${finalDate}, ahora ponete a estudiar. Subido por ${inlineCode(finalUploadUser)}.`;

            await interaction.reply({
                files: [{
                    attachment: finalURL,
                }],
                content: message,
            });

            console.log(`${logInfo} - Successfully sent final`);
        } catch(error) {
            console.error(`${logError} - Info: ${error}, command: /final`);
            interaction.reply({ content: `Hubo un error al buscar un final, ${interaction.user}: ${error}`, ephemeral: true });
        }
    },
};