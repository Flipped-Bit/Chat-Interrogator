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

    get(index) {
        return this.avatars[index];
    }

    getAll() {
        return this.avatars;
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

    next() {
        if (this.current == path.join(defaultAvatarFolder, defaultAvatar)) {
            return this.get(0);
        }
        var avatar = getFileNameFromPath(this.current);
        var avatars = this.getAll();
        var currentAvatarIndex = avatars.indexOf(avatar);
        var newAvatar = currentAvatarIndex < avatars.length - 1 ?
            avatars[currentAvatarIndex + 1] : avatars[0];
        return path.join(this.avatarFolder, newAvatar);
    }

    prev() {
        if (this.current == path.join(defaultAvatarFolder, defaultAvatar)) {
            return this.avatars[this.avatars.length - 1];
        }
        var avatar = getFileNameFromPath(this.current);
        var avatars = this.getAll();
        var currentAvatarIndex = avatars.indexOf(avatar);
        var newAvatar = currentAvatarIndex > 0 ?
            avatars[currentAvatarIndex - 1] : avatars[avatars.length - 1];
        return path.join(this.avatarFolder, newAvatar);
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