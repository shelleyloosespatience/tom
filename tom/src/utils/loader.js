const fs = require("fs").promises;
const path = require("path");

const loadCommands = async (client) => {
  try {
    console.log("Loading prefix commands...");
    const prefixFolders = await fs.readdir(path.join(__dirname, "../commands/prefix"));
    for (const folder of prefixFolders) {
      const commandFiles = (await fs.readdir(path.join(__dirname, `../commands/prefix/${folder}`)))
        .filter(file => file.endsWith(".js"));
      for (const file of commandFiles) {
        const commandPath = path.join(__dirname, `../commands/prefix/${folder}/${file}`);
        const command = require(commandPath);
        if (command && command.name) {
          client.prefixCommands.set(command.name, command);
          console.log(`Loaded prefix command: ${command.name}`);
        } else {
          console.warn(`Invalid prefix command in file: ${commandPath}`);
        }
      }
    }

    console.log("Loading slash commands...");
    const slashFiles = (await fs.readdir(path.join(__dirname, "../commands/slash")))
      .filter(file => file.endsWith(".js"));
    for (const file of slashFiles) {
      const commandPath = path.join(__dirname, `../commands/slash/${file}`);
      const command = require(commandPath);
      if (command && command.data && command.data.name) {
        client.slashCommands.set(command.data.name, command);
        console.log(`Loaded slash command: ${command.data.name}`);
      } else {
        console.warn(`Invalid slash command in file: ${commandPath}`);
      }
    }

    console.log("Commands loaded successfully.");
  } catch (error) {
    console.error("Error loading commands:", error);
  }
};

const loadEvents = async (client) => {
  try {
    console.log("Loading events...");
    const eventFiles = (await fs.readdir(path.join(__dirname, "../events")))
      .filter(file => file.endsWith(".js"));
    for (const file of eventFiles) {
      const eventPath = path.join(__dirname, `../events/${file}`);
      const event = require(eventPath);
      if (event && event.name) {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args, client));
        } else {
          client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`Loaded event: ${event.name}`);
      } else {
        console.warn(`Invalid event in file: ${eventPath}`);
      }
    }
    console.log("Events loaded successfully.");
  } catch (error) {
    console.error("Error loading events:", error);
  }
};

module.exports = { loadCommands, loadEvents };
