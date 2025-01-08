const { registerButton } = require('../../../handlers/buttonhandler');
const { PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'ticket',
    description: 'Create a support ticket',
    async execute(message, args, client) {
        const user = message.author;
        const guild = message.guild;
        const categoryName = 'Tickets';

        let ticketChannel = guild.channels.cache.find(channel =>
            channel.name === `ticket-${user.username.toLowerCase()}`
        );

        if (ticketChannel) {
            return message.reply(`You already have a ticket open: ${ticketChannel}`);
        }

        let category = guild.channels.cache.find(c => c.name === categoryName && c.type === 4);
        if (!category) {
            category = await guild.channels.create({
                name: categoryName,
                type: 4,
            });
        }

        ticketChannel = await guild.channels.create({
            name: `ticket-${user.username.toLowerCase()}`,
            type: 0,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ],
        });

        const embed = new EmbedBuilder()
            .setTitle('Support Ticket')
            .setDescription('An admin will assist you shortly. Use the buttons below for actions.')
            .setColor('Blue')
            .setFooter({ text: JSON.stringify({ userId: user.id }) });

        const claimButtonId = `claim_${user.id}`;
        const closeButtonId = `close_${user.id}`;

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(claimButtonId)
                .setLabel('Claim Ticket')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(closeButtonId)
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true)
        );

        await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [buttons] });

        registerButton(claimButtonId, [], async (interaction) => {
            const metadata = JSON.parse(embed.footer.text);

            if (metadata.claimedBy) {
                return interaction.reply({
                    content: `This ticket has already been claimed by <@${metadata.claimedBy}>.`,
                    ephemeral: true,
                });
            }

            metadata.claimedBy = interaction.user.id;

            const updatedEmbed = EmbedBuilder.from(embed)
                .setFooter({ text: JSON.stringify(metadata) })
                .setColor('Green');

            buttons.components[0].setDisabled(true); 
            buttons.components[1].setDisabled(false); 

            await interaction.message.edit({
                embeds: [updatedEmbed],
                components: [buttons],
            });

            interaction.reply({ content: `Ticket claimed by <@${interaction.user.id}>`, ephemeral: true });
        });

        registerButton(closeButtonId, [user.id], async (interaction) => {
            if (!ticketChannel.deletable) {
                return interaction.reply({
                    content: 'Unable to delete this channel. Ensure I have the required permissions.',
                    ephemeral: true,
                });
            }

            unregisterButton(claimButtonId); 
            unregisterButton(closeButtonId);

            await ticketChannel.delete();
        });

        message.reply(`Your ticket has been created: ${ticketChannel}`);
    },
};
