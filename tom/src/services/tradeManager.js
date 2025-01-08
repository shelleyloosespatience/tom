const { verifyRobloxUser } = require('./robloxAutomation');

const activeSetups = new Map();

async function handleTradeAcceptance(interaction, initiator, partner, petName) {
    const setupId = generateSetupId();
    activeSetups.set(setupId, {
        initiator: {
            discordId: initiator.id,
            discordTag: initiator.tag,
            robloxUsername: null,
            robloxId: null,
        },
        partner: {
            discordId: partner.id,
            discordTag: partner.tag,
            robloxUsername: null,
            robloxId: null,
        },
        pet: petName,
        stage: 'AWAITING_ROBLOX_INFO',
    });

    await interaction.reply({ content: '✅ Trade accepted! Please provide your Roblox usernames.' });

    const promptEmbed = {
        title: '🎮 Roblox Username Verification',
        description: 'Both users, please type your Roblox username in the format: `roblox:YourUsername`.',
        color: 0x00ff00,
    };

    await interaction.channel.send({ embeds: [promptEmbed] });

    // Collect Roblox usernames
    collectRobloxUsernames(interaction.channel, setupId);
}

async function handleTradeDecline(interaction, initiator, partner) {
    await interaction.update({ content: '❌ Trade declined.', components: [] });
}

function collectRobloxUsernames(channel, setupId) {
    const setup = activeSetups.get(setupId);
    const filter = (m) =>
        [setup.initiator.discordId, setup.partner.discordId].includes(m.author.id) &&
        m.content.toLowerCase().startsWith('roblox:');

    const collector = channel.createMessageCollector({ filter, time: 300000 });

    collector.on('collect', async (msg) => {
        const robloxUsername = msg.content.split(':')[1].trim();
        try {
            const verifyResult = await verifyRobloxUser(robloxUsername);

            if (!verifyResult.success) {
                return msg.reply(`❌ Invalid Roblox username! Error: ${verifyResult.error}`);
            }

            const userType =
                msg.author.id === setup.initiator.discordId ? 'initiator' : 'partner';
            setup[userType].robloxUsername = robloxUsername;
            setup[userType].robloxId = verifyResult.userId;
            msg.reply(`✅ Roblox username verified for ${userType}!`);

            if (setup.initiator.robloxId && setup.partner.robloxId) {
                collector.stop('COMPLETE');
            }
        } catch (error) {
            msg.reply('❌ Error verifying Roblox username. Please try again.');
        }
    });

    collector.on('end', (_, reason) => {
        if (reason !== 'COMPLETE') {
            channel.send('⌛ Timeout: Failed to provide Roblox usernames.');
            activeSetups.delete(setupId);
        }
    });
}

function generateSetupId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `SETUP_${timestamp}_${random}`.toUpperCase();
}

module.exports = { handleTradeAcceptance, handleTradeDecline };
