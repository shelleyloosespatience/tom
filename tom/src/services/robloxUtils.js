const noblox = require('noblox.js');
const axios = require('axios');
const robot = require('robotjs');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

class RobloxBot {
    constructor() {
        this.cookie = process.env.ROBLOX_COOKIE;
        this.privateServerLink = process.env.PRIVATE_SERVER_LINK;
        this.yoloApiUrl = process.env.YOLO_API_URL; // Python YOLO server URL
        this.isRunning = false;

        this.discord = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });

        this.currentTrade = null;
    }

    async login() {
        try {
            console.log('Logging into Roblox...');
            await noblox.setCookie(this.cookie);
            const currentUser = await noblox.getAuthenticatedUser();
            console.log(`Logged in as: ${currentUser.UserName}`);
        } catch (error) {
            console.error('Failed to log in:', error);
        }
    }

    async joinPrivateServer() {
        try {
            console.log('Joining private server...');
            const gameId = this.privateServerLink.split('/')[4];
            const serverCode = this.privateServerLink.split('privateServerLinkCode=')[1];

            if (!gameId || !serverCode) {
                throw new Error('Invalid private server link.');
            }

            await this.login();
            await noblox.joinPrivateServer(serverCode);
            console.log(`Successfully joined private server ${serverCode} for game ${gameId}.`);
        } catch (error) {
            console.error('Failed to join private server:', error);
        }
    }

    async initTrading() {
        await this.discord.login(process.env.DISCORD_TOKEN);

        this.discord.on('messageCreate', async (message) => {
            if (message.content.startsWith('!trade')) {
                const [_, username, action, petName] = message.content.split(' ');
                await this.handleTradeRequest(message.channel, username, action, petName);
            }
        });

        this.monitorTrades();
    }

    async handleTradeRequest(channel, username, action, petName) {
        this.currentTrade = {
            username,
            action,
            petName,
            discordChannel: channel,
            status: 'waiting',
        };

        await channel.send(
            `🎮 **Trade Request**:
**Player**: ${username}
**Action**: ${action} ${petName}
**Status**: Waiting for player to join...
**Server**: ${this.privateServerLink}`
        );
    }

    async monitorTrades() {
        setInterval(async () => {
            if (this.currentTrade && this.currentTrade.status === 'waiting') {
                const detected = await this.detectTradeGUI();
                if (detected) {
                    await this.processTrade();
                }
            }
        }, 1000);
    }

    async detectTradeGUI() {
        const screenshot = robot.screen.capture();
        const imgBuffer = Buffer.from(screenshot.image, 'base64');

        try {
            const response = await axios.post(this.yoloApiUrl, imgBuffer, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
            });

            console.log("YOLO Detection Result:", response.data);
            return response.data.some(obj => obj.label === "Trade Window");
        } catch (error) {
            console.error('YOLO detection failed:', error);
            return false;
        }
    }

    async processTrade() {
        try {
            await this.autoAcceptTrade();
            await this.currentTrade.discordChannel.send(
                `✅ **Trade Completed!**
**Player**: ${this.currentTrade.username}
${this.currentTrade.action === 'give' ? 'Gave' : 'Received'}: ${this.currentTrade.petName}`
            );
        } catch (error) {
            console.error('Trade error:', error);
            await this.currentTrade.discordChannel.send(`❌ **Trade failed**: ${error.message}`);
        } finally {
            this.currentTrade = null;
        }
    }

    async autoAcceptTrade() {
        const tradePositions = await this.detectTradePositions();
        robot.moveMouseSmooth(tradePositions.acceptTrade.x, tradePositions.acceptTrade.y);
        robot.mouseClick();
        await this.sleep(1000);
        robot.moveMouseSmooth(tradePositions.confirmTrade.x, tradePositions.confirmTrade.y);
        robot.mouseClick();
    }

    async detectTradePositions() {
        // Dummy positions; use YOLO results in production
        return {
            acceptTrade: { x: 800, y: 450 },
            confirmTrade: { x: 950, y: 500 },
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = RobloxBot;
