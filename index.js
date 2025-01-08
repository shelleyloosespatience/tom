require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { loadCommands, loadEvents } = require("./tom/src/utils/loader");
const mongoose = require("mongoose");
const RobloxBot = require("./tom/src/services/robloxUtils");

const robloxBot = new RobloxBot();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();
client.prefixCommands = new Collection();
client.slashCommands = new Collection();
client.prefix = "!";

// Discord bot initialization
client.once("ready", async () => {
  if (!client.user) {
    console.error("Discord bot login failed: client.user is undefined");
    return;
  }
  console.log(`Logged in to Discord as ${client.user.tag}`);

  try {
    await robloxBot.login();
    console.log("Roblox bot logged in successfully.");
  } catch (error) {
    console.error("Failed to initialize Roblox bot:", error);
  }
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Load commands and events
(async () => {
  try {
    await loadCommands(client);
    await loadEvents(client);
    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error("Initialization error:", error);
  }
})();
