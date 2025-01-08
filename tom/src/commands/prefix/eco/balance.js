const { EmbedBuilder } = require('discord.js');
const { getUserBalance } = require('../../../services/economyService');

module.exports = {
    name: 'balance',
    description: 'Check your balance.',
    async execute(message, args) {
        try {
            const user = message.mentions.users.first() || message.author;
            const balance = await getUserBalance(user.id);
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`${user.username}'s Balance`)
                .setDescription(`Your current balance is **${balance}** coins.`)
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error checking balance:', error);
            message.channel.send('An error occurred while fetching your balance. Please try again later.');
        }
    }
};