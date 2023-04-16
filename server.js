require('dotenv').config()

/** Locally provided libraries */
const { appLogger } = require('./libs/logger');
const { connectToServer } = require('./libs/twitch')

const stellar = require('stellar-sdk');
const { depositFunds, verifyMemo } = require('./libs/database');
const { tokens } = require('./libs/tokens');
const server = new stellar.Server("https://horizon.stellar.org");


/** App start here */
appLogger('log', 'Started server');

/** Log tokens list */
if (process.env.ENVIRONMENT == "dev") {
    appLogger('log', 'Supported tokens: ')
    for (key in tokens) {
        appLogger('log', `Token: ${tokens[key].asset_code}`)
    }
}

/** Connect to Stellar */
appLogger('log', 'Stellar service running')
server.transactions()
.forAccount(process.env.WALLET_ADDRESS)
.cursor('now')
.stream({
    onmessage: (transaction) => {
        let { memo, memo_type, hash } = transaction;
        if (memo_type != "text") {
            return;
        }
        appLogger('log', `Found memo: ${memo}`)

        server.operations()
        .forTransaction(hash)
        .call()
        .then(async (operation) => {
            let { asset_code, asset_issuer, asset_type, amount, source_account } = operation.records[0];
            let asset = `${asset_code}:${asset_issuer}`;
            if (asset_type == "native") {
                asset = "XLM";
            }
            /**
             * OPTIONAL: You can check if the user exists before validating funds
             * 
             *  let verifiedMemo = await verifyMemo(memo);
             *  if (!verifiedMemo) {
             *      return;
             *  }
             */
            

            appLogger('log', `Deposit with valid user/memo. Memo: ${memo}`)

            if (source_account == process.env.WALLET_ADDRESS) {
                return;
            }
            depositFunds(memo, hash, amount, asset_code)
        })

    },
    onerror: (error) => {
        appLogger('error', error)
    }
})

/** Connect to Twitch */
connectToServer()
.then(data => {
    if (!data) {
        appLogger('error', data);
        return;
    }
    appLogger('log', 'Twitch service running')
})
.catch(error => {
    appLogger('error', error)
})

