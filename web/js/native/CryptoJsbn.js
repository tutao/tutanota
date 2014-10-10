"use strict";

tutao.provide('tutao.native.CryptoJsbn');

/**
 * @implements {tutao.native.CryptoInterface}
 * @constructor
 */
tutao.native.CryptoJsbn = function () {
    this.defaultKeyLengthInBits = 2048;
    this.publicExponent = 65537;
    this.worker = operative({
        generateRsaKey: function (keyLengthInBits, publicExponent, random, callback) {
            SecureRandom.setNextRandomBytes(random);
            try {
                var rsa = new RSAKey();
                rsa.generate(keyLengthInBits, publicExponent.toString(16)); // must be hex for JSBN
                // @type {tutao.native.KeyPair}
                var result = {
                    publicKey: {
                        version: 0,
                        keyLength: keyLengthInBits,
                        modulus: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(rsa.n.toByteArray())),
                        publicExponent: publicExponent
                    },
                    privateKey: {
                        version: 0,
                        keyLength: keyLengthInBits,
                        modulus: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(rsa.n.toByteArray())),
                        privateExponent: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(rsa.d.toByteArray())),
                        primeP: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(rsa.p.toByteArray())),
                        primeQ: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(rsa.q.toByteArray())),
                        primeExponentP: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(rsa.dmp1.toByteArray())),
                        primeExponentQ: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(rsa.dmq1.toByteArray())),
                        crtCoefficient: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(rsa.coeff.toByteArray()))
                    }
                };
                callback({ type: 'result', result: result});
            } catch (e) {
                callback({ type: 'error', msg: e.stack });
            }
        },
        rsaEncrypt: function (publicKey, bytes, randomBytes, callback) {
            try {
                var rsa = new RSAKey();
                rsa.n = new BigInteger(new Int8Array(this.base64ToArray(publicKey.modulus))); // BigInteger of JSBN uses a signed byte array and we convert to it by using Int8Array
                rsa.e = publicKey.publicExponent;
                var paddedBytes = new tutao.crypto.Oaep().pad(bytes, publicKey.keyLength, randomBytes);
                var paddedHex = this._bytesToHex(paddedBytes);

                var bigInt = parseBigInt(paddedHex, 16);
                var encrypted = rsa.doPublic(bigInt);

                var encryptedHex = encrypted.toString(16);
                if ((encryptedHex.length % 2) == 1) {
                    encryptedHex = "0" + encryptedHex;
                }

                callback({ type: 'result', result: new Uint8Array(this._hexToBytes(encryptedHex))});
            } catch (e) {
                callback({ type: 'error', msg: e.stack });
            }
        },
        rsaDecrypt: function (privateKey, bytes, callback) {
            try {
                var rsa = new RSAKey();
                // BigInteger of JSBN uses a signed byte array and we convert to it by using Int8Array
                rsa.n = new BigInteger(new Int8Array(this.base64ToArray(privateKey.modulus)));
                rsa.d = new BigInteger(new Int8Array(this.base64ToArray(privateKey.privateExponent)));
                rsa.p = new BigInteger(new Int8Array(this.base64ToArray(privateKey.primeP)));
                rsa.q = new BigInteger(new Int8Array(this.base64ToArray(privateKey.primeQ)));
                rsa.dmp1 = new BigInteger(new Int8Array(this.base64ToArray(privateKey.primeExponentP)));
                rsa.dmq1 = new BigInteger(new Int8Array(this.base64ToArray(privateKey.primeExponentQ)));
                rsa.coeff = new BigInteger(new Int8Array(this.base64ToArray(privateKey.crtCoefficient)));

                var hex = this._bytesToHex(bytes);
                var bigInt = parseBigInt(hex, 16);;
                var paddedBigInt = rsa.doPrivate(bigInt);
                var decryptedHex = paddedBigInt.toString(16);
                // fill the hex string to have a padded block of exactly (keylength / 8 - 1 bytes) for the unpad function
                // two possible reasons for smaller string:
                // - one "0" of the byte might be missing because toString(16) does not consider this
                // - the bigint value might be smaller than (keylength / 8 - 1) bytes
                var expectedPaddedHexLength = (privateKey.keyLength / 8 - 1) * 2;
                var fill = Array(expectedPaddedHexLength - decryptedHex.length + 1).join("0"); // creates the missing zeros
                decryptedHex = fill + decryptedHex;
                var paddedBytes = this._hexToBytes(decryptedHex);
                var bytes = new tutao.crypto.Oaep().unpad(paddedBytes, privateKey.keyLength);
                callback({ type: 'result', result: new Uint8Array(bytes)});
            } catch (e) {
                callback({ type: 'error', msg: e.stack});
            }
        },
        base64ToArray: function(base64) {
            return tutao.util.EncodingConverter.base64ToArray(base64);
        },
        _hexToBytes: function (hex) {
            return tutao.util.EncodingConverter.hexToBytes(hex);
        },
        _bytesToHex: function (bytes) {
            return tutao.util.EncodingConverter.bytesToHex(bytes);
        }
    }, tutao.native.CryptoJsbn.DEPENDENCIES);
};

tutao.native.CryptoJsbn.initWorkerFileNames = function(basePath) {
    var libsPath = basePath + "lib/worker/";
    var srcPath = basePath + "js/";
    if (tutao.env.type === tutao.Env.LOCAL) {
        tutao.native.CryptoJsbn.DEPENDENCIES = [
                libsPath + 'base.js',
                libsPath + 'base64shim.js',
                libsPath + 'crypto-jsbn-2012-08-09_1.js',
                libsPath + 'crypto-sjcl-2012-08-09_1.js',
                srcPath + 'crypto/SecureRandom.js',
                srcPath + 'crypto/Oaep.js',
                srcPath + 'util/EncodingConverter.js'
        ];
    } else {
        tutao.native.CryptoJsbn.DEPENDENCIES = ['app.min.js'];
    }
};

tutao.native.CryptoJsbn.prototype.generateRsaKey = function (keyLength) {
    var self = this;
    keyLength = typeof keyLength !== 'undefined' ? keyLength : this.defaultKeyLengthInBits; // optional param
    var random = this._random(512);
    return new Promise(function (resolve, reject) {
        self.worker.generateRsaKey(keyLength, self.publicExponent, random, self._createReturnHandler(resolve, reject));
    });
};

tutao.native.CryptoJsbn.prototype.rsaEncrypt = function (publicKey, bytes) {
    var self = this;
    var random = this._random(32);
    return new Promise(function (resolve, reject) {
        self.worker.rsaEncrypt(publicKey, bytes, random, self._createReturnHandler(resolve, reject));
    });
};

tutao.native.CryptoJsbn.prototype.rsaDecrypt = function (privateKey, bytes) {
    var self = this;
    return new Promise(function (resolve, reject) {
        self.worker.rsaDecrypt(privateKey, bytes, self._createReturnHandler(resolve, reject));
    });
};


tutao.native.CryptoJsbn.prototype.generateKeyFromPassphrase = function(passphrase, salt) {
	return tutao.locator.kdfCrypter.generateKeyFromPassphrase(passphrase, salt);
};



tutao.native.CryptoJsbn.prototype._unsign = function (signedArray) {
    var unsignedArray = [];
    for (var i = 0; i < signedArray.length; i++) {
        unsignedArray.push(signedArray[i] & 0xff);
    }
    return unsignedArray;
};

tutao.native.CryptoJsbn.prototype._random = function (byteLength) {
    // TODO retrieve bytes directly
    return tutao.util.EncodingConverter.hexToBytes(tutao.locator.randomizer.generateRandomData(byteLength));
};

tutao.native.CryptoJsbn.prototype._createReturnHandler = function (resolve, reject) {
    return function (data) {
        if (data.type != 'result') {
            reject(data.msg);
        } else {
            resolve(data.result);
        }
    }
};