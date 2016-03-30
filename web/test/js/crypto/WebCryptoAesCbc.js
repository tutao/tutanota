"use strict";

tutao.provide('tutao.crypto.WebCryptoAesCbc');


if (window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle) {
    window.crypto.subtle = window.crypto.webkitSubtle;
}

if (!window.crypto.subtle && window.msCrypto.subtle) {
   // window.crypto.subtle = window.msCrypto.subtle;
}

/**
 * AES 256 CBC with HMAC
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.WebCryptoAesCbc = function() {
    this._keyLengthBytes = 32;
    this._ivLengthBytes = 16;
    this._tagSizeBytes = 32;
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.generateRandomKey = function() {
	return new Uint8Array(tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this._keyLengthBytes)));
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.keyToHex = function(key) {
    return tutao.util.EncodingConverter.arrayBufferToHex(key.buffer);
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.keyToBase64 = function(key) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.hexToKey = function(hex) {
    return new Uint8Array(tutao.util.EncodingConverter.hexToArrayBuffer(hex));
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.base64ToKey = function(base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.encryptUtf8 = function(webCryptoKey, string) {
	var self = this;

	var iv = this._createIv();

	return new Promise(function(resolve, reject) {
		//returns the symmetric key
		//console.log(webCryptoKey);
		window.crypto.subtle.encrypt(
			{
				name: "AES-CBC",
				iv: iv
			},
			webCryptoKey, //from generateKey or importKey above
			tutao.util.EncodingConverter.stringToUtf8Uint8Array(string)
		).then(function (encrypted) {
				resolve(tutao.util.EncodingConverter.uint8ArrayToBase64(tutao.crypto.WebCryptoAesCbc.mergeIvAndEncrypted(iv, encrypted)));
		}).catch(function (err) {
			reject(err);
		});
	});
};

tutao.crypto.WebCryptoAesCbc.prototype._createIv = function(iv, encrypted) {
    return tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this._ivLengthBytes));
};

tutao.crypto.WebCryptoAesCbc.mergeIvAndEncrypted = function(iv, encrypted) {
    var dstBuffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
    dstBuffer.set(new Uint8Array(iv), 0);
    dstBuffer.set(new Uint8Array(encrypted), iv.byteLength);
    return dstBuffer;
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.decryptUtf8 = function(webCryptoKey, base64) {
	var self = this;

	var rawData = tutao.util.EncodingConverter.base64ToUint8Array(base64);
    var iv = new Uint8Array(rawData.buffer, 0, this._ivLengthBytes);
    var encryptedData = new Uint8Array(rawData.buffer, this._ivLengthBytes);
	return new Promise(function(resolve, reject){
		window.crypto.subtle.decrypt(
			{
				name: "AES-CBC",
				iv: iv
			},
			webCryptoKey, //from generateKey or importKey above
			encryptedData //ArrayBuffer of the data
		).then(function(decrypted){
			var string = tutao.util.EncodingConverter.utf8Uint8ArrayToString(new Uint8Array(decrypted));
			resolve(string);
		}).catch(function(err){
			reject(err);
		});
	});
};

/**
 * Encrypt bytes with the provided key
 * @param {Uint8Array} key The key to use for the encryption.
 * @param {Uint8Array} bytes
 * @return {Promise.<Uint8Array, Error>} will return the encrypted bytes.  Resolves to an exception if the encryption failed.
 */
tutao.crypto.WebCryptoAesCbc.prototype.aesEncrypt = function (key, bytes) {
    var self = this;

    var iv = this._createIv();

    return new Promise(function(resolve, reject) {
        //returns the symmetric key
        //console.log(webCryptoKey);
        self._getWebCryptoKey(key).then(function(webCryptoKey) {
            return window.crypto.subtle.encrypt(
                {
                    name: "AES-CBC",
                    iv: iv
                },
                webCryptoKey, //from generateKey or importKey above
                bytes //ArrayBuffer of data you want to encrypt
            ).then(function (encrypted) {
                //returns an ArrayBuffer containing the encrypted data
                // iv + encrypted data
                var dstBuffer = new Uint8Array(iv.byteLength + encrypted.byteLength + self._tagSizeBytes);
                dstBuffer.set(new Uint8Array(iv), 0);
                dstBuffer.set(new Uint8Array(encrypted), iv.byteLength);
                    //TODO: use different key
                console.log("before hmac");
                return self._calculateHmac(key, new Uint8Array(dstBuffer.buffer, 0, iv.byteLength + encrypted.byteLength)).then(function(hmac) {
                    console.log("hmac success");
                    dstBuffer.set(hmac, iv.byteLength + encrypted.byteLength);
                    resolve(dstBuffer);
                }).catch(function(error){
                    console.log("hmac error: ", error);
                    reject(error);
                });
            }).catch(function (error) {
                reject(error);
            });
        }).catch(function(error){
            reject(error);
        });
    });
};

tutao.crypto.WebCryptoAesCbc.prototype._calculateHmac = function (key, data) {
    return this._getWebCryptoHmacKey(key).then(function(webCryptoKey){
        return window.crypto.subtle.sign(
            {
                name: "HMAC"
            },
            webCryptoKey,
            data
        ).then(function (signature) {
            return new Uint8Array(signature);
        });
    });
};

tutao.crypto.WebCryptoAesCbc.prototype._verifyHmac = function (key, signature, data) {
    return this._getWebCryptoHmacKey(key).then(function(webCryptoKey){
        return window.crypto.subtle.verify(
            {
                name: "HMAC"
            },
            webCryptoKey,
            signature,
            data
        );
    });
};

/**
 * Decrypt bytes with the provided key
 * @param {Uint8Array} key The key to use for the decryption.
 * @param {Uint8Array} bytes
 * @param {Number} decryptedBytesLength The number of bytes of the decrypted array.
 * @return {Promise.<Uint8Array, Error>} will return the decrypted bytes. Resolves to an exception if the encryption failed.
 */
tutao.crypto.WebCryptoAesCbc.prototype.aesDecrypt = function (key, bytes, decryptedBytesLength) {
    var self = this;

    return new Promise(function(resolve, reject){
        var data = new Uint8Array(bytes.buffer, 0, bytes.byteLength - self._tagSizeBytes);
        var signature = new Uint8Array(bytes.buffer, bytes.byteLength - self._tagSizeBytes);
        self._verifyHmac(key, signature, data).then(function(valid) {
            if (!valid) {
                reject(new tutao.crypto.CryptoError("bad hmac"));
                return;
            }
            var iv = new Uint8Array(bytes.buffer, 0, self._ivLengthBytes);
            var encryptedData = new Uint8Array(bytes.buffer, self._ivLengthBytes, bytes.byteLength - self._ivLengthBytes - self._tagSizeBytes);
            return self._getWebCryptoKey(key).then(function (webCryptoKey) {
                return window.crypto.subtle.decrypt(
                    {
                        name: "AES-CBC",
                        iv: iv
                    },
                    webCryptoKey, //from generateKey or importKey above
                    encryptedData //ArrayBuffer of the data
                ).then(function (decrypted) {
                    //returns an ArrayBuffer containing the decrypted data
                    //console.log(new Uint8Array(decrypted));
                    resolve(new Uint8Array(decrypted));
                }).catch(function (err) {
                    reject(err);
                });
            });
        }).catch(function(error){
            reject(error);
        });
    });
};


tutao.crypto.WebCryptoAesCbc.prototype._getWebCryptoKey = function(key) {
	return window.crypto.subtle.importKey(
		"raw", //can be "jwk" or "raw"
		key,
		{   //this is the algorithm options
			name: "AES-CBC"
		},
		false, //whether the key is extractable (i.e. can be used in exportKey)
		["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
	);
};

tutao.crypto.WebCryptoAesCbc.prototype.getWebCryptoKey = function(key) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self._getWebCryptoKey(key).then(function(webCryptoKey) {
            resolve(webCryptoKey);
        }).catch(function(error) {
            reject(error);
        });
    });
};

tutao.crypto.WebCryptoAesCbc.prototype._getWebCryptoHmacKey = function(key) {
    return window.crypto.subtle.importKey(
        "raw",
        key,
        {
            name: "HMAC",
            hash: {name: "SHA-256"}
        },
        false,
        ["sign", "verify"]
    );
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.encryptUtf8Index = function(key, utf8) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.decryptUtf8Index = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.encryptBytes = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.decryptBytes = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.encryptKey = function(key, keyToEncrypt) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.decryptKey = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesCbc.prototype.decryptPrivateRsaKey = function(key, base64) {
};
