const fs = require('fs');
const path = require('path');
const { getDataFromConfigFile } = require('../utils/fileAccessManager');

const saveStatePath = path.join(process.env.APPDATA, "Chat Interrogator", "saves");

function load() {
    if (fs.existsSync(saveStatePath)) {
        var saves = fs.readdirSync(saveStatePath);
        console.log("\nCurrent directory filenames:");
        saves.forEach(file => {
            console.log(file);
        });

        if (saves.length > 0) {
            console.log(`Save State found, loading layout from ${saves[0]}`);
            let rawdata = fs.readFileSync(path.join(saveStatePath, saves[0]), 'utf8');
            return JSON.parse(rawdata);
        }
    }

    console.log("Save State not found, loading default layout");
    return getDataFromConfigFile("defaultState.json");
}

function save(saveState) {
    var data = JSON.stringify(saveState, null, '\t');
    fs.writeFile(saveStatePath, data, 'utf8', (err) => {
        if (err) {
            console.error(`Failed to update Save State, ${err}`);
        }
        console.log("Save State updated");
    });
}

module.exports = {
    load,
    save
}