module.exports = {
    name: 'ping',
    description: 'Check the bot\'s latency',
    usage: '!ping',
    execute: async (message, args) => {
        const startTime = Date.now();
        const reply = await message.channel.send('Pinging...');
        const endTime = Date.now();
        const latency = endTime - startTime;

        reply.edit(`Pong! Latency = ${latency}ms`);
    }
};