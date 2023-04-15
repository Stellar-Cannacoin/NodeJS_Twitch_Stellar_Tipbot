# Twitch Stellar Tipbot Installation Guide

Welcome to the installation guide for the Twitch Stellar Tipbot! Follow the steps below to set up the tipbot on your own server.

## Prerequisites
- Node.js (v14 or higher) installed on your machine
- A Twitch account with a registered bot account
- MongoDB database running

## Installation Steps
1. Clone the Twitch Stellar Tipbot GitHub repository to your local machine:
2. Navigate to the project directory
3. Install the dependencies using npm or yarn ``npm install``
4. Setup a `.env` file in the root of the project directory. You can use the provided `sample.env` file as a template. Update the following variables in the .env file with your own values:
```
BOT_WELCOME_MESSAGE=""

TWITCH_USERNAME=""
TWITCH_PASSWORD="oauth:PASSWORD"
TWITCH_CHANNELS=""

ACCESS_TOKEN=""
REFRESH_TOKEN=""
CLIENT_ID=""

DATABASE_URL="mongodb://localhost:27017"
DATABASE_NAME=""

WALLET_ADDRESS=""
WALLET_KEY=""

ENVIRONMENT="dev"

CLIENT_APP_ID=""
CLIENT_APP_SECRET=""
```
5. Create a `tokens.js` file in the config directory. You can use the provided `tokens.sample.js` file as a template.
```
{
    XLM: {
        asset_code: "",
        asset_issuer: ""
    },
    USDC: {
        asset_code: "",
        asset_issuer: "",
    }
}
```
6. Make sure your MongoDB database is up and running. Update the `DATABASE_URL` variable in the `.env` file with the connection URI for your MongoDB database.
7. Start the tipbot server: ```npm start ``` or ```node server.js ```

Congratulations! You have successfully installed the Twitch Stellar Tipbot on your server. The bot is now ready to accept tips in the allowed tokens on the Twitch channel specified in the `.env` file.

Note: Make sure to keep your `.env` file and tokens.js file secure and do not share them publicly, as they contain sensitive information such as your Twitch bot's OAuth token and your Stellar account keys.

For more information on how to use the Twitch Stellar Tipbot, refer to the documentation provided in the repository. 

✨ Happy tipping!