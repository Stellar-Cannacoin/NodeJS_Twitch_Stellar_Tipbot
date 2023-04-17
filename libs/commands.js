const moment = require("moment");
const { getUserBalance, tipUser, withdrawFunds, airdropUsers, getUserBalances, getLeaderBoard, verifyMemo, createUser } = require("./database");
const { isValidAddress } = require("./stellar");

const twitchTipUser = async (argument) => {
    return new Promise(async (resolve) => {
        /**
         * Run database function to transfer funds from one user to another
         */
        if (!argument.user || !argument.amount || !argument.currency) {
            resolve(`Incomplete command, use '!tiphelp' to read more`)
        }

        let response = await tipUser(argument.sender, argument.user, argument.amount, argument.currency)
        if (!response) {
            resolve(`Something failed`)
        }
        resolve(`💚 Tipped @${argument.user} - ${argument.amount} ${argument.currency}`)
    });
}

const twitchDepositUser = async (argument) => {
    return new Promise(async (resolve) => {
        /**
         * Run database function to fetch users memo and return deposit address
         */
        let verifiedMemo = await verifyMemo(argument.user);
        if (!verifiedMemo) {
            createUser(argument.user)
        }
        resolve(`Deposit funds to ${process.env.WALLET_ADDRESS} with memo: ${argument.user}`)
    });
}

const twitchWithdrawUser = async (argument) => {
    return new Promise(async (resolve) => {
        /**
         * Run database function to decrase user funds and
         * build Stellar transaction to transfer the funds
         */
        if (!argument.user || !argument.amount || !argument.currency || !argument.address) {
            return resolve(`Incomplete command, use '!tiphelp' to read more`)
        }

        if (!isValidAddress(argument.address)) {
            return resolve(`Invalid Stellar address`)
        }

        let response = await withdrawFunds(argument.user, argument.amount, argument.currency, argument.address);
        if (!response) {
            resolve(`Not enough user funds`)
        }

        resolve(`Request to withdraw ${argument.amount} ${argument.currency} have been queued`)
    });
}

const twitchTranferUserFunds = async (argument) => {
    return new Promise(async (resolve) => {
        /**
         * Run database function to decrase user funds and
         * build Stellar transaction to transfer the funds
         */
        resolve('Decprecated command')
        return;
        if (!argument.user || !argument.amount ||  !argument.exchange || !argument.transfer || !argument.currency) {
            resolve(`Incomplete command, use '!tiphelp' to read more`)
        }
        let response = await withdrawFunds(argument.user, argument.amount, argument.currency, argument.exchange);
        if (!response) {
            resolve(`Not enough user funds`)
        }
        resolve(`Request to withdraw ${argument.amount} ${argument.currency} have been queued`)
    });
}
const twitchBalanceUser = async (argument) => {
    return new Promise(async (resolve) => {
        /**
         * Get user balance
         */
        if (!argument.user) {
            resolve(`Incomplete command, use '!tiphelp' to read more`)
        }

        if (!argument.currency) {
            resolve(`Missing currency, use '!tiphelp' to read more`)
        }
        
        let balance = await getUserBalance(argument.user, argument.currency);
        if (!balance) {
            resolve(`💰 @${argument.user}'s balance: 0 ${argument.currency}`)
        }
        resolve(`💰 @${argument.user}'s balance: ${balance} ${argument.currency}`)
    })
}
const twitchBalancesUser = async (argument) => {
    return new Promise(async (resolve) => {
        /**
         * Get user balance
         */
        if (!argument.user) {
            resolve(`Incomplete command, use '!tiphelp' to read more`)
        }

        // if (!argument.currency) {
        //     resolve(`Missing currency, use '!tiphelp' to read more`)
        // }
        
        let balances = await getUserBalances(argument.user);
        // if (!balances) {
        //     resolve(`💰 @${argument.user}'s balance: 0 ${argument.currency}`)
        // }
        resolve(balances)
        // resolve(`💰 @${argument.user}'s balance: ${balances} ${argument.currency}`)
    })
}
const twitchLeaderboard = async (argument) => {
    return new Promise(async (resolve) => {
        /**
         * Get tip leaderboard
         */
        let leaderboard = await getLeaderBoard();
        if (!leaderboard) {
            resolve(`No leaderboard yet.. Take the 1st place 🎖️`)
        }

        resolve(leaderboard)
    })
}
const twitchAirdrop = async (argument) => {
    return new Promise(async (resolve) => {
        if (!argument.user) {
            resolve(`Incomplete command, use '!tiphelp' to read more`)
            return;
        }
        let activeUsers = [];
        let activeUsersPing = [];
        for (const key in argument.users) {
            let active_since = moment().diff(moment(argument.users[key].last_seen), 'minutes');
            if (active_since > 10) {
                return;
            }
            activeUsers.push(key.toLowerCase())
            activeUsersPing.push(` @${key}`)
        }

        let filteredUsers = activeUsers.filter(user => user.toLowerCase() != argument.user.toLowerCase());
        let filteredUsersPing = activeUsersPing.filter(user => user.toLowerCase() != ` @${argument.user.toLowerCase()}`);
        
        let airdrop = await airdropUsers(argument.user, argument.amount, argument.currency, filteredUsers);
        
        resolve(`🪂 Airdropped ${(argument.amount/filteredUsers.length)} ${argument.currency} to: ${filteredUsersPing}`)
    })
}
const twitchHelpUser = async (argument) => {
    return new Promise((resolve) => {
        resolve(`- TWITCH STELLAR TIPBOT USER GUIDE\n
            ====================================\n\n
            - !tiphelp (user guide)\n
            - !bal (view your tip balance)\n
            - !tip [@username] [AMOUNT] [CURRENCY] (tip a user in the chat)\n
            - !leaderboard (view tip leaderboard)\n
            - !withdraw [AMOUNT] [CURRENCY] [STELLAR ADDRESS] (withdraw user funds to a Stellar wallet)\n
            - !deposit (deposit funds)\n
        `);
    });
}

const sendCommand = (str, context) => {
    let regex = /![A-Za-z0-9]+\s@[A-Za-z0-9]+\s[0-9]+\s[A-Za-z]+/g;

    // let regexCommand = /![A-Za-z0-9]+\s/g;
    let regexCommand = /[A-Za-z0-9]+/g;
    // let regexUser = /[A-Za-z0-9/\-/\_]+/g;
    let regexUser = /@[A-Za-z0-9_]+/g;
    // +_[A-Za-z0-9]
    // let regexAmount = /[0-9]+/g;
    let regexAmount = /[0-9.]+\s/g;
    let regexCurrency = /[A-Z]+/g
    let regexAddress = /[A-Za-z0-9]+/g;
    let regexTransfer = /[A-Za-z0-9]+/g;
    let regexExchange = /tip\.cc+/g;


    let command = Array.from(str.matchAll(regexCommand), m => m[0])[0];
    let user = Array.from(str.matchAll(regexUser), m => m[0])[0];
    let amount = Array.from(str.matchAll(regexAmount), m => m[0])[0];
    let currency = Array.from(str.matchAll(regexCurrency), m => m[0])[0];
    let address = Array.from(str.matchAll(regexCommand), m => m[0])[3];
    let transfer = Array.from(str.matchAll(regexTransfer), m => m[0])[5];
    let exchange = Array.from(str.matchAll(regexExchange), m => m[0])[0];

    /** Add supports for lowercase tokens ex. xlm/XLM */
    if (command == "balance") {
        currency = Array.from(str.matchAll(/[A-Za-z]+/g), m => m[0])[1].toUpperCase();
    }

    /** Add supports for lowercase tokens ex. xlm/XLM */
    if (command == "tip") {
        currency = Array.from(str.matchAll(/[A-Za-z]+/g), m => m[0])[2].toUpperCase();
    }

    if (!user) {
        // if (command == "withdraw") {
        //     user = context;
        // }
        user = context;
    } 
    if (user.includes('@')) {
        user = user.split('@')[1];
    }

    return {
        command: command,
        amount: amount,
        user: user,
        sender: context,
        currency: currency,
        address: address,
        transfer: transfer
    };
}

module.exports = { sendCommand, twitchTipUser, twitchBalanceUser, twitchBalancesUser, twitchDepositUser,twitchTranferUserFunds, twitchWithdrawUser, twitchHelpUser, twitchAirdrop, twitchLeaderboard }