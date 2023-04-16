const { MongoClient } = require('mongodb');
const { appLogger } = require('./logger');
const { withdrawToWallet } = require('./stellar');
const { usertokens } = require('./tokens');

const client = new MongoClient(process.env.DATABASE_URL);
const db = client.db(process.env.DATABASE_NAME);

const main = async () => {
    await client.connect();

    appLogger('log', 'Connected to database')
    return true;
}

const tipUser = (from, to, amount, currency) => {
    return new Promise(async (resolve, reject) => {
        let balance = await getUserBalance(from, currency)

        if (amount > balance) {
            resolve(false)
            return;
        }

        const collection = db.collection('users');
        let balanceCurrency = `balances.${currency}`

        collection.updateOne({username: from.toLowerCase()}, {$inc: {[balanceCurrency]: parseFloat(-amount)}})
        collection.updateOne({username: from.toLowerCase()}, {$inc: { "total_tips": parseFloat(amount)}})
        collection.updateOne({username: to.toLowerCase()}, {$inc: { [balanceCurrency]: parseFloat(amount)}}, {upsert: true})
        resolve(true)
    })
}

const airdropUsers = (from, amount, currency, users) => {
    return new Promise(async (resolve, reject) => {
        let balance = await getUserBalance(from, currency)
        if (amount > balance) {
            resolve(false)
            return;
        }

        const collection = db.collection('users');
        let balanceCurrency = `balances.${currency}`

        collection.updateOne({username: from.toLowerCase()}, {$inc: {[balanceCurrency]: parseFloat(-amount)}},  {upsert: true})
        collection.updateOne({username: from.toLowerCase()}, {$inc: { "total_tips": parseFloat(amount)}})

        users.map(user => {
            collection.updateOne({username: user.toLowerCase()}, {$inc: {[balanceCurrency]: parseFloat(amount)}},  {upsert: true})
        })
        resolve(true)
    })
}

const withdrawFunds = (from, amount, currency, address) => {
    return new Promise(async (resolve, reject) => {
        let balance = await getUserBalance(from, currency)
        if (balance < amount) {
            resolve(false)
            return;
        }

        let stellar = await withdrawToWallet(from, amount, currency, address)

        if (!stellar) {
            resolve(false)
            return;
        }

        const collection = db.collection('users');
        let balanceCurrency = `balances.${currency}`

        collection.updateOne({username: from.toLowerCase()}, {$inc: { [balanceCurrency]: parseFloat(-amount)}})
        resolve(true)
    })
}

const getLeaderBoard = () => {
    return new Promise(async (resolve, reject) => {
        const collection = db.collection('users');
        try {
            const leaderboard = await collection.find().sort({total_tips: -1}).limit(5).toArray();
            if (!leaderboard) {
                return resolve([])
            }
            resolve(leaderboard)
        } catch (error) {
            resolve([])
        }
    })
}
const getUserBalance = (username, currency) => {
    return new Promise(async (resolve, reject) => {
        const collection = db.collection('users');
        try {
            const { balances } = await collection.findOne({username: username})
            resolve(balances[currency])
        } catch (error) {
            resolve(0)
        }
    })
}
const getUserBalances = (username) => {
    return new Promise(async (resolve, reject) => {
        const collection = db.collection('users');
        try {
            const { balances } = await collection.findOne({username: username})
            resolve(balances)
        } catch (error) {
            resolve({"XLM": 0, "USDC": 0})
        }
    })
}
const depositFunds = (username, hash, amount, asset) => {
    return new Promise(async (resolve, reject) => {
        const collection = db.collection('users');
        const collectionT = db.collection('transactions');
        const verified = await verifyTransaction(hash);

        let balanceCurrency = `balances.${asset}`

        if (verified) {
            const deposit = await collection.updateOne({username: username.toLowerCase()}, { $inc: {[balanceCurrency]: parseFloat(amount)}}, {upsert: true})
            
            if (deposit.modifiedCount == 0) {
                return resolve(false)
            }

            await collectionT.insertOne({hash: hash, amount: amount, username: username, asset: asset});
            return resolve(true)
        }

        return resolve(false)
    })
}
const createUser = (username) => {
    return new Promise(async (resolve, reject) => {
        const collection = db.collection('users');
        await collection.insertOne({ username: username, balances: [usertokens], total_tips: 0 })
        return resolve(true)
    })
}
const verifyTransaction = (hash) => {
    return new Promise(async (resolve, reject) => {
        const collection = db.collection('transactions');
        const transaction = await collection.findOne({hash: hash})

        if (!transaction) {
            /** No transaction found with that hash = valid */
            return resolve(true)
        }
        
        /** Found existing hash in database = invalid */
        return resolve(false)
    })
}

const verifyMemo = async (memo) => {
    const collection = db.collection('users');
    const transaction = await collection.findOne({username: memo.toLowerCase()})

    if (!transaction) {
        /** No user found with that memo = valid */
        return false;
    }
    
    /** Found existing user (memo) in database = invalid */
    return true;
}

main().catch(error => {
    appLogger('error', error)
})

module.exports = { 
    tipUser, 
    airdropUsers, 
    getLeaderBoard, 
    getUserBalance, 
    getUserBalances, 
    withdrawFunds, 
    depositFunds, 
    verifyMemo, 
    createUser
}