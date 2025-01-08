const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

let db;

// Connect to MongoDB
async function connectToDatabase() {
    if (!db) {
        await client.connect();
        db = client.db('robloxTradeBot');
        console.log('Connected to MongoDB');
    }
    return db;
}

// Log a transaction
async function logTransaction(tradeDetails) {
    const db = await connectToDatabase();
    const collection = db.collection('transactions');
    await collection.insertOne(tradeDetails);
    console.log('Transaction logged:', tradeDetails);
}

// Retrieve transactions by Roblox ID
async function getTransactionsByUser(robloxId) {
    const db = await connectToDatabase();
    const collection = db.collection('transactions');
    return await collection.find({ $or: [{ buyerId: robloxId }, { sellerId: robloxId }] }).toArray();
}

module.exports = {
    logTransaction,
    getTransactionsByUser,
};
