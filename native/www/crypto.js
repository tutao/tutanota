var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    utils = require('cordova/utils');

/**
 * @implements mizz.native.CryptoInterface
 * @constructor
 */
var Crypto = function () {
	this.delegate = new tutao.native.CryptoBrowser();
};

Crypto.prototype.seed = function() {
    return new Promise(function (resolve, reject) {
        var seed = tutao.util.EncodingConverter.uint8ArrayToBase64(tutao.locator.randomizer.generateRandomData(512));
        exec(resolve, reject,"Crypto", "seed", [seed]);
    });
};

Crypto.prototype.generateRsaKey = function(keyLength) {
    return new Promise(function (resolve, reject) {
        exec(resolve, reject,"Crypto", "generateRsaKey", [keyLength]);
    });
};

/**
 * Encrypt bytes with the provided publicKey
 * @param {Object} publicKey
 * @param {Uint8Array} bytes
 * @return {Promise.<Uint8Array, Error>} will return the encrypted bytes.
 */
Crypto.prototype.rsaEncrypt = function (publicKey, bytes) {
    return new Promise(function (resolve, reject) {
        var encodedBytes = tutao.util.EncodingConverter.uint8ArrayToBase64(bytes);
        exec(function(result) {
            resolve(tutao.util.EncodingConverter.base64ToUint8Array(result));
        }, function (error) {
            reject(new tutao.crypto.CryptoError(error));
        }, "Crypto", "rsaEncrypt", [publicKey, encodedBytes]);
    });
};

/**
 * Decrypt bytes with the provided privateKey
 * @param {tutao.native.PrivateKey} privateKey
 * @param {Uint8Array} bytes
 * @return {Promise.<Uint8Array, Error>} will return the decrypted bytes.
 */
Crypto.prototype.rsaDecrypt = function (privateKey, bytes) {
    return new Promise(function (resolve, reject) {
        var encodedBytes = tutao.util.EncodingConverter.uint8ArrayToBase64(bytes);
        exec(function(result) {
            resolve(tutao.util.EncodingConverter.base64ToUint8Array(result));
        }, function (error) {
            reject(new tutao.crypto.CryptoError(error));
        },"Crypto", "rsaDecrypt", [privateKey, encodedBytes]);
    });
};

/**
 * Encrypt bytes with the provided key
 * @param {bitArray} key The key to use for the encryption.
 * @param {Uint8Array} bytes
 * @return {Promise.<Uint8Array, Error>} will return the encrypted bytes.  Resolves to an exception if the encryption failed.
 */
Crypto.prototype.aesEncrypt = function (key, bytes) {
	if (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID) {
		return new Promise(function (resolve, reject) {
			var encodedBytes = tutao.util.EncodingConverter.uint8ArrayToBase64(bytes);
			var encodedKey = tutao.util.EncodingConverter.keyToBase64(key);
			exec(function(result) {
				resolve(tutao.util.EncodingConverter.base64ToUint8Array(result));
			}, function (error) {
				reject(new tutao.crypto.CryptoError(error));
			},"Crypto", "aesEncrypt", [encodedKey, encodedBytes]);
		});
	}else{
		return this.delegate.aesEncrypt(key, bytes);
	}
};

/**
 * Encrypts a file with the provided key
 * @param {bitArray} key The key to use for the encryption.
 * @param {string} fileUrl
 * @return {Promise.<Uint8Array, Error>} will return the encrypted bytes.  Resolves to an exception if the encryption failed.
 */
Crypto.prototype.aesEncryptFile = function (key, fileUrl) {
    return new Promise(function (resolve, reject) {
        var encodedKey = tutao.util.EncodingConverter.keyToBase64(key);
        exec(function(result) {
            resolve(result);
        }, function (error) {
            reject(new tutao.crypto.CryptoError(error));
        },"Crypto", "aesEncryptFile", [encodedKey, fileUrl]);
    });
};

/**
 * Decrypt bytes with the provided key
 * @param {bitArray} key The key to use for the decryption.
 * @param {Uint8Array} bytes
 * @return {Promise.<Uint8Array, Error>} will return the decrypted bytes. Resolves to an exception if the encryption failed.
 */
Crypto.prototype.aesDecrypt = function (key, bytes, decryptedBytesLength) {
	if (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID) {
		return new Promise(function (resolve, reject) {
			var encodedBytes = tutao.util.EncodingConverter.uint8ArrayToBase64(bytes);
			var encodedKey = tutao.util.EncodingConverter.keyToBase64(key);
			exec(function(result) {
				var resultArray = tutao.util.EncodingConverter.base64ToUint8Array(result);
				if (resultArray.length == decryptedBytesLength) {
					resolve(resultArray);
				} else {
					reject(new tutao.crypto.CryptoError("length was: " + resultArray.length + ", but expected: " + decryptedBytesLength));
				}
			}, function (error) {
				reject(new tutao.crypto.CryptoError(error));
			},"Crypto", "aesDecrypt", [encodedKey, encodedBytes]);
		});
	}else{
		return this.delegate.aesDecrypt(key, bytes, decryptedBytesLength);
	}
};

/**
 * Decrypt bytes with the provided key
 * @param {bitArray} key The key to use for the decryption.
 * @param {string} fileUrl The file that should be decrypted
 * @return {Promise.<string, Error>} will return the URI of the decrypted file. Resolves to an exception if the encryption failed.
 */
Crypto.prototype.aesDecryptFile = function (key, fileUrl) {
    return new Promise(function (resolve, reject) {
        var encodedKey = tutao.util.EncodingConverter.keyToBase64(key);
        exec(function(result) {
            resolve(result);
        }, function (error) {
            reject(new tutao.crypto.CryptoError(error));
        },"Crypto", "aesDecryptFile", [encodedKey, fileUrl]);
    });
};

var crypto = Crypto;
module.exports = crypto;