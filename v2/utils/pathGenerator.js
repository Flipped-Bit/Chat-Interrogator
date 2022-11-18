const fs = require('fs');
const path = require('path');

class PathGenerator {
    constructor() {
        this.paths = generatePaths();
    }
}

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

function generatePaths() {

    let data = getDataFromConfigFile("pathData.json")

    let paths = {};

    if (data["All"] !== undefined && data["Directions"] !== undefined) {
        let sections = data["All"];
        let directions = data["Directions"]

        for (const [key, value] of Object.entries(directions)) {
            var d = "";
            value.forEach(e => { d += sections[e]; });
            paths[key] = d;
        }
    }

    return paths;
}

module.exports = {
    PathGenerator
}