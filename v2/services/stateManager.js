const fs = require('fs');
const path = require('path');
const { getDataFromConfigFile } = require('../utils/fileAccessManager');

const saveStateDir = path.join(process.env.APPDATA, "Chat Interrogator", "saves");

function load() {
    if (fs.existsSync(saveStateDir)) {
        var saves = fs.readdirSync(saveStateDir);

        if (saves.length > 0) {
            console.info(`Save State found, loading layout from ${saves[0]}`);
            let rawdata = fs.readFileSync(path.join(saveStateDir, saves[0]), 'utf8');
            return JSON.parse(rawdata);
        }
    }

    console.info("Save State not found, loading default layout");
    return getDataFromConfigFile("defaultState.json");
}

function save(saveState) {
    var saveData = JSON.stringify(saveState, null, '\t');
    var defaultData = JSON.stringify(getDataFromConfigFile("defaultState.json"), null, '\t');

    // If state is unchanged from default, avoid saving
    if (defaultData == saveData) {
        return;
    }

    var saveStatePath = path.join(saveStateDir, "saveState.json");

    fs.writeFile(saveStatePath, saveData, 'utf8', (err) => {
        if (err) {
            console.error(`Failed to update Save State, ${err}`);
        }
        console.info("Save State updated");
    });
}

module.exports = {
    load,
    save
}