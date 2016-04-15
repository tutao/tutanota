"use strict";

tutao.provide('tutao.native.CryptoBrowser');

/**
 * @implements {tutao.native.CryptoInterface}
 * @constructor
 *
 * Signatures: http://world.std.com/~dtd/sign_encrypt/sign_encrypt7.html
 *
 */
tutao.native.CryptoBrowser = function () {
    this.defaultKeyLengthInBits = 2048;
    this.aesKeyLength = 128;
    this.publicExponent = 65537;
    this.worker = operative(tutao.native.CryptoBrowser._workerFunctions, tutao.native.CryptoBrowser.DEPENDENCIES);
    this.worker.init();
};

tutao.native.CryptoBrowser._workerFunctions = {

    init: function() {
        this._aes128Cbc = new tutao.crypto.SjclAes128CbcAsync();
    },

    generateRsaKey: function (keyLengthInBits, publicExponent, randomBytes, callback) {
        SecureRandom.setNextRandomBytes(this._uint8ArrayToByteArray(randomBytes));
        try {
            var rsa = new RSAKey();
            rsa.generate(keyLengthInBits, publicExponent.toString(16)); // must be hex for JSBN
            // @type {tutao.native.KeyPair}
            var result = {
                publicKey: {
                    version: 0,
                    keyLength: keyLengthInBits,
                    modulus: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(rsa.n.toByteArray())),
                    publicExponent: publicExponent
                },
                privateKey: {
                    version: 0,
                    keyLength: keyLengthInBits,
                    modulus: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(rsa.n.toByteArray())),
                    privateExponent: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(rsa.d.toByteArray())),
                    primeP: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(rsa.p.toByteArray())),
                    primeQ: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(rsa.q.toByteArray())),
                    primeExponentP: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(rsa.dmp1.toByteArray())),
                    primeExponentQ: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(rsa.dmq1.toByteArray())),
                    crtCoefficient: tutao.util.EncodingConverter.uint8ArrayToBase64(new Uint8Array(rsa.coeff.toByteArray()))
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
            var paddedBytes = new tutao.crypto.Oaep().pad(bytes, publicKey.keyLength, this._uint8ArrayToByteArray(randomBytes));
            var paddedHex = this._bytesToHex(paddedBytes);

            var bigInt = parseBigInt(paddedHex, 16);
            var encrypted = rsa.doPublic(bigInt);

            var encryptedHex = encrypted.toString(16);
            if ((encryptedHex.length % 2) == 1) {
                encryptedHex = "0" + encryptedHex;
            }

            callback({ type: 'result', result: tutao.util.EncodingConverter.hexToUint8Array(encryptedHex)});
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
            var bigInt = parseBigInt(hex, 16);
            var paddedBigInt = rsa.doPrivate(bigInt);
            var decryptedHex = paddedBigInt.toString(16);
            // fill the hex string to have a padded block of exactly (keylength / 8 - 1 bytes) for the unpad function
            // two possible reasons for smaller string:
            // - one "0" of the byte might be missing because toString(16) does not consider this
            // - the bigint value might be smaller than (keylength / 8 - 1) bytes
            var expectedPaddedHexLength = (privateKey.keyLength / 8 - 1) * 2;
            var fill = Array(expectedPaddedHexLength - decryptedHex.length + 1).join("0"); // creates the missing zeros
            decryptedHex = fill + decryptedHex;
            var paddedBytes = this._uint8ArrayToByteArray(tutao.util.EncodingConverter.hexToUint8Array(decryptedHex));
            var bytes = new tutao.crypto.Oaep().unpad(paddedBytes, privateKey.keyLength);
            callback({ type: 'result', result: new Uint8Array(bytes)});
        } catch (e) {
            callback({ type: 'error', msg: e.stack});
        }
    },
    sign: function(privateKey, bytes, randomBytes, callback) {
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

            var paddedBytes = new tutao.crypto.Pss().encode(bytes, privateKey.keyLength - 1, this._uint8ArrayToByteArray(randomBytes));
            var paddedHex = this._bytesToHex(paddedBytes);

            var bigInt = parseBigInt(paddedHex, 16);
            var signed = rsa.doPrivate(bigInt);

            var signedHex = signed.toString(16);
            if ((signedHex.length % 2) == 1) {
                signedHex = "0" + signedHex;
            }

            callback({ type: 'result', result: tutao.util.EncodingConverter.hexToUint8Array(signedHex)});
        } catch (e) {
            callback({ type: 'error', msg: e.stack});
        }
    },
    verifySignature: function (publicKey, bytes, signature) {
        try {
            var rsa = new RSAKey();
            rsa.n = new BigInteger(new Int8Array(this.base64ToArray(publicKey.modulus))); // BigInteger of JSBN uses a signed byte array and we convert to it by using Int8Array
            rsa.e = publicKey.publicExponent;

            var signatureHex = this._bytesToHex(signature);
            var bigInt = parseBigInt(signatureHex, 16);
            var padded = rsa.doPublic(bigInt);

            var paddedHex = padded.toString(16);
            if ((paddedHex.length % 2) == 1) {
                paddedHex = "0" + paddedHex;
            }
            var paddedBytes = this._uint8ArrayToByteArray(tutao.util.EncodingConverter.hexToUint8Array(paddedHex));
            new tutao.crypto.Pss().verify(bytes, paddedBytes, publicKey.keyLength - 1);

            callback({ type: 'result', result: undefined});
        } catch (e) {
            callback({ type: 'error', msg: e.stack });
        }
    },
    base64ToArray: function(base64) {
        return tutao.util.EncodingConverter.base64ToUint8Array(base64);
    },

    _uint8ArrayToByteArray: function (uint8Array) {
        return [].slice.call(uint8Array);
    },
    _bytesToHex: function (bytes) {
        return tutao.util.EncodingConverter.uint8ArrayToHex(new Uint8Array(bytes));
    },

    aesEncrypt: function(key, plainText, random, callback) {
        this._aes128Cbc.encryptBytes(key, plainText, random, callback);
    },
    aesDecrypt: function(key, cipherText, decryptedSize, callback) {
        this._aes128Cbc.decryptBytes(key, cipherText, decryptedSize, callback);
    }
};

tutao.native.CryptoBrowser.initWorkerFileNames = function(basePath) {
    var libsPath = basePath + "lib/worker/";
    var srcPath = basePath + "js/";
    if (tutao.env.type === tutao.Env.LOCAL) {
        tutao.native.CryptoBrowser.DEPENDENCIES = [
                libsPath + 'base.js',
                libsPath + 'base64shim.js',
                libsPath + 'crypto-jsbn-2012-08-09_1.js',
                libsPath + 'crypto-sjcl-1.3.0_1.js',
                srcPath + 'crypto/SecureRandom.js',
                srcPath + 'crypto/Oaep.js',
                srcPath + 'crypto/Pss.js',
                srcPath + 'crypto/Utils.js',
                srcPath + 'util/EncodingConverter.js',
                srcPath + 'crypto/AesInterface.js',
                srcPath + 'crypto/SjclAes128CbcAsync.js'
        ];
    } else {
        tutao.native.CryptoBrowser.DEPENDENCIES = ['worker.min.js'];
    }
};

tutao.native.CryptoBrowser.prototype.generateRsaKey = function (keyLength) {
    var self = this;
    keyLength = typeof keyLength !== 'undefined' ? keyLength : this.defaultKeyLengthInBits; // optional param
    var randomBytes = tutao.locator.randomizer.generateRandomData(512);
    return new Promise(function (resolve, reject) {
        self.worker.generateRsaKey(keyLength, self.publicExponent, randomBytes, self._createReturnHandler(resolve, reject));
    });
};

tutao.native.CryptoBrowser.prototype.rsaEncrypt = function (publicKey, bytes) {
    var self = this;
    var randomBytes = tutao.locator.randomizer.generateRandomData(32);
    return new Promise(function (resolve, reject) {
        self.worker.rsaEncrypt(publicKey, bytes, randomBytes, self._createReturnHandler(resolve, reject));
    });
};

tutao.native.CryptoBrowser.prototype.rsaDecrypt = function (privateKey, bytes) {
    var self = this;
    return new Promise(function (resolve, reject) {
        self.worker.rsaDecrypt(privateKey, bytes, self._createReturnHandler(resolve, reject));
    });
};

tutao.native.CryptoBrowser.prototype.sign = function (privateKey, bytes) {
    var self = this;
    var randomBytes = tutao.locator.randomizer.generateRandomData(32);
    return new Promise(function (resolve, reject) {
        self.worker.sign(privateKey, bytes, randomBytes, self._createReturnHandler(resolve, reject));
    });
};

tutao.native.CryptoBrowser.prototype.verifySignature = function (publicKey, bytes, signature) {
    var self = this;
    return new Promise(function (resolve, reject) {
        self.worker.verifySignature(publicKey, bytes, signature, self._createReturnHandler(resolve, reject));
    });
};

tutao.native.CryptoBrowser.prototype.aesEncrypt = function (key, bytes) {
    var self = this;
    var random = tutao.locator.randomizer.generateRandomData(tutao.crypto.AesInterface.IV_BYTE_LENGTH);
    return new Promise(function (resolve, reject) {
        //if (key.length !== (self.aesKeyLength / 8)) {
        //    throw new tutao.crypto.CryptoError("invalid key length: " + key.length);
        //}
        self.worker.aesEncrypt(key, bytes, random, self._createReturnHandler(resolve, reject));
    });
};

tutao.native.CryptoBrowser.prototype.aesDecrypt = function (key, cipherText, decryptedSize) {
    var self = this;
    return new Promise(function (resolve, reject) {
        //var byteKeyLength = self.aesKeyLength / 8;
        //if (key.length !== byteKeyLength) {
        //    throw new tutao.crypto.CryptoError("invalid key length: " + key.length);
        //}
        //if (cipherText.length % byteKeyLength != 0 || cipherText.length < 2 * byteKeyLength) {
        //    throw new tutao.crypto.CryptoError("invalid src buffer len: " + cipherText.length);
        //}
        //if (decryptedSize < (cipherText.length - 2 * byteKeyLength)) {
        //    throw new tutao.crypto.CryptoError("invalid dst buffer len: " + decryptedSize + ", src buffer len: " + cipherText.length);
        //}
        self.worker.aesDecrypt(key, cipherText, decryptedSize, self._createReturnHandler(resolve, reject));
    });
};

tutao.native.CryptoBrowser.prototype._unsign = function (signedArray) {
    var unsignedArray = [];
    for (var i = 0; i < signedArray.length; i++) {
        unsignedArray.push(signedArray[i] & 0xff);
    }
    return unsignedArray;
};

tutao.native.CryptoBrowser.prototype._createReturnHandler = function (resolve, reject) {
    return function (data) {
        if (data.type != 'result') {
            reject(new tutao.crypto.CryptoError(data.msg));
        } else {
            resolve(data.result);
        }
    }
};

tutao.native.CryptoBrowser.prototype.aesEncryptFile = function (key, fileUrl) {
    throw new Error("Not implemented");
};

tutao.native.CryptoBrowser.prototype.aesDecryptFile = function (key, fileUrl) {
    throw new Error("Not implemented");
};
