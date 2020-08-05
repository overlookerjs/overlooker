const crypto = require('crypto');

const hash = (string) => crypto
  .createHash('md5')
  .update(string)
  .digest('hex');

class CacheBandwidth {
  constructor(throughput, latency, tickDuration = 10) {
    this.throughput = throughput;
    this.latency = latency;
    this.tickDuration = tickDuration;
    this.latencyTimeouts = {};

    this.clear();
  }

  async clear() {
    this.resources = new Map();

    this.reset();
  }

  async reset() {
    this.queue = [];
    this.activeConnections = [];
    this.prevTickTime = Date.now();

    clearTimeout(this.timeout);
    Object.values(this.latencyTimeouts).forEach((latencyTimeout) => clearTimeout(latencyTimeout));

    this.latencyTimeouts = {};

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
        const size = Buffer.byteLength(data.body);

        const timeout = setTimeout(() => {
          delete this.latencyTimeouts[timeout];

          this.activeConnections.push({
            uncompleted: size,
            resolve: () => resolve(data)
          });
        }, this.latency);

        this.latencyTimeouts[timeout] = timeout;
      } else {
        reject(null);
      }
    });
  }

  async checkUncompleted() {
    await Promise.all(
      this.activeConnections
        .filter(({ uncompleted }) => uncompleted <= 0)
        .map(({ resolve }) => resolve())
    );

    this.activeConnections = this.activeConnections
      .filter(({ uncompleted }) => uncompleted > 0)
  }

  async tick() {
    await this.checkUncompleted();

    const now = Date.now();
    const timeDelta = now - this.prevTickTime;

    if (this.activeConnections.length) {
      const tickThroughput = (this.throughput / this.activeConnections.length) * (timeDelta / 1000);

      this.activeConnections = this.activeConnections
        .map(({ uncompleted, resolve }) => ({
          uncompleted: uncompleted - tickThroughput,
          resolve
        }));
    }

    this.prevTickTime = now;
    this.timeout = setTimeout(() => this.tick(), this.tickDuration);
  }
}

module.exports = CacheBandwidth;
