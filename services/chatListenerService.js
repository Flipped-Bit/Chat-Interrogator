const tmi = require('tmi.js');

class ChatListener {
    constructor(channel) {
        this.client = new tmi.client({
            connection: {
                reconnect: true,
                secure: true
            },
            channels: [`#${channel}`]
        });
    }

    async connect() {
        this.client.connect()
        .catch(console.error);
    }

    async disconnect() {
        this.client.disconnect()
        .catch(console.error);
    }
}

module.exports = {
    ChatListener
}