/**
 * broadcaster.js
 * 
 * Used to broadcast messages to the network,
 * Interval needs to be set in the .env file
 * 
 * TODO:
 * - Add dynamic ad-messages from web-service
 * - Add the option to "buy" ad space in the chat
 */
const cron = require('node-cron');
const { adMessages } = require("../content/ads");
const { appLogger } = require('./logger');

const delay = ms => new Promise(res => setTimeout(res, ms));

const broadcastMessages = (client, target, number) => {
    return new Promise((resolve) => {
        let lastMessageId;
        /**
         * TODO: 
         * Connect with database.js (backend)
         */
        let messages = adMessages();
        messages.map(async (message, index) => {
            if (index >= number) {
                return;
            }

            lastMessageId = message._id;
            client.action(target, `💨 Ads: ${message.title}`);
        })
        resolve(true)
    })
}

const initalizeCronjob = (client, target, number, enabled, crontimer) => {
    if (!enabled) {
        return;
    }

    return cron.schedule(crontimer, () => {
        appLogger('log', 'Broadcasting ads');
        broadcastMessages(client, target, number)
    }).start();
}



module.exports = { broadcastMessages, initalizeCronjob }