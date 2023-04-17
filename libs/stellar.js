/**
 * stellar.js
 * Handles all Stellar Blockchain transactions &
 * check-in methods, likev verify tx hash
 */

const { tokens } = require('./tokens');
const { Keypair, TimeoutInfinite, StrKey } = require('stellar-base');
const stellar = require('stellar-sdk');
const { appLogger } = require('./logger');

const server = new stellar.Server("https://horizon.stellar.org");
const issuerPair = Keypair.fromSecret(process.env.WALLET_KEY);

const withdrawToWallet = (memo, amount, currency, wallet) => {
    return new Promise((resolve, reject) => {

        if (!isValidAddress(wallet)) {
            return resolve(false)
        }

        let asset = tokens[currency];
        let stellarAsset = new stellar.Asset(asset.asset_code, asset.asset_issuer)

        if (asset.asset_code == "XLM") {
            stellarAsset = new stellar.Asset.native();
        }

        server.loadAccount(issuerPair.publicKey())
        .then(function (source) {
            var transaction = new stellar.TransactionBuilder(source, {
                fee: "50000",
                networkPassphrase: stellar.Networks.PUBLIC,
            })
            .addOperation(stellar.Operation.payment({
                destination: wallet,
                amount: parseFloat(amount).toFixed(7),
                asset: stellarAsset
            }))
            .addMemo(stellar.Memo.text(memo))
            .setTimeout(TimeoutInfinite)
            .build();
            transaction.sign(issuerPair); 
            return server.submitTransaction(transaction);
        })
        .then(async (data) => {
            resolve(true)
        })
        .catch(async (error) => {
            appLogger('error', error)
            if (!error.config.data) {
                return resolve(false);
            }
            /**
             * Catch transaction fails due to fees
             */
            let bumpTransaction = await feeBumpTransaction(error, issuerPair);
            if (!bumpTransaction) {
                return resolve(false)
            }
            resolve(true)
        });
    })
};

const feeBumpTransaction = (error, issuerPair) => {
    return new Promise((resolve, reject) => {
        const lastTx = new stellar.TransactionBuilder.fromXDR(decodeURIComponent(error.config.data.split('tx=')[1]), stellar.Networks.PUBLIC);

        server.submitTransaction(lastTx).catch(function (error) {
            if (isFeeError(error)) {
                let bump = new stellar.TransactionBuilder.buildFeeBumpTransaction(
                    issuerPair,
                    "50000" * 10,
                    lastTx,
                    stellar.Networks.PUBLIC
                );
                bump.sign(issuerPair);
                return server.submitTransaction(bump);
            }
        }).then(() => {
            resolve(true)
        }).catch(error => {
            appLogger('error', error)
            resolve(false)
        });
    })
}

const isFeeError = (error) => {
    return (
      error.response !== undefined &&
      error.status === 400 &&
      error.extras &&
      error.extras.result_codes.transaction === sdk.TX_INSUFFICIENT_FEE
    );
}

const isValidAddress = (address) => {
    let validAddress = /([A-Za-z]+([0-9]+[A-Za-z]+)+)/.test(address);
    let validAddressChain = StrKey.isValidEd25519PublicKey(address);
    if (validAddress && validAddressChain) {
        return true;
    }
    return false;
}

const validateAsset = (client, command, target) => {
    // let currency = command.currency;
    console.log(JSON.stringify(command))
    // console.log("CURRENCY: "+currency)
    // let token = currency.toUpperCase();
    // console.log("TOKEN: "+token)
    if (!tokens[command.currency]) {
        client.say(target, `Invalid currency, currency supported: `);
        for (key in tokens) {
            client.say(target, `💰 - ${key}`);
        }
        return false;
    }
    return true;
}

module.exports = { withdrawToWallet, isValidAddress, validateAsset };