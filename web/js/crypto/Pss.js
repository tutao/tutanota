"use strict";

tutao.provide('tutao.crypto.Pss');

/**
 * @constructor
 * @see https://tools.ietf.org/html/rfc3447#section-9.1
 */
tutao.crypto.Pss = function () {
    this.utils = new tutao.crypto.Utils();
};

/**
 * @param {Array.<number>} message The byte array to encode.
 * @param {number} keyLength The length of the RSA key in bit.
 * @param {Array.<number>} salt An array of random bytes of 256 bytes.
 * @return {Array.<number>} The padded byte array.
 */
tutao.crypto.Pss.prototype.encode = function (message, keyLength, salt) {
    var hashLength = 32; // bytes sha256
    var emLen = Math.ceil(keyLength / 8);
    if (salt.length != hashLength) {
        throw new Error("invalid salt length: " + salt.length + ". expected: " + hashLength + " bytes!");
    }
    var length = hashLength + salt.length + 2;
    if (emLen < length) {
        throw new Error("invalid hash/salt length: " + length + ". expected: max. " + emLen);
    }
    var emBits = keyLength - 1;
    var minEmBitsLength = 8 * hashLength + 8 * salt.length + 9;
    if (emBits < minEmBitsLength) {
        throw new Error("invalid maximum emBits length. Was " + emBits + ", expected: " + minEmBitsLength);
    }

    var messageHash = sjcl.codec.bytes.fromBits(sjcl.hash.sha256.hash(sjcl.codec.bytes.toBits(message)));

    //  M' = (0x)00 00 00 00 00 00 00 00 || mHash || salt;
    var message2 = [0,0,0,0,0,0,0,0].concat(messageHash, salt);

    var message2Hash = sjcl.codec.bytes.fromBits(sjcl.hash.sha256.hash(sjcl.codec.bytes.toBits(message2)));

    var ps = [];
    ps.length = emLen - salt.length - hashLength - 2;
    for (var i = 0; i < ps.length; i++) {
        ps[i] = 0;
    }

    var db = ps.concat([1], salt);
    this._clear(ps);
    var expectedDbLength = emLen - hashLength - 1;
    if (db.length != expectedDbLength) {
        throw new Error("unexpected length of block: " + db.length + ". Expected: " + expectedDbLength);
    }

    var dbMask = this.utils.mgf1(message2Hash, emLen - message2Hash.length - 1);
    var maskedDb = [];
    for (var i = 0; i < dbMask.length; i++) {
        maskedDb[i] = db[i] ^ dbMask[i];
    }
    this._clear(db);

    maskedDb[0] &= (0xff >> (8 * emLen - emBits));

    var em = maskedDb.concat(message2Hash, [188]); // 0xbc
    this._clear(maskedDb);

    return em;
};

/**
 * @param {Array.<number>} message The message to verify.
 * @param {Array.<number>} encodedMessage The encodedMessage to verify against.
 * @param {number} keyLength The length of the RSA key in bit.
 * @return {Array.<Error>} An error occurs, if it was not possible to verify the signature.
 */
tutao.crypto.Pss.prototype.verify = function (message, encodedMessage, keyLength) {
    var hashLength = 32; // bytes sha256
    var saltLength = hashLength;
    var emLen = Math.ceil(keyLength / 8);
    var minEncodedLength = hashLength + saltLength + 2;
    try {

        if (encodedMessage.length < minEncodedLength) {
            throw new Error("invalid length of encoded message: " + encodedMessage.length + ". expected: > " + minEncodedLength + " bytes!");
        }
        if(encodedMessage[encodedMessage.length -1] != 188) {
            throw new Error("rightmost octet of EM must be 188 (0xbc) but was " + encodedMessage[encodedMessage.length -1]);
        }

        var maskedDB = encodedMessage.slice(0, emLen - hashLength - 1);
        var hash = encodedMessage.slice(emLen - hashLength - 1, emLen - hashLength - 1 + hashLength);

        // If the leftmost 8emLen - emBits bits of the leftmost octet in maskedDB are not all equal to zero, output "inconsistent" and stop.
        if ((maskedDB[0] >> 8 - (8 * emLen - keyLength)) != 0) {
            throw new Error("inconsistent leftmost octet in maskedDB.");
        }

        var dbMask = this.utils.mgf1(hash, emLen - hashLength - 1);

        var db = [];
        for (var i=0; i < dbMask.length; i++) {
            db[i] = maskedDB[i] ^ dbMask[i];
        }

        db[0] &= (0xff >> (8 * emLen - keyLength));

        for (var i = 1; i < emLen - hashLength - saltLength - 2; i++) {
            if (db[i] != 0) {
                throw new Error("inconsistent leftmost octets of db.");
            }
        }

        if (db[emLen - hashLength - saltLength - 1] != 1) {
            throw new Error("inconsistent octet value in db. Expected 1 (0x01) but was " + db[emLen - hashLength - saltLength - 1]);
        }

        var salt = db.slice(db.length - saltLength);

        var messageHash = sjcl.codec.bytes.fromBits(sjcl.hash.sha256.hash(sjcl.codec.bytes.toBits(message)));
        var message2 = [0,0,0,0,0,0,0,0].concat(messageHash, salt);
        var message2Hash = sjcl.codec.bytes.fromBits(sjcl.hash.sha256.hash(sjcl.codec.bytes.toBits(message2)));

        if (!tutao.util.ArrayUtils.arrayEquals(hash, message2Hash)) {
            throw new Error("Hashes do not match");
        }
    } finally {
        this._clear(message);
        this._clear(encodedMessage);
        this._clear(maskedDB);
        this._clear(hash);
        this._clear(dbMask);
        this._clear(db);
        this._clear(salt);
        this._clear(messageHash);
        this._clear(message2);
        this._clear(message2Hash);
    }
};

/**
 * clears an array to contain only zeros (0)
 */
tutao.crypto.Pss.prototype._clear = function (array) {
    if (!array) {
        return;
    }
    for (var i = 0; i < array.length; i++) {
        array[i] = 0;
    }
};