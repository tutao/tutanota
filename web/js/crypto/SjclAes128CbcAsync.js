"use strict";

tutao.provide('tutao.crypto.SjclAes128CbcAsync');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterfaceAsync}
 */
tutao.crypto.SjclAes128CbcAsync = function() {};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes128CbcAsync.prototype.aesEncrypt = function (key, bytes, resultCallback) {
    resultCallback({type:'error', msg: 'not implemented'});
};


/**
 * @inheritDoc
 */
tutao.crypto.SjclAes128CbcAsync.prototype.aesDecrypt = function (key, bytes, decryptedBytesLength, resultCallback) {
    resultCallback({type:'error', msg: 'not implemented'});
};
