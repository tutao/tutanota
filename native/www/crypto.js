var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    utils = require('cordova/utils');

/**
 * @implements mizz.native.CryptoInterface
 * @constructor
 */
var Crypto = function () {};

Crypto.prototype.generateRsaKey = function(keyLength) {
    return new Promise(function (resolve, reject) {
        exec(resolve, reject,"Crypto", "generateRsaKey", [keyLength]);
    });
};

/**
 * Encrypt bytes with the provided publicKey
 * @param {Object} publicKey
 * @param {Array.<number>} bytes
 * @return {Promise.<Array.<number>, Error>} will return the encrypted bytes.
 */
Crypto.prototype.rsaEncrypt = function (publicKey, bytes) {
    return new Promise(function (resolve, reject) {
        var encodedBytes = tutao.util.EncodingConverter.bytesToBase64(bytes);
        exec(function(result) {
            resolve(tutao.util.EncodingConverter.base64ToArray(result));
        }, reject, "Crypto", "rsaEncrypt", [publicKey, encodedBytes]);
    });
};

/**
 * Decrypt bytes with the provided privateKey
 * @param {tutao.native.PrivateKey} privateKey
 * @param {Uint8Array} bytes
 * @return {Promise.<Array.<number>, Error>} will return the decrypted bytes.
 */
Crypto.prototype.rsaDecrypt = function (privateKey, bytes) {
    return new Promise(function (resolve, reject) {
        var encodedBytes = tutao.util.EncodingConverter.bytesToBase64(bytes);
        exec(function(result) {
            resolve(tutao.util.EncodingConverter.base64ToArray(result));
        }, reject,"Crypto", "rsaDecrypt", [privateKey, encodedBytes]);
    });
};

var crypto = Crypto;
module.exports = crypto;

