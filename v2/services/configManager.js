const { getDataFromConfigFile } = require('../utils/fileAccessManager');

function getAvailableDirections() {
    var data = getDataFromConfigFile("pathData.json");
    var directions = Object.keys(data.Directions);
    
    return directions;
}

function getAvailableVoices() {
    var data = getDataFromConfigFile("voiceData.json");
    var voices = [];

    for (const accent in data.Voices) {
        var options = data.Voices[accent];
        for (const o in options) {
            voices.push({label:`${accent} (${o})`, value:options[o]});
        }
    }

    return voices;
}

module.exports = {
    getAvailableDirections,
    getAvailableVoices
}