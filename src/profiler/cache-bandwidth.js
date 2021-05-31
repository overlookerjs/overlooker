const crypto = require('crypto');
const { performance } = require('perf_hooks');

const hash = (string) => crypto
  .createHash('md5')
  .update(string)
  .digest('hex');

const STD_LATENCY = 200;

class CacheBandwidth {
  constructor(throughput, latency, tickDuration = 1) {
    this.throughput = throughput;
    this.latency = latency;
    this.tickDuration = tickDuration;
    this.latencyTimeouts = {};

    this.clear();
  }

  makeInstance() {
    const instance = new CacheBandwidth(this.throughput, this.latency, this.tickDuration);

    if (this.writeMode) {
      instance.write();
    } else if (this.replayMode) {
      instance.replay();
    }

    instance.setCache(this.resources);

    return instance;
  }

  setCache(resources) {
    this.resources = resources;
  }

  getCache() {
    return this.resources;
  }

  async clear() {
    this.resources = new Map();
    this.replayMode = false;
    this.writeMode = false;

    this.reset();
  }

  async reset() {
    this.logs = [];
    this.queue = [];
    this.activeConnections = [];
    this.latencyTimeouts = {};
  }

  stop() {
    Object.values(this.latencyTimeouts).forEach((latencyTimeout) => clearTimeout(latencyTimeout));
    clearInterval(this.interval);
  }

  start() {
    this.prevTickTime = performance.now();
    this.interval = setInterval(() => this.tick(), this.tickDuration);
  }

  write() {
    this.writeMode = true;
    this.replayMode = false;
  }

  replay() {
    this.writeMode = false;
    this.replayMode = true;
  }

  getLogs() {
    return this.logs;
  }

  has(name) {
    return this.resources.has(name);
  }

  set(name, data) {
    this.resources.set(name, data);

    return data;
  }

  instantGet(name) {
    return this.resources.get(name);
  }

  changePriority(name, priority) {
    //console.log(this.resources.get(name), priority);
  }

  async get(name, requestId, priority) {
    return await new Promise((resolve, reject) => {
      if (this.resources.has(name)) {
        const data = this.resources.get(name);
        const size = data.size;

        const requestLog = {
          name: data.url,
          type: data.mimeType,
          priority: data.priority,
          requestStart: performance.now()
        };

        this.logs.push(requestLog);

        this.latencyTimeouts[requestId] = setTimeout(() => {
          requestLog.responseStart = performance.now();

          this.activeConnections.push({
            uncompleted: size,
            resolve: () => {
              resolve(data);
              requestLog.responseEnd = performance.now();
            }
          });
        }, this.latency + STD_LATENCY);
      } else {
        reject(new Error(`Resource ${name} not found`));
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

    const now = performance.now();
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
  }
}

module.exports = {
  CacheBandwidth,
  hash
};
