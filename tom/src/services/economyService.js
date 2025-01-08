const User = require('../models/user');
async function getUserBalance(userId) {
    const user = await User.findOne({ userId });

    if (!user) {
        return 0;
    }

    return user.balance;
}

async function transferMoney(fromUserId, toUserId, amount) {
    const session = await User.startSession();
    try {
        await session.withTransaction(async () => {
            const fromUser = await User.findOne({ userId: fromUserId }).session(session);
            const toUser = await User.findOne({ userId: toUserId }).session(session);

            if (!fromUser || fromUser.balance < amount) {
                throw new Error('Insufficient balance');
            }

            fromUser.balance -= amount;
            await fromUser.save({ session });

            if (!toUser) {
                await User.create({ userId: toUserId, balance: amount }, { session });
            } else {
                toUser.balance += amount;
                await toUser.save({ session });
            }
        });
    } finally {
        await session.endSession();
    }
}

module.exports = {
    getUserBalance,
    transferMoney
};
