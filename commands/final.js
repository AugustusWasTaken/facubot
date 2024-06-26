const { SlashCommandBuilder, inlineCode, bold } = require('discord.js');
const { logInfo, logError, getSubjectName, getAllRecordsOf, recordInfoUtils, getYearOfRecord, getAsMoment } = require('../common.js');
const { NoFinalsFoundError, NoFinalsFromYearError } = require('../exceptions.js');

const commandSchema = new SlashCommandBuilder()
        .setName('final')
        .setDescription('Te da un final de una materia.')
        .addStringOption(option =>
            option.setName('materia')
                .setDescription('La materia que querés buscar.')    
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('año')
                .setDescription('El año en el que fue tomado.')
                .setRequired(false)
        );

const getIndexOfFinalFromYear = (year, allFinals) => {
    const finalFromYear = allFinals.findIndex(f => getYearOfRecord(f) == year);
    return finalFromYear;
}

module.exports = {
    data: commandSchema,
    async execute(interaction) {
        const getValueOf = option => {
            if (interaction.options.get(option) !== null)
                return interaction.options.get(option)['value'];
        };

        try {
            const subject = getValueOf('materia');
            const fullSubjectName = await getSubjectName(subject, interaction);
            const allMatchedFinals = await getAllRecordsOf('Finals', fullSubjectName, interaction);
            if (allMatchedFinals.length == 0) {
                throw NoFinalsFoundError(fullSubjectName);
            }
            
            const date = getAsMoment(getValueOf('año'));
            const year = (date) ? date.format('YYYY') : undefined;

            // gets a random final as a default!
            let final = allMatchedFinals[Math.floor(Math.random() * allMatchedFinals.length)];

            // if the user decided to look for a specific year, search for it
            if (year) {
                logInfo(`Trying to get a final from ${year}`);
                finalIndex = getIndexOfFinalFromYear(year, allMatchedFinals);

                if (finalIndex != -1) {
                    logInfo('Found final');
                    final = allMatchedFinals[finalIndex];
                } else {
                    logInfo('No final found, returning');
                    throw NoFinalsFromYearError(year);
                }
            }

            const finalYear = recordInfoUtils.getRecordDate(final).format('YYYY');
            const finalURL = recordInfoUtils.getRecordURL(final);
            const finalUploadUser = recordInfoUtils.getUserWhoUploaded(final);
            const replyMessage = 
                (year) ?
                `${bold(fullSubjectName.toUpperCase())}\nEncontré un final del ${finalYear}! Ahora ponete a estudiar. Subido por ${inlineCode(finalUploadUser)}.` :
                (finalYear < 2010) ?
                `${bold(fullSubjectName.toUpperCase())}\nAgarré un final al azar de andá a saber cuándo, ahora ponete a estudiar. Subido por ${inlineCode(finalUploadUser)}.` :
                `${bold(fullSubjectName.toUpperCase())}\nPedazo de boliviano, Agarré un final al azar. Este es del ${finalYear}, ahora ponete a estudiar. Subido por ${inlineCode(finalUploadUser)}.`;

                
            await interaction.deferReply();
            await interaction.editReply({
                files: [{
                    attachment: finalURL,
                }],
                content: replyMessage,
            });
                
            logInfo('Successfully sent final');
        } catch(error) {
            logError(`Info: '${error}', command: /final`);
            interaction.reply({ content: `Hubo un error al buscar un final, ${interaction.user}: ${error}`, ephemeral: true });
        }
    },
    getIndexOfFinalFromYear,
};