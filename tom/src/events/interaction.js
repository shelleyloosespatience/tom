const fs = require('fs');
const path = require('path');

module.exports = async (interaction) => {
    if (!interaction.isCommand()) return;
    const commandsPath = path.join(__dirname, '../commands/slash/');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    const commands = new Map();
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        commands.set(command.name, command);
    }

    const commandName = interaction.commandName;

    if (!commands.has(commandName)) {
        return interaction.reply({ content: 'Unknown command!', ephemeral: true });
    }
    const command = commands.get(commandName);
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command "${commandName}":`, error);
        interaction.reply({
            content: 'There was an error while executing this command.',
            ephemeral: true,
        });
    }
};
