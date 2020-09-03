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

const logTypes = {
  WPR: 'wpr',
  INFO: 'info',
  ERROR: 'error'
};

/**
 * Build WPR instance
 *
 * @param {Function} [logger] - log wpr output
 * @param {number} [httpPort] - port for http cache
 * @param {number} [httpsPort] - port for https cache
 */
const wpr = (
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
      child = spawn(`${wprPath}/${platform}/wpr`, [operation, `--http_port=${httpPort}`, `--https_port=${httpsPort}`, wprFile], {
        cwd: wprPath
      });

      // Show WPR output
      child.stderr.on('data', (data) => {
        logger({ type: logTypes.WPR, message: `${data}`.trim() });
      });

      // Wait 30 second for wpr start
      await tcpPortUsed.waitUntilUsed(8888, 500, 30000);
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
        await logger({ type: logTypes.INFO, message: 'wpr child exist - kill him' });
        child.kill('SIGINT');
      }
    } catch (err) {
      await logger({ type: logTypes.ERROR, message: err });
    }

    // Wait 30 second for wpr end
    try {
      await tcpPortUsed.waitUntilFree(8888, 500, 30000);
    } catch (err) {
      await logger({ type: logTypes.ERROR, message: err });
    }

    await logger({ type: logTypes.INFO, message: 'wpr stopped' });
  };

  /**
   * delete wpr file
   */
  const clean = async function() {
    await logger({ type: logTypes.INFO, message: `cleaning wpr archive` });

    try {
      await deleteFileAsync(wprFile);
      await logger({ type: logTypes.INFO, message: `${wprFile} deleted` });
    } catch (err) {
      await logger({ type: logTypes.INFO, message: `${wprFile} not exist` });
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
