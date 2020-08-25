const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { promisify } = require('util');
const tcpPortUsed = require('tcp-port-used');
const fs = require('fs');
const deleteFileAsync = promisify(fs.unlink);

const platform = os.platform();
const wprPath = path.resolve(__dirname, 'platforms');

const wprFile = '/tmp/archive.wprgo';

/**
 * Build WPR instance
 *
 * @param {Function} [logger] - log wpr output
 * @param {number} [httpPort] - port for http cache
 * @param {number} [httpsPort] - port for https cache
 */
const wpr = (logger = () => {}, httpPort = 8888, httpsPort = 8081) => {
  let child;

  /**
   * Start replay or record
   *
   * @param {('replay'|'record')} operation - Operation type
   */
  const start = async (operation = 'replay') => {
    try {
      child = spawn(`${wprPath}/${platform}/wpr`, [operation, `--http_port=${httpPort}`, `--https_port=${httpsPort}`, wprFile], {
        cwd: wprPath
      });

      // Show WPR output
      child.stderr.on('data', async (data) => {
        if (process.env.VERBOSE) {
          await logger(`wpr: ${data}`.trim());
        }
      });

      // Wait 30 second for wpr start
      await tcpPortUsed.waitUntilUsed(8888, 500, 30000);
      await logger(`wpr started in ${operation} mode`);
    } catch (err) {
      throw new Error(err);
    }
  };

  /**
   * Stop replay or record
   */
  const stop = async () => {
    try {
      if (child !== undefined) {
        await logger('Child exist - kill him');
        child.kill('SIGINT');
      }
    } catch (err) {
      throw new Error(err);
    }

    // Wait 30 second for wpr end
    try {
      await tcpPortUsed.waitUntilFree(8888, 500, 30000);
    } catch (err) {
      await logger(err);
    }

    await logger('wpr stopped');
  };

  /**
   * delete wpr file
   */
  const clean = async function () {
    try {
      await deleteFileAsync(wprFile);
      await logger(`${wprFile} deleted`);
    } catch (err) {
      await logger(`${wprFile} not exist`);
    }
  };

  /**
   * get full path to wpr file
   *
   * @return {String}
   */
  const getWprFile = () => {
    return wprFile;
  };

  return {
    start,
    stop,
    clean,
    getWprFile
  };
};

module.exports = wpr;
