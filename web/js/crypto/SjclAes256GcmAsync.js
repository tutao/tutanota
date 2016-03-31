"use strict";

tutao.provide('tutao.crypto.SjclAes256GcmAsync');

/**
 * @constructor
 *
 * @implements {tutao.crypto.AesInterfaceAsync}
 */
tutao.crypto.SjclAes256GcmAsync = function() {};

/**
 * @param {tutao.crypto.SjclAes256Gcm} syncInterface
 */
tutao.crypto.SjclAes256GcmAsync.prototype.init = function (syncInterface) {
    this._syncInterface = syncInterface;
};


/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256GcmAsync.prototype.encryptBytes = function (key, bytes, resultCallback) {
    try {
        var encryptedWords = this._syncInterface._encrypt(key, bytes, true);
        resultCallback({type: 'result', result: new Uint8Array(sjcl.codec.arrayBuffer.fromBits(encryptedWords))});
    } catch(error) {
        resultCallback({type: 'error', msg : "SjclAes1256Gcm encryption error: " + error.message});
    }
};


/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256GcmAsync.prototype.decryptBytes = function (key, bytes, decryptedBytesLength, resultCallback) {
    try {
        var decrypted = this._syncInterface._decrypt(key, sjcl.codec.arrayBuffer.toBits(bytes.buffer), true);
        resultCallback({type: 'result', result: decrypted});
    } catch(error) {
        resultCallback({type: 'error', msg : "SjclAes1256Gcm decryption error: " + error.message});
    }
};
