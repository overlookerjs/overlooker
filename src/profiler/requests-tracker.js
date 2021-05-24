
class RequestsTracker {
  constructor() {
    this.requests = new Set();
    this.fails = new Set();

    this.onStarted = this.onStarted.bind(this);
    this.onFinished = this.onFinished.bind(this);
    this.onFailed = this.onFailed.bind(this);
  }

  init(page) {
    page.on('request', this.onStarted);
    page.on('requestfinished', this.onFinished);
    page.on('requestfailed', this.onFailed);
  }

  onStarted(request) {
    this.requests.add(request);
  }

  onFinished(request) {
    this.requests.delete(request);
  }

  onFailed(request) {
    this.requests.delete(request);
    this.fails.add(request);
  }

  inflightRequests() {
    return Array.from(this.requests);
  }

  failedRequests() {
    return Array.from(this.fails);
  }

  getRequests() {
    const inflight = this.inflightRequests();
    const failed = this.failedRequests();

    return {
      inflight: inflight.map((req) => req.url()),
      failed: failed.map((req) => req.url())
    };
  }

  dispose(page) {
    page.removeListener('request', this.onStarted);
    page.removeListener('requestfinished', this.onFinished);
    page.removeListener('requestfailed', this.onFailed);
  }
}

module.exports = {
  RequestsTracker
};
