const fs = require('fs');
const path = require('path');

function getDataFromConfigFile(configFileName) {
    var configPath = path.join(process.env.APPDATA, "Chat Interrogator", "config");
    var files = fs.readdirSync(configPath)
        .filter(a => a == configFileName);

    if (files.length > 0) {
        let rawdata = fs.readFileSync(path.join(configPath, configFileName), 'utf8');
        return JSON.parse(rawdata);
    }
    return {};
}

module.exports = {
    getDataFromConfigFile
}