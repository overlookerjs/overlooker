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

class Bandwidth {
  constructor(throughput, latency, accuracy = 10) {
    this.throughput = throughput;
    this.latency = latency;
    this.accuracy = accuracy;

    this.clear();
  }

  async clear() {
    this.queue = [];
    this.activeConnections = [];
    this.resources = new Map();

    clearTimeout(this.timeout);

    await this.tick();
  }

  has(name) {
    return this.resources.has(name);
  }

  set(name, data) {
    this.resources.set(name, data);

    return data;
  }

  async get(name) {
    return new Promise((resolve, reject) => {
      if (this.resources.has(name)) {
        const data = this.resources.get(name);
        const size = data.body.length;

        setTimeout(() => this.activeConnections.push({
          uncompleted: size,
          resolve: () => resolve(data)
        }), this.latency)
      } else {
        reject(null);
      }
    });
  }

  async doneUncompleted() {
    await Promise.all(
      this.activeConnections
        .filter(({ uncompleted }) => uncompleted <= 0)
        .map(({ resolve }) => resolve())
    );

    this.activeConnections = this.activeConnections
      .filter(({ uncompleted }) => uncompleted > 0)
  }

  async tick() {
    await this.doneUncompleted();

    if (this.activeConnections.length) {
      const tickThroughput = (this.throughput / this.activeConnections.length) * (this.accuracy / 1000);

      this.activeConnections = this.activeConnections
        .map(({ uncompleted, resolve }) => ({
          uncompleted: uncompleted - tickThroughput,
          resolve
        }));
    }

    this.timeout = setTimeout(() => this.tick(), this.accuracy);
  }
}

module.exports = Bandwidth;
