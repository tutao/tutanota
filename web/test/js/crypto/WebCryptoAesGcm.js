"use strict";

tutao.provide('tutao.crypto.WebCryptoAesGcm');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.WebCryptoAesGcm = function() {
    this._keyLengthBytes = 32;
    this._ivLengthBytes = 16;
    this._tagSizeBytes = 16;
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.generateRandomKey = function() {
	return new Uint8Array(tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this._keyLengthBytes)));
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.keyToHex = function(key) {
    return tutao.util.EncodingConverter.arrayBufferToHex(key.buffer);
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.keyToBase64 = function(key) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.hexToKey = function(hex) {
    return new Uint8Array(tutao.util.EncodingConverter.hexToArrayBuffer(hex));
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.base64ToKey = function(base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.encryptUtf8 = function(webCryptoKey, string) {
	var self = this;

	var iv = this._createIv();

	return new Promise(function(resolve, reject) {
		//returns the symmetric key
		//console.log(webCryptoKey);
		window.crypto.subtle.encrypt(
			{
				name: "AES-GCM",
				//Don't re-use initialization vectors!
				//Always generate a new iv every time your encrypt!
				//Recommended to use 12 bytes length
				iv: iv,
				//Additional authentication data (optional)
				//additionalData: ArrayBuffer,
				//Tag length (optional)
				tagLength: self._tagSizeBytes * 8 //can be 32, 64, 96, 104, 112, 120 or 128 (default)
				//addtl: window.crypto.getRandomValues(new Uint8Array(256))
			},
			webCryptoKey, //from generateKey or importKey above
			tutao.util.EncodingConverter.stringToUtf8Uint8Array(string)
		).then(function (encrypted) {
				resolve(tutao.util.EncodingConverter.uint8ArrayToBase64(tutao.crypto.WebCryptoAesGcm.mergeIvAndEncrypted(iv, encrypted)));
		}).catch(function (err) {
			reject(err);
		});
	});
};

tutao.crypto.WebCryptoAesGcm.prototype._createIv = function(iv, encrypted) {
    return tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this._ivLengthBytes));
};

tutao.crypto.WebCryptoAesGcm.mergeIvAndEncrypted = function(iv, encrypted) {
    var dstBuffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
    dstBuffer.set(new Uint8Array(iv), 0);
    dstBuffer.set(new Uint8Array(encrypted), iv.byteLength);
    return dstBuffer;
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.decryptUtf8 = function(webCryptoKey, base64) {
	var self = this;

	var rawData = tutao.util.EncodingConverter.base64ToUint8Array(base64);
    var iv = new Uint8Array(rawData.buffer, 0, this._ivLengthBytes);
    var encryptedData = new Uint8Array(rawData.buffer, this._ivLengthBytes);
	return new Promise(function(resolve, reject){
		window.crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv: iv, //The initialization vector you used to encrypt
				//additionalData: ArrayBuffer, //The addtionalData you used to encrypt (if any)
				tagLength: self._tagSizeBytes * 8 //The tagLength you used to encrypt (if any)
				//addtl: window.crypto.getRandomValues(new Uint8Array(256))
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
tutao.crypto.WebCryptoAesGcm.prototype.aesEncrypt = function (key, bytes) {
    var self = this;

    var iv = this._createIv();

    return new Promise(function(resolve, reject) {
        //returns the symmetric key
        //console.log(webCryptoKey);
        self._getWebCryptoKey(key).then(function(webCryptoKey) {
            window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    //Don't re-use initialization vectors!
                    //Always generate a new iv every time your encrypt!
                    //Recommended to use 12 bytes length
                    iv: iv,
                    //Additional authentication data (optional)
                    //additionalData: ArrayBuffer,
                    //Tag length (optional)
                    tagLength: self._tagSizeBytes * 8 //can be 32, 64, 96, 104, 112, 120 or 128 (default)
                    //addtl: window.crypto.getRandomValues(new Uint8Array(256))
                },
                webCryptoKey, //from generateKey or importKey above
                bytes //ArrayBuffer of data you want to encrypt
            ).then(function (encrypted) {
                //returns an ArrayBuffer containing the encrypted data
                // iv + encrypted data
                var dstBuffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
                dstBuffer.set(new Uint8Array(iv), 0);
                dstBuffer.set(new Uint8Array(encrypted), iv.byteLength);
                resolve(dstBuffer);
            }).catch(function (err) {
                reject(err);
            });
        })
    });
};

/**
 * Decrypt bytes with the provided key
 * @param {Uint8Array} key The key to use for the decryption.
 * @param {Uint8Array} bytes
 * @param {Number} decryptedBytesLength The number of bytes of the decrypted array.
 * @return {Promise.<Uint8Array, Error>} will return the decrypted bytes. Resolves to an exception if the encryption failed.
 */
tutao.crypto.WebCryptoAesGcm.prototype.aesDecrypt = function (key, bytes, decryptedBytesLength) {
    var self = this;

    var iv = new Uint8Array(bytes.buffer, 0, this._ivLengthBytes);
    var encryptedData = new Uint8Array(bytes.buffer, this._ivLengthBytes);
    return new Promise(function(resolve, reject){
        self._getWebCryptoKey(key).then(function(webCryptoKey) {
            window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv, //The initialization vector you used to encrypt
                    //additionalData: ArrayBuffer, //The addtionalData you used to encrypt (if any)
                    tagLength: self._tagSizeBytes * 8 //The tagLength you used to encrypt (if any)
                    //addtl: window.crypto.getRandomValues(new Uint8Array(256))
                },
                webCryptoKey, //from generateKey or importKey above
                encryptedData //ArrayBuffer of the data
            ).then(function(decrypted){
                //returns an ArrayBuffer containing the decrypted data
                //console.log(new Uint8Array(decrypted));
                resolve(new Uint8Array(decrypted));
            }).catch(function(err){
                reject(err);
            });
        });
    });
};


tutao.crypto.WebCryptoAesGcm.prototype._getWebCryptoKey = function(key) {
	return window.crypto.subtle.importKey(
		"raw", //can be "jwk" or "raw"
		key,
		{   //this is the algorithm options
			name: "AES-GCM"
		},
		false, //whether the key is extractable (i.e. can be used in exportKey)
		["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
	);
};



/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.encryptUtf8Index = function(key, utf8) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.decryptUtf8Index = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.encryptBytes = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.decryptBytes = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.encryptKey = function(key, keyToEncrypt) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.decryptKey = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.decryptPrivateRsaKey = function(key, base64) {
};
