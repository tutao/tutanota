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
		var seed = tutao.util.EncodingConverter.hexToBase64(tutao.locator.randomizer.generateRandomData(512));
        exec(resolve, reject,"Crypto", "generateRsaKey", [keyLength, seed]);
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


Crypto.prototype.generateKeyFromPassphrase = function(passphrase, salt) {
	if (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID) {
		return tutao.locator.kdfCrypter.generateKeyFromPassphrase(passphrase, salt);
    } else {
		return new Promise(function (resolve, reject) {
			var base64Salt = tutao.util.EncodingConverter.hexToBase64(salt);
			// hash the password first to avoid login with multiples of a password, i.e. "hello" and "hellohello" produce the same key if the same salt is used
			var base64PassphraseBytes = tutao.locator.shaCrypter.hashHex(tutao.util.EncodingConverter.utf8ToHex(passphrase));
			var rounds = 8;
			exec(function(result) {
				resolve(tutao.util.EncodingConverter.base64ToHex(result));
			}, reject,"Crypto", "generateKeyFromPassphrase", [base64PassphraseBytes, base64Salt, rounds]);
		});
	}
};


var crypto = Crypto;
module.exports = crypto;