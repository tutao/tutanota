"use strict";

tutao.provide('tutao.native.CryptoBrowser');

/**
 * @implements {tutao.native.CryptoInterface}
 * @constructor
 */
tutao.native.CryptoBrowser = function () {
    this.defaultKeyLengthInBits = 2048;
    this.aesKeyLength = 128;
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
        },
        _int32ToUint32: function (value) {
            if (value < 0) {
                return value + 4294967296; // =2^32
            } else {
                return value;
            }
        },
        aesEncrypt: function(key, plainText, random, callback) {
            try {
                var byteKeyLength = key.length;
                var iv = sjcl.codec.bytes.toBits(random);

                var xor = sjcl.bitArray._xor4;
                var uint32ArraysPerBlock = byteKeyLength / 4;
                var prp = new sjcl.cipher.aes(sjcl.codec.bytes.toBits(key));
                // the floor'ed division cuts off a last partial block which must be padded. if no partial block exists a padding block must be added.
                // so in both cases a padded block is added plus a block for the iv
                var nbrOfFullSrcBlocks = Math.floor(plainText.length / byteKeyLength);

                var dstBuffer = new ArrayBuffer((nbrOfFullSrcBlocks + 2) * byteKeyLength);
                var srcDataView = new DataView(plainText.buffer);
                var dstDataView = new DataView(dstBuffer);

                // put the iv into first destination block
                for (var i = 0; i < uint32ArraysPerBlock; i++) {
                    dstDataView.setUint32(i * 4, this._int32ToUint32(iv[i]), false);
                }

                // encrypt full src blocks
                var plainBlock = [0, 0, 0, 0]; // dummy initialization
                for (var i = 0; i < (nbrOfFullSrcBlocks * uint32ArraysPerBlock); i += uint32ArraysPerBlock) {
                    plainBlock[0] = srcDataView.getUint32(i * 4, false);
                    plainBlock[1] = srcDataView.getUint32((i + 1) * 4, false);
                    plainBlock[2] = srcDataView.getUint32((i + 2) * 4, false);
                    plainBlock[3] = srcDataView.getUint32((i + 3) * 4, false);
                    iv = prp.encrypt(xor(iv, plainBlock));
                    var dstBlockOffset = (uint32ArraysPerBlock + i) * 4;
                    dstDataView.setUint32(dstBlockOffset, this._int32ToUint32(iv[0]), false);
                    dstDataView.setUint32(dstBlockOffset + 4, this._int32ToUint32(iv[1]), false);
                    dstDataView.setUint32(dstBlockOffset + 8, this._int32ToUint32(iv[2]), false);
                    dstDataView.setUint32(dstBlockOffset + 12, this._int32ToUint32(iv[3]), false);
                }

                // padding
                var srcDataViewLastBlock = new DataView(new ArrayBuffer(byteKeyLength));
                var i;
                // copy the remaining bytes to the last block
                var nbrOfRemainingSrcBytes = plainText.length - nbrOfFullSrcBlocks * byteKeyLength;
                for (i = 0; i < nbrOfRemainingSrcBytes; i++) {
                    srcDataViewLastBlock.setUint8(i, srcDataView.getUint8(nbrOfFullSrcBlocks * byteKeyLength + i));
                }
                // fill the last block with padding bytes
                var paddingByte = byteKeyLength - (plainText.length % byteKeyLength);
                for (; i < byteKeyLength; i++) {
                    srcDataViewLastBlock.setUint8(i, paddingByte);
                }
                plainBlock[0] = srcDataViewLastBlock.getUint32(0, false);
                plainBlock[1] = srcDataViewLastBlock.getUint32(4, false);
                plainBlock[2] = srcDataViewLastBlock.getUint32(8, false);
                plainBlock[3] = srcDataViewLastBlock.getUint32(12, false);
                iv = prp.encrypt(xor(iv, plainBlock));
                var dstLastBlockOffset = (nbrOfFullSrcBlocks + 1) * byteKeyLength;
                dstDataView.setUint32(dstLastBlockOffset, this._int32ToUint32(iv[0]), false);
                dstDataView.setUint32(dstLastBlockOffset + 4, this._int32ToUint32(iv[1]), false);
                dstDataView.setUint32(dstLastBlockOffset + 8, this._int32ToUint32(iv[2]), false);
                dstDataView.setUint32(dstLastBlockOffset + 12, this._int32ToUint32(iv[3]), false);
                callback({ type: 'result', result: new Uint8Array(dstBuffer)});
            } catch (e) {
                callback({ type: 'error', msg: e.stack});
            }
        },
        aesDecrypt: function(key, cipherText, decryptedSize, callback) {
            try {
                var byteKeyLength = key.length;
                var xor = sjcl.bitArray._xor4;

                var uint32ArraysPerBlock = byteKeyLength / 4;
                var prp = new sjcl.cipher.aes(sjcl.codec.bytes.toBits(key));
                // iv and padding block are not full blocks
                var nbrOfFullSrcBlocks = cipherText.length / byteKeyLength - 2;

                var dstBuffer = new ArrayBuffer(decryptedSize);
                var srcDataView = new DataView(cipherText.buffer);
                var dstDataView = new DataView(dstBuffer);

                var iv = [];
                for (var i = 0; i < uint32ArraysPerBlock; i++) {
                    iv.push(srcDataView.getUint32(i * 4, false));
                }
                // move the view behind the iv
                srcDataView = new DataView(cipherText.buffer, byteKeyLength);

                // decrypt full src blocks
                var decryptedBlock = null;
                for (var i = 0; i < ((nbrOfFullSrcBlocks + 1) * uint32ArraysPerBlock); i += uint32ArraysPerBlock) {
                    var encryptedBlock = [srcDataView.getUint32(i * 4, false),
                        srcDataView.getUint32((i + 1) * 4, false),
                        srcDataView.getUint32((i + 2) * 4, false),
                        srcDataView.getUint32((i + 3) * 4, false)];
                    decryptedBlock = xor(iv, prp.decrypt(encryptedBlock));
                    if (i < (nbrOfFullSrcBlocks * uint32ArraysPerBlock)) {
                        dstDataView.setUint32(i * 4, decryptedBlock[0], false);
                        dstDataView.setUint32(i * 4 + 4, decryptedBlock[1], false);
                        dstDataView.setUint32(i * 4 + 8, decryptedBlock[2], false);
                        dstDataView.setUint32(i * 4 + 12, decryptedBlock[3], false);
                        iv = encryptedBlock;
                    } else {
                        var lastSrcBlock = new DataView(new ArrayBuffer(byteKeyLength));
                        // copy the decrypted uint32 to the last block
                        for (var a = 0; a < uint32ArraysPerBlock; a++) {
                            lastSrcBlock.setUint32(a * 4, this._int32ToUint32(decryptedBlock[a]), false);
                        }
                        // check the padding length
                        var nbrOfPaddingBytes = decryptedBlock[3] & 255;
                        if (nbrOfPaddingBytes == 0 || nbrOfPaddingBytes > 16) {
                            throw new Error("invalid padding value: " + nbrOfPaddingBytes);
                        }
                        if (decryptedSize != ((nbrOfFullSrcBlocks + 1) * byteKeyLength - nbrOfPaddingBytes)) {
                            throw new Error("invalid decrypted size: " + decryptedSize + ", expected: " + (nbrOfFullSrcBlocks * byteKeyLength + nbrOfPaddingBytes));
                        }
                        // copy the remaining bytes
                        var a;
                        for (a = 0; a < (byteKeyLength - nbrOfPaddingBytes); a++) {
                            dstDataView.setUint8(nbrOfFullSrcBlocks * byteKeyLength + a, lastSrcBlock.getUint8(a));
                        }
                        // check the padding bytes
                        for (; a < byteKeyLength; a++) {
                            if (lastSrcBlock.getUint8(a) != nbrOfPaddingBytes) {
                                throw new Error("invalid padding byte found: " + lastSrcBlock.getUint8(a) + ", expected: " + nbrOfPaddingBytes);
                            }
                        }
                    }
                }
                callback({ type: 'result', result: new Uint8Array(dstBuffer)});
            } catch (e) {
                callback({ type: 'error', msg: e.stack});
            }
        }
    }, tutao.native.CryptoBrowser.DEPENDENCIES);
};

tutao.native.CryptoBrowser.initWorkerFileNames = function(basePath) {
    var libsPath = basePath + "lib/worker/";
    var srcPath = basePath + "js/";
    if (tutao.env.type === tutao.Env.LOCAL) {
        tutao.native.CryptoBrowser.DEPENDENCIES = [
                libsPath + 'base.js',
                libsPath + 'base64shim.js',
                libsPath + 'crypto-jsbn-2012-08-09_1.js',
                libsPath + 'crypto-sjcl-2012-08-09_1.js',
                srcPath + 'crypto/SecureRandom.js',
                srcPath + 'crypto/Oaep.js',
                srcPath + 'util/EncodingConverter.js'
        ];
    } else {
        tutao.native.CryptoBrowser.DEPENDENCIES = ['app.min.js'];
    }
};

tutao.native.CryptoBrowser.prototype.generateRsaKey = function (keyLength) {
    var self = this;
    keyLength = typeof keyLength !== 'undefined' ? keyLength : this.defaultKeyLengthInBits; // optional param
    var random = this._random(512);
    return new Promise(function (resolve, reject) {
        self.worker.generateRsaKey(keyLength, self.publicExponent, random, self._createReturnHandler(resolve, reject));
    });
};

// attention: keep in sync with Legacy implementation
tutao.native.CryptoBrowser.prototype.generateKeyFromPassphrase = function(passphrase, salt) {
    return tutao.locator.kdfCrypter.generateKeyFromPassphrase(passphrase, salt);
};

tutao.native.CryptoBrowser.prototype.rsaEncrypt = function (publicKey, bytes) {
    var self = this;
    var random = this._random(32);
    return new Promise(function (resolve, reject) {
        self.worker.rsaEncrypt(publicKey, bytes, random, self._createReturnHandler(resolve, reject));
    });
};

tutao.native.CryptoBrowser.prototype.rsaDecrypt = function (privateKey, bytes) {
    var self = this;
    return new Promise(function (resolve, reject) {
        self.worker.rsaDecrypt(privateKey, bytes, self._createReturnHandler(resolve, reject));
    });
};

/**
 * Returns the newly generated key
 * @return {Uint8Array} will return the key.
 */
tutao.native.CryptoBrowser.prototype.generateAesKey = function() {
    return new Uint8Array(tutao.util.EncodingConverter.hexToBytes(tutao.locator.randomizer.generateRandomData(128 / 8)));
};

tutao.native.CryptoBrowser.prototype.aesEncrypt = function (key, bytes) {
    var self = this;
    var random = this._random(this.aesKeyLength / 8); // for IV
    return new Promise(function (resolve, reject) {
        if (key.length !== (self.aesKeyLength / 8)) {
            throw new tutao.crypto.CryptoError("invalid key length: " + key.length);
        }
        self.worker.aesEncrypt(key, bytes, random, self._createReturnHandler(resolve, reject));
    });
};

tutao.native.CryptoBrowser.prototype.aesDecrypt = function (key, cipherText, decryptedSize) {
    var self = this;
    return new Promise(function (resolve, reject) {
        var byteKeyLength = self.aesKeyLength / 8;
        if (key.length !== byteKeyLength) {
            throw new tutao.crypto.CryptoError("invalid key length: " + key.length);
        }
        if (cipherText.length % byteKeyLength != 0 || cipherText.length < 2 * byteKeyLength) {
            throw new tutao.crypto.CryptoError("invalid src buffer len: " + cipherText.length);
        }
        if (decryptedSize < (cipherText.length - 2 * byteKeyLength)) {
            throw new tutao.crypto.CryptoError("invalid dst buffer len: " + decryptedSize + ", src buffer len: " + cipherText.length);
        }
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

tutao.native.CryptoBrowser.prototype._random = function (byteLength) {
    // TODO retrieve bytes directly
    return tutao.util.EncodingConverter.hexToBytes(tutao.locator.randomizer.generateRandomData(byteLength));
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
