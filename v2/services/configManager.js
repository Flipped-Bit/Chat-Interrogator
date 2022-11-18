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

function getAvailableVoices() {
    var data = getDataFromConfigFile("voiceData.json");
    var voices = [];

    for (const accent in data.Voices) {
        var options = data.Voices[accent];
        for (const o in options) {
            voices.push({label:`${accent} (${o})`, value:options[o]})
        }
    }

    return voices;
}

module.exports = {
    getAvailableVoices
}