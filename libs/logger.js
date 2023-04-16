const appLogger = (type, message) => {
    let appName = "[TwitchTipBot]"
    switch(type) {
        case "err":
            console.log(`[${new Date().getHours()}:${new Date().getMinutes()}] error: ${JSON.stringify(message)}`)
        break

        case "log":
            console.log(`[${new Date().getHours()}:${new Date().getMinutes()}] info: ${JSON.stringify(message)}`)
        break;

        case "warn":
            console.log(`[${new Date().getHours()}:${new Date().getMinutes()}] warn: ${JSON.stringify(message)}`)
        break;

        default:
            console.log(`${appName} ${message}`)
        break;
    }
}

module.exports = { appLogger }