const { MessageEmbed } = require('discord.js');
const { transferMoney } = require('../../../services/economyService');

module.exports = {
name: 'pay',
description: 'Transfer money to another user.',
async execute(message, args) {
try {
const target = message.mentions.users.first();
const amount = parseInt(args[1], 10);

if (!target || isNaN(amount) || amount <= 0) {
return message.reply('Usage: !pay @user <amount>. The amount must be a positive number.');
}

const success = await transferMoney(message.author.id, target.id, amount);

if (success) {
const embed = new MessageEmbed()
    .setColor('#00ff00')
    .setTitle('Transaction Successful')
    .setDescription(`You have paid **${amount}** coins to ${target.username}.`)
    .setTimestamp();

message.channel.send({ embeds: [embed] });
} else {
message.channel.send('Transaction failed. Please ensure you have sufficient balance.');
}
} catch (error) {
console.error('Error transferring money:', error);
message.channel.send('sorry ;c An error occured');
}
}
};