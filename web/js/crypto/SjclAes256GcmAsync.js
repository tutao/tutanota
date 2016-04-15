"use strict";

tutao.provide('tutao.crypto.SjclAes256GcmAsync');

/**
 * @constructor
 *
 * @implements {tutao.crypto.AesInterfaceAsync}
 */
tutao.crypto.SjclAes256GcmAsync = function() {};


/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256GcmAsync.prototype.encryptBytes = function (key, bytes, randomIv, resultCallback) {
    try {
        var paddedBytes = tutao.crypto.Utils.pad(bytes);
        var words = sjcl.codec.arrayBuffer.toBits(paddedBytes.buffer);
        var iv = sjcl.codec.arrayBuffer.toBits(randomIv.buffer);
        var encrypted = sjcl.mode.gcm.encrypt(new sjcl.cipher.aes(key), words, iv, [], tutao.crypto.AesInterface.TAG_BIT_LENGTH);
        var encryptedWords = sjcl.bitArray.concat(iv, encrypted);
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
        var words = sjcl.codec.arrayBuffer.toBits(bytes.buffer);
        var iv = sjcl.bitArray.bitSlice(words, 0, tutao.crypto.AesInterface.IV_BIT_LENGTH);
        var ciphertext = sjcl.bitArray.bitSlice(words, tutao.crypto.AesInterface.IV_BIT_LENGTH);
        var decrypted = sjcl.mode.gcm.decrypt(new sjcl.cipher.aes(key), ciphertext, iv, [], tutao.crypto.AesInterface.TAG_BIT_LENGTH);
        var decryptedBytes = new Uint8Array(sjcl.codec.arrayBuffer.fromBits(decrypted));
        var unpaddedBytes = tutao.crypto.Utils.unpad(decryptedBytes);
        resultCallback({type: 'result', result: unpaddedBytes});
    } catch(error) {
        resultCallback({type: 'error', msg : "SjclAes1256Gcm decryption error: " + error.message});
    }
};
