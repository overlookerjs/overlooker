const crypto = require('crypto');

const hash = (string) => crypto
  .createHash('md5')
  .update(string)
  .digest('hex');

class Cache {
    constructor() {
        this.map = new Map();
    }

    get(key) {
        const hashedKey = hash(key);

        if (this.map.has(hashedKey)) {
            return this.map.get(hashedKey);
        } else {
            return undefined;
        }
    }

    has(key) {
        const hashedKey = hash(key);

        return this.map.has(hashedKey);
    }

    set(key, value) {
        const hashedKey = hash(key);

        this.map.set(hashedKey, value);
    }

    clear() {
        this.map = new Map();
    }
}

module.exports = new Cache();
