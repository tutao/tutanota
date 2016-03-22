"use strict";

tutao.provide('tutao.native.RsaUtils');

/**
 * @constructor
 */
tutao.native.RsaUtils = function () {
    this.keyLengthInBits = 2048;
};
/**
 * @param {tutao.native.KeyPair} keypair
 * @return {object}
 * @private
 */
/*tutao.native.RsaUtils.prototype._convertFromKeyPair = function (keypair) {
    return {
        publicKey: this._publicKeyToArray(keypair.publicKey),
        privateKey: this._privateKeyToArray(keypair.privateKey)};
};*/

/**
 * @param publicKey {tutao.native.PublicKey}
 * @returns {[]} The public key in a persistable array format
 * @private
 */
tutao.native.RsaUtils.prototype._publicKeyToArray = function (publicKey) {
    return [this._base64ToBigInt(publicKey.modulus)];
};

/**
 * @param publicKey {tutao.native.PrivateKey}
 * @returns {[]} The private key in a persistable array format
 * @private
 */
tutao.native.RsaUtils.prototype._privateKeyToArray = function (privateKey) {
    return [
        this._base64ToBigInt(privateKey.modulus),
        this._base64ToBigInt(privateKey.privateExponent),
        this._base64ToBigInt(privateKey.primeP),
        this._base64ToBigInt(privateKey.primeQ),
        this._base64ToBigInt(privateKey.primeExponentP),
        this._base64ToBigInt(privateKey.primeExponentQ),
        this._base64ToBigInt(privateKey.crtCoefficient)
    ];
};

/**
 * @param {object}
 * @return {tutao.native.KeyPair}
 * @private
 */
/*tutao.native.RsaUtils.prototype._arrayToKeyPair = function (object) {
    return {
        publicKey: this._arrayToPublicKey(object.publicKey),
        privateKey: this._arrayToPrivateKey(object.privateKey)
    };
};*/

tutao.native.RsaUtils.prototype._arrayToPublicKey = function (publicKey) {
    var self = this;
    return {
        version: 0,
        keyLength: self.keyLengthInBits,
        modulus: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(publicKey[0].toByteArray())),
        publicExponent: tutao.locator.crypto.publicExponent
    };
};

tutao.native.RsaUtils.prototype._arrayToPrivateKey = function (privateKey) {
    var self = this;
    return {
        version: 0,
        keyLength: self.keyLengthInBits,
        modulus: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(privateKey[0].toByteArray())),
        privateExponent: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(privateKey[1].toByteArray())),
        primeP: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(privateKey[2].toByteArray())),
        primeQ: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(privateKey[3].toByteArray())),
        primeExponentP: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(privateKey[4].toByteArray())),
        primeExponentQ: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(privateKey[5].toByteArray())),
        crtCoefficient: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(privateKey[6].toByteArray()))
    };
};

tutao.native.RsaUtils.prototype._base64ToBigInt = function (base64) {
    return parseBigInt(tutao.util.EncodingConverter.base64ToHex(base64),16);
};

/**
 * Provides the length of the given string as hex string of 4 characters length. Padding to 4 characters is done with '0'.
 * @param {string} string A string to get the length of.
 * @return {string} A hex string containing the length of string.
 */
tutao.native.RsaUtils.prototype._hexLen = function (string) {
    var hexLen = string.length.toString(16);
    while (hexLen.length < 4) {
        hexLen = "0" + hexLen;
    }
    return hexLen;
};


tutao.native.RsaUtils.prototype._keyToHex = function (key) {
    var hex = "";
    for (var i = 0; i < key.length; i++) {
        var param = key[i].toString(16);
        if ((param.length % 2) == 1) {
            param = "0" + param;
        }
        hex += this._hexLen(param) + param;
    }
    return hex;
};

tutao.native.RsaUtils.prototype._hexToKey = function (hex) {
    try {
        var key = [];
        var pos = 0;
        while (pos < hex.length) {
            var nextParamLen = parseInt(hex.substring(pos, pos + 4), 16);
            pos += 4;
            key.push(parseBigInt(hex.substring(pos, pos + nextParamLen), 16));
            pos += nextParamLen;
        }
        this._validateKeyLength(key);
        return key;
    } catch (e) {
        throw new tutao.crypto.CryptoError("hex to rsa key failed", e);
    }
};

tutao.native.RsaUtils.prototype._validateKeyLength = function (key) {
    if (key.length != 1 && key.length != 7) {
        throw new Error("invalid key params");
    }
    if (key[0].bitLength() < this.keyLengthInBits - 1 || key[0].bitLength() > this.keyLengthInBits) {
        throw new Error("invalid key length, expected: around " + this.keyLengthInBits + ", but was: " + key[0].bitLength());
    }
};

tutao.native.RsaUtils.prototype.privateKeyToHex = function (privateKey) {
    return this._keyToHex(this._privateKeyToArray(privateKey));
};

tutao.native.RsaUtils.prototype.publicKeyToHex = function (publicKey) {
    return this._keyToHex(this._publicKeyToArray(publicKey));
};

tutao.native.RsaUtils.prototype.hexToPrivateKey = function (privateKeyHex) {
    return this._arrayToPrivateKey(this._hexToKey(privateKeyHex));
};

tutao.native.RsaUtils.prototype.hexToPublicKey = function (publicKeyHex) {
    return this._arrayToPublicKey(this._hexToKey(publicKeyHex));
};