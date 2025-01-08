const { Collection } = require('discord.js');

const buttonInteractions = new Collection();

/**
 * Register a button interaction without timeout.
 * @param {string} customId - The custom ID of the button.
 * @param {string[]} authorizedIds - Array of authorized user IDs.
 * @param {Function} callback - Callback function to handle the button interaction.
 */
function registerButton(customId, authorizedIds, callback) {
    buttonInteractions.set(customId, { callback, authorizedIds });
}

/**
 * Handle a button interaction dynamically.
 * @param {object} interaction - The interaction object from Discord.js.
 */
async function handleButton(interaction) {
    if (!interaction.isButton()) return;

    const handlerData = buttonInteractions.get(interaction.customId);

    if (!handlerData) {
        return interaction.reply({
            content: 'This button is no longer active or unregistered.',
            ephemeral: true,
        });
    }

    const { callback, authorizedIds } = handlerData;

    if (authorizedIds.length > 0 && !authorizedIds.includes(interaction.user.id)) {
        return interaction.reply({
            content: 'You are not authorized to use this button.',
            ephemeral: true,
        });
    }

    try {
        await callback(interaction);
    } catch (error) {
        console.error(`Error handling button: ${error}`);
        await interaction.reply({
            content: 'An error occurred while processing this action.',
            ephemeral: true,
        });
    }
}

/**
 * Remove a registered button interaction when the ticket/channel is resolved.
 * @param {string} customId - The custom ID of the button to unregister.
 */
function unregisterButton(customId) {
    buttonInteractions.delete(customId);
}

module.exports = { registerButton, handleButton, unregisterButton };