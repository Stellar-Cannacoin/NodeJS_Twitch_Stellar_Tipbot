/**
 * tokens.sample.js
 * Sample file on how to whitelist specific tokens for the tipbot
 * Rename to 'tokens.js' in order to run the example
 */
const tokens = {
    XLM: {
        asset_code: "",
        asset_issuer: ""
    },
    USDC: {
        asset_code: "",
        asset_issuer: "",
    }
}

const usertokens =  {
    XLM: 0,
    USDC: 0,
}

module.exports = { tokens, usertokens }