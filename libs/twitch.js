const axios = require('axios')

const tmi = require('tmi.js');
const { commands, sendCommand, twitchTipUser, twitchDepositUser, twitchWithdrawUser, twitchBalanceUser, twitchHelpUser, twitchTranferUserFunds, twitchAirdrop, twitchBalancesUser, twitchLeaderboard } = require('./commands');
const { appLogger } = require('./logger');

let activeChattersObject = {};

let opts = {
    options: { 
        debug: true
    },
    identity: {
      username: process.env.TWITCH_USERNAME,
      password: process.env.TWITCH_PASSWORD
    },
    channels: [
        process.env.TWITCH_CHANNELS
    ]
};

let groupOpts = {
    connection: {
            random: 'group'
    },
    identity: {
        username: process.env.TWITCH_USERNAME,
        password: process.env.TWITCH_PASSWORD
    }
}

const client = new tmi.client(opts);

const connectToServer = () => {
    return new Promise(async (resolve, reject) => {
        
        /**
         * TODO: Write better unit tests
         */
        if (process.env.ENVIRONMENT == "dev") {
            const commandName = "!tip @test 1 XLM";
            const commandDep = "!deposit";
            const commandWith = "!withdraw 1 XLM GAX";
            const commandBal = "!bal";
            const commandHelp = "!tiphelp"

            try {
                const command = sendCommand(commandHelp, "burns");
                const { response } = commands[command.command] || {};
                const clientResponse = await response(command);
                appLogger('log', clientResponse)
            } catch (error) {
                appLogger('error', error)
            }
            return;
        }

        client.on('message', onMessageHandler);
        client.on('connected', onConnectedHandler);
        client.connect()
        .then(data => {
            client.action(process.env.TWITCH_CHANNELS, `🤖 ${process.env.BOT_WELCOME_MESSAGE}`);
            client.action(process.env.TWITCH_CHANNELS, '🤖 Type: !tiphelp to show the user guide.');
            resolve(true)
        })
        .catch(error => {
            appLogger('error', error)
            resolve(false)
        })
    })
}

const generateBearer = () => {
    return new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('client_id', process.env.CLIENT_APP_ID);
        params.append('client_secret', process.env.CLIENT_APP_SECRET);
        params.append('grant_type', 'client_credentials')
        params.append('scope', 'chat:edit chat:read')

        axios.post('https://id.twitch.tv/oauth2/token', params)
        .then(({data}) => {
            console.log(data)
            resolve(data);
        })
        .catch((error) => {
            console.log(error)
            resolve({
                access_token: null, 
                expires_in: new Date(), 
                token_type: 'bearer'
            })
        })
    })
}

const generateClientBearer = (access_token) => {
    return new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('client_id', process.env.CLIENT_APP_ID);
        params.append('client_secret', process.env.CLIENT_APP_SECRET);
        params.append('grant_type', 'client_credentials')
        params.append('scope', 'user_read chat_login chat:edit chat:read')

        axios.post('https://id.twitch.tv/oauth2/token', params)
        .then(({data}) => {
            console.log(data)
            resolve(data);
        })
        .catch((error) => {
            console.log(error)
            resolve({
                access_token: null, 
                expires_in: new Date(), 
                token_type: 'bearer'
            })
        })
    })
}

const bearerExpiry = (totalSeconds) => {
    const totalMinutes = Math.floor(totalSeconds / 60);
  
    const seconds = totalSeconds % 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
  
    return { h: hours, m: minutes, s: seconds };
}

const onMessageHandler = async (target, context, msg, self) => {
    if (self) { return; } 

    const commandName = msg.trim();
    if (!commandName.startsWith('!')) {
        return;
    }

    activeChattersObject[context.username] = {
        last_seen: new Date()
    }

    const command = sendCommand(commandName, context.username);

    try {
        switch (command.command) {
            case 'tip':
                appLogger('log', 'Tipping user')
                const tipResponse = await twitchTipUser(command)
                client.action(target, `${context.username} ${tipResponse}`);
            break;

            case 'deposit':
                appLogger('log', 'User wants to deposit')
                const depositResponse = await twitchDepositUser(command)
                client.say(target, depositResponse);
            break;

            case 'withdraw':
                appLogger('log', 'User withdrawal')
                const withdrawResponse = await twitchWithdrawUser(command)
                client.action(target, withdrawResponse);
            break;

            case 'transfer_dep':
                appLogger('log', 'User withdrawal')
                const transferResponse = await twitchTranferUserFunds(command)
                client.action(target, transferResponse);
            break;

            case 'leaderboard':
                appLogger('log', 'Getting tip leaderboard')
                const leaderboardResponse = await twitchLeaderboard(command);

                leaderboardResponse.map((user, place) => {
                    if (!user.total_tips || user.total_tips <= 0) {
                        return;
                    }
                    place++;
                    client.say(target, `🎖️ ${place}. ${user.username} - ${user.total_tips}`);
                })
            break;

            case 'balance':
                appLogger('log', 'Getting user tip balance')
                
                const balanceResponse = await twitchBalanceUser(command)
                console.log(balanceResponse)
                client.action(target, balanceResponse);
            break;

            case 'balances':
                appLogger('log', 'Getting user tip balance')
                
                const balancesResponse = await twitchBalancesUser(command)
                console.log(balancesResponse)

                client.action(target, `💰 Balances:`);
                for (const key in balancesResponse) {
                    client.action(target, `💰 ${key}: ${balancesResponse[key]}`);
                }
            break;
            case 'airdrop':
                appLogger('log', 'Creating airdrop')
                command.users = activeChattersObject;
                const airdropResponse = await twitchAirdrop(command)
                client.action(target, airdropResponse);
            break;

            case 'tiphelp':
                appLogger('log', 'Showing user guide')

                client.action(target, '🤖 Available commands 🤖');
                client.action(target, '👉 !tip [@username] [amount] [CURRENCY]');
                client.action(target, '👉 !airdrop [amount] [CURRENCY]');
                client.action(target, '👉 !balances');
                client.action(target, '👉 !balance [CURRENCY]');
                client.action(target, '👉 !deposit');
                // client.action(target, '👉 !transfer |amount[ [CURRENCY] tip.cc [memo]');
                client.action(target, '👉 !withdraw [amount] [CURRENCY] [address]');
                client.action(target, '👉 !tiphelp (this)');
            break;
            

            default:
                appLogger('log', 'Invalid command')
                const clientResponse = 'Unsupported command';
                client.say(target, clientResponse);
            break;
        }
    } catch (error) {
        appLogger('error', error)
    }
}

const onConnectedHandler = (addr, port) => {
    appLogger('log' ,`Connected to ${addr}:${port}`);
}

module.exports = { connectToServer, generateBearer }