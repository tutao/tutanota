/**
 * @title Open - cordova.plugins.bridge.open
 * @overview Open documents with compatible apps.
 * @copyright © 2014 cordova-bridge
 * @license GPLv2
 * @author Carlos Antonio
*/

var exec = require('cordova/exec');

/**
 * open
 *
 * @param {String} args File URI
 * @param {Function} success Success callback
 * @param {Function} error Failure callback
 */
exports.open = function(uri, success, error) {
  if (!uri || arguments.length === 0) return;

  function onSuccess(path) {
    if (typeof success === 'function') success(path);
    return path;
  }

  function onError(code) {
    code = code || 0;
    if (typeof error === 'function') error(code);
    return code;
  }

  uri = encodeURI(uri);

  exec(onSuccess, onError, "Open", "open", [uri]);
};
