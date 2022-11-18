const { getDataFromConfigFile } = require('./fileAccessManager');

class PathGenerator {
    constructor() {
        this.paths = generatePaths();
    }
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