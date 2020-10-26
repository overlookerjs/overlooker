const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { promisify } = require('util');
const tcpPortUsed = require('tcp-port-used');
const fs = require('fs');
const deleteFileAsync = promisify(fs.unlink);

const platform = os.platform();
const wprPath = path.resolve(__dirname, 'wpr');
const mitmdumpPath = path.resolve(__dirname, 'mitmdump');

const cacheFile = path.resolve(__dirname, 'pages_cache');

const logTypes = {
  STD: 'std',
  INFO: 'info',
  ERROR: 'error'
};

/**
 * Build cache instance
 *
 * @param {('wpr'|'mitmdump')} [type] - type of cache proxy
 * @param {Function} [logger] - log wpr output
 * @param {number} [httpPort] - port for http cache
 * @param {number} [httpsPort] - port for https cache
 */
const cacheProxy = (
  type,
  logger = () => null,
  httpPort = 8888,
  httpsPort = 8081
) => {
  let child;

  /**
   * Start replay or record
   *
   * @param {('replay'|'record')} operation - Operation type
   */
  const start = async (operation = 'replay') => {
    try {
      switch (type) {
        case 'wpr':
          child = spawn(`${wprPath}/${platform}/wpr`, [
            operation,
            `--http_port=${httpPort}`,
            `--https_port=${httpsPort}`,
            cacheFile
          ], {
            cwd: wprPath
          });
          break;
        case 'mitmdump':
          child = spawn(`${mitmdumpPath}/${platform}/mitmdump`, [
            `-p ${httpPort}`,
            operation === 'record' ? (
              `-w ${cacheFile} -k`
            ) : (
              `--server-replay ${cacheFile} --server-replay-nopop`
            )
          ], {
            cwd: mitmdumpPath
          });
          break;
      }

      // Show WPR output
      child.stderr.on('data', (data) => {
        logger({ type: logTypes.STD, message: `${data}`.trim() });
      });

      // Wait 30 second for wpr start
      await tcpPortUsed.waitUntilUsed(httpPort, 500, 30000);
      await logger({ type: logTypes.INFO, message: `wpr started in ${operation} mode` });
    } catch (err) {
      await logger({ type: logTypes.ERROR, message: err });
    }
  };

  /**
   * Stop replay or record
   */
  const stop = async () => {
    try {
      if (child !== undefined) {
        await logger({ type: logTypes.INFO, message: 'cache proxy child exist - kill him' });
        child.kill('SIGINT');
      }
    } catch (err) {
      await logger({ type: logTypes.ERROR, message: err });
    }

    // Wait 30 second for cache proxy end
    try {
      await tcpPortUsed.waitUntilFree(httpPort, 500, 30000);
    } catch (err) {
      await logger({ type: logTypes.ERROR, message: err });
    }

    await logger({ type: logTypes.INFO, message: 'cache proxy stopped' });
  };

  /**
   * delete cache file
   */
  const clean = async function() {
    await logger({ type: logTypes.INFO, message: `cleaning cache archive` });

    try {
      await deleteFileAsync(cacheFile);
      await logger({ type: logTypes.INFO, message: `${cacheFile} deleted` });
    } catch (err) {
      await logger({ type: logTypes.INFO, message: `${cacheFile} not exist` });
    }
  };

  /**
   * get full path to cache file
   *
   * @return {String}
   */
  const getCacheFile = () => {
    return cacheFile;
  };

  return {
    start,
    stop,
    clean,
    getCacheFile
  };
};

module.exports = {
  cacheProxy,
  cacheFile
};
