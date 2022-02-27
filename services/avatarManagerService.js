const fs = require('fs');
const path = require('path');

const defaultAvatar = 'defaultUser.png';
const defaultAvatarFolder = './resources/avatars';

class AvatarManager {
    constructor() {
        this.avatarFolder = path.join(process.env.APPDATA, "Chat Interrogator", "avatars");
        this.avatars = fs.readdirSync(this.avatarFolder)
            .filter(a => a.endsWith('.png'));
        this.current = path.join(defaultAvatarFolder, defaultAvatar);
        this.userAvatarMap = new Map();
    }

    getAllExceptCurrent() {
        var avatar = getFileNameFromPath(this.current);
        return this.avatars.filter(a => a !== avatar)
    }

    getForUser(username) {
        if (this.userAvatarMap.has(username)) {
            return this.userAvatarMap.get(username);
        }
        else {
            var avatar = this.getRandom();
            this.setForUser(username, avatar)
            return avatar;
        }
    }

    getRandom() {
        var avatars = this.getAllExceptCurrent();
        var avatar = avatars.length > 0 ? 
            path.join(this.avatarFolder, avatars[Math.floor(Math.random() * avatars.length)]) :
            path.join(defaultAvatarFolder, defaultAvatar);
        return avatar;
    }

    setCurrent(current) {
        this.current = current;
    }

    setForUser(username, avatar) {
        if (!this.userAvatarMap.has(username)) {
            this.userAvatarMap.set(username, avatar);
        }
    }
}

function getFileNameFromPath(filePath) {
    var parsedPath = path.parse(filePath);
    return parsedPath.base;
  }

module.exports = {
    AvatarManager
}