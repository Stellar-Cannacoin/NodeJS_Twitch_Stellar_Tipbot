const appLogger = (type, message) => {
    let appName = "[TwitchTipBot]"
    switch(type) {
        case "err":
            console.log(`[${new Date().getHours()}:${new Date().getMinutes()}] error: ${message}`)
        break

        case "log":
            console.log(`[${new Date().getHours()}:${new Date().getMinutes()}] info: ${message}`)
        break;

        case "warn":
            console.log(`[${new Date().getHours()}:${new Date().getMinutes()}] warn: ${message}`)
        break;

        default:
            console.log(`${appName} ${message}`)
        break;
    }
}

module.exports = { appLogger }