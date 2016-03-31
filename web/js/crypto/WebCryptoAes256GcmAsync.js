"use strict";

tutao.provide('tutao.crypto.WebCryptoAes256GcmAsync');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterfaceAsync}
 */
tutao.crypto.WebCryptoAes256GcmAsync = function() {
    this._ivLengthBytes = 16;
    this._tagSizeBytes = 16;
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAes256GcmAsync.prototype.encryptBytes = function (key, bytes, resultCallback) {
    var self = this;
    var plainText = tutao.crypto.Utils.pad(bytes);
    var iv = tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this._ivLengthBytes));
    self._getWebCryptoKey(key).then(function(webCryptoKey) {
        return window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: self._tagSizeBytes * 8
            },
            webCryptoKey,
            plainText
        ).then(function (encrypted) {
            //returns an ArrayBuffer containing the encrypted data
            // iv + encrypted data
            var dstBuffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
            dstBuffer.set(new Uint8Array(iv), 0);
            dstBuffer.set(new Uint8Array(encrypted), iv.byteLength);
            resultCallback({type: 'result', result: dstBuffer});
        });
    }).catch(function(error){
        resultCallback({type: 'error', msg: "WebCryptoAes256GcmAsync encrypt error: " + error.message});
    });
};


/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAes256GcmAsync.prototype.decryptBytes = function (key, bytes, decryptedBytesLength, resultCallback) {
    var self = this;
    var iv = new Uint8Array(bytes.buffer, 0, this._ivLengthBytes);
    var encryptedData = new Uint8Array(bytes.buffer, this._ivLengthBytes);
    self._getWebCryptoKey(key).then(function(webCryptoKey) {
        return window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: self._tagSizeBytes * 8
            },
            webCryptoKey,
            encryptedData
        ).then(function(decrypted) {
            //returns an ArrayBuffer containing the decrypted data
            var decryptedData = tutao.crypto.Utils.unpad(new Uint8Array(decrypted));
            resultCallback({type: 'result', result: decryptedData});
        });
    }).catch(function(error){
        resultCallback({type: 'error', msg: "WebCryptoAes256GcmAsync decrypt error: " + error.message});
    });
};


/**
 * Returns the web crypto key.
 * @param {bitArray} key The key in sjcl bit array format
 * @returns {Promise.<Uint8Array>} The web crypto key. Attention: This is not a bluebird promise.
 * @private
 */
tutao.crypto.WebCryptoAes256GcmAsync.prototype._getWebCryptoKey = function(key) {
    return window.crypto.subtle.importKey(
        "raw", //can be "jwk" or "raw"
        sjcl.codec.arrayBuffer.fromBits(key),
        {
            name: "AES-GCM"
        },
        false, //whether the key is extractable (i.e. can be used in exportKey)
        ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
    );
};