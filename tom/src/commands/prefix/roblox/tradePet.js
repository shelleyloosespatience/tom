const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const { monitorTrade } = require('../../../services/robloxAutomation');
const { validateTradeParams } = require('../../../services/validation');
const tradeSchema = new mongoose.Schema({
  initiatorId: String,
  partnerId: String,
  petName: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});
const Trade = mongoose.model('Trade', tradeSchema);

module.exports = {
  name: 'trade',
  description: 'Handles pet trading in Adopt Me',
  async execute(message, args) {
    await mongoose.connect('mongodb://localhost:27017/tradeDB', { useNewUrlParser: true, useUnifiedTopology: true }); //uh ;-; no mongo db used so this is a placeholder ig :3

    if (args.length < 3) {
      return message.reply('❌ Usage: `!trade @user <petname>`');
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser || targetUser.bot || targetUser.id === message.author.id) {
      return message.reply('❌ Mention a valid user to trade with!');
    }

    const petName = args.slice(2).join(' ').trim();
    const validation = validateTradeParams(petName);

    if (!validation.valid) {
      return message.reply(`❌ ${validation.reason}`);
    }

    // Save trade to DB
    const trade = new Trade({
      initiatorId: message.author.id,
      partnerId: targetUser.id,
      petName,
    });

    try {
      await trade.save();
    } catch (err) {
      return message.reply('❌ Could not save trade. Please try again later.');
    }

    // Initial Embed
    const embed = new EmbedBuilder()
      .setTitle('🤝 New Trade Request')
      .setColor('#FFD700')
      .addFields(
        { name: 'Initiator', value: message.author.tag, inline: true },
        { name: 'Partner', value: targetUser.tag, inline: true },
        { name: 'Pet', value: petName },
        { name: 'Status', value: '⏳ Waiting for partner to accept...' }
      );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept_trade')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('decline_trade')
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({ embeds: [embed], components: [buttons] });
    const filter = (i) => [message.author.id, targetUser.id].includes(i.user.id);
    const collector = msg.createMessageComponentCollector({ filter, time: 300000 });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'accept_trade' && interaction.user.id === targetUser.id) {
        trade.status = 'Accepted';
        await trade.save();

        embed.setFields(
          { name: 'Initiator', value: message.author.tag, inline: true },
          { name: 'Partner', value: targetUser.tag, inline: true },
          { name: 'Pet', value: petName },
          { name: 'Status', value: '✔️ Partner accepted the trade! Initiating automation...' }
        );
        await msg.edit({ embeds: [embed], components: [] });
        try {
          await monitorTrade(message.author.id, targetUser.id, petName);
          trade.status = 'Completed';
          await trade.save();

          embed.setFields(
            { name: 'Initiator', value: message.author.tag, inline: true },
            { name: 'Partner', value: targetUser.tag, inline: true },
            { name: 'Pet', value: petName },
            { name: 'Status', value: '✅ Trade completed successfully!' }
          );
          await msg.edit({ embeds: [embed] });
        } catch (error) {
          trade.status = 'Failed';
          await trade.save();

          embed.setFields(
            { name: 'Initiator', value: message.author.tag, inline: true },
            { name: 'Partner', value: targetUser.tag, inline: true },
            { name: 'Pet', value: petName },
            { name: 'Status', value: `❌ Trade failed: ${error.message}` }
          );
          await msg.edit({ embeds: [embed] });
        }
        collector.stop();
      } else if (interaction.customId === 'decline_trade' && interaction.user.id === targetUser.id) {
        trade.status = 'Declined';
        await trade.save();

        embed.setFields(
          { name: 'Initiator', value: message.author.tag, inline: true },
          { name: 'Partner', value: targetUser.tag, inline: true },
          { name: 'Pet', value: petName },
          { name: 'Status', value: '❌ Partner declined the trade.' }
        );
        await msg.edit({ embeds: [embed], components: [] });
        collector.stop();
      } else {
        interaction.reply({ content: '❌ You cannot perform this action!', ephemeral: true });
      }
    });

    collector.on('end', async () => {
      if (trade.status === 'Pending') {
        trade.status = 'Expired';
        await trade.save();

        embed.setFields(
          { name: 'Initiator', value: message.author.tag, inline: true },
          { name: 'Partner', value: targetUser.tag, inline: true },
          { name: 'Pet', value: petName },
          { name: 'Status', value: '❌ Trade request expired.' }
        );
        await msg.edit({ embeds: [embed], components: [] });
      }
    });
  },
};
