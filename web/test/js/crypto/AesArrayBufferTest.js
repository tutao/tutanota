"use strict";

describe("AesArrayBufferTest", function () {

    var assert = chai.assert;

    this.timeout(5000);

    var _getFacade = function () {
        return tutao.locator.aesCrypter;
    };

    var _arrayBufferRoundtrip = function (key, arrayBuffer, callback) {
        var facade = _getFacade();
        facade.encryptArrayBuffer(key, arrayBuffer, function (encrypted, exception) {
            assert.isUndefined(exception);
            facade.decryptArrayBuffer(key, encrypted, arrayBuffer.byteLength, function (decrypted, exception) {
                assert.isUndefined(exception);
                assert.equal(arrayBuffer.byteLength, decrypted.byteLength);
                var view = new Uint8Array(arrayBuffer);
                var view2 = new Uint8Array(decrypted);
                for (var i = 0; i < arrayBuffer.byteLength; i++) {
                    assert.equal(view[i], view2[i]);
                }
                callback();
            });
        });
    };

    var _encryptArrayBuffer = function (key, iv, arrayBuffer, callback) {
        var facade = new tutao.crypto.SjclAes();

        // encrypt array buffer
        facade._encryptArrayBuffer(key, arrayBuffer, iv, function (encrypted, exception) {
            assert.isUndefined(exception);
            var encryptedConvertedBits = _arrayBufferToBitArray(encrypted);
            // encrypt as bitArray
            var words = _arrayBufferToBitArray(arrayBuffer);
            var encryptedBits = sjcl.bitArray.concat(iv, sjcl.mode.cbc.encrypt(new sjcl.cipher.aes(key), words, iv, [], true));

            // check equality of enrypted array buffer and bitArray
            assert.deepEqual(encryptedBits, encryptedConvertedBits);
            callback();
        });
    };

    var _bitArrayToArrayBuffer = function (arr) {
        var bl = sjcl.bitArray.bitLength(arr) / 8;
        var arrayBuffer = new ArrayBuffer(bl);
        var out = new Uint8Array(arrayBuffer);
        var tmp;
        for (var i = 0; i < bl; i++) {
            if ((i & 3) === 0) {
                tmp = arr[i / 4];
            }
            out[i] = (tmp >>> 24);
            tmp <<= 8;
        }
        return arrayBuffer;
    };

    var _arrayBufferToBitArray = function (arrayBuffer) {
        var bytes = new Uint8Array(arrayBuffer);
        var out = [];
        var i;
        var tmp = 0;
        for (i = 0; i < bytes.length; i++) {
            tmp = tmp << 8 | bytes[i];
            if ((i & 3) === 3) {
                out.push(tmp);
                tmp = 0;
            }
        }
        if (i & 3) {
            out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
        }
        return out;
    };

    var _createArrayBuffer = function (len) {
        var arrayBuffer = new ArrayBuffer(len);
        var view = new Uint8Array(arrayBuffer);
        for (var i = 0; i < len; i++) {
            view[i] = tutao.util.EncodingConverter.hexToBytes(tutao.locator.randomizer.generateRandomData(1));
        }
        return arrayBuffer;
    };

    var _getEncryptedArrayBuffer = function (key, bufferLen, callback) {
        var facade = tutao.locator.aesCrypter;
        var arrayBuffer = _createArrayBuffer(bufferLen);
        facade.encryptArrayBuffer(key, arrayBuffer, function (encrypted, exception) {
            assert.isUndefined(exception);
            callback(encrypted);
        });
    };

    var _base64Roundtrip = function (facade, key, arrayBuffer) {
        var unencryptedBits = _arrayBufferToBitArray(arrayBuffer);
        var unencryptedBytes = sjcl.codec.bytes.fromBits(unencryptedBits);
        var unencryptedBase64 = sjcl.codec.base64.fromBits(unencryptedBits);
        return new Promise(function (resolve, reject) {
            facade.encryptArrayBuffer(key, arrayBuffer, function (encrypted, exception) {
                var encryptedBase64 = sjcl.codec.base64.fromBits(_arrayBufferToBitArray(encrypted));
                facade.decryptBase64(key, encryptedBase64, arrayBuffer.byteLength, function (decryptedBase64, exception) {
                    assert.isUndefined(exception);
                    assert.equal(unencryptedBase64, decryptedBase64);
                    resolve();
                });
            });
        });
    };


    it("ArrayBufferRoundtrip ", function (done) {
        var facade = _getFacade();
        var key = facade.generateRandomKey();
        _arrayBufferRoundtrip(key, _createArrayBuffer(0), function () {
            _arrayBufferRoundtrip(key, _createArrayBuffer(1), function () {
                _arrayBufferRoundtrip(key, _createArrayBuffer(15), function () {
                    _arrayBufferRoundtrip(key, _createArrayBuffer(16), function () {
                        _arrayBufferRoundtrip(key, _createArrayBuffer(17), function () {
                            _arrayBufferRoundtrip(key, _createArrayBuffer(12345), done);
                        });
                    });
                });
            });
        });
    });

    it("ArrayBufferImplementationCompatibility ", function (done) {
        var facade = _getFacade();
        var key = facade.generateRandomKey();
        var iv = sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(16));
        _encryptArrayBuffer(key, iv, _createArrayBuffer(0), function () {
            _encryptArrayBuffer(key, iv, _createArrayBuffer(1), function () {
                _encryptArrayBuffer(key, iv, _createArrayBuffer(15), function () {
                    _encryptArrayBuffer(key, iv, _createArrayBuffer(16), function () {
                        _encryptArrayBuffer(key, iv, _createArrayBuffer(17), function () {
                            _encryptArrayBuffer(key, iv, _createArrayBuffer(12345), done);
                        });
                    });
                });
            });
        });
    });

    it("EncryptInvalidIvLength ", function (done) {
        var facade = new tutao.crypto.SjclAes();
        var key = facade.generateRandomKey();
        var iv = sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(15));
        var arrayBuffer = _createArrayBuffer(10);
        facade._encryptArrayBuffer(key, arrayBuffer, iv, function (encrypted, exception) {
            assert.isNull(encrypted);
            assert.isNotNull(exception);
            assert.instanceOf(exception, tutao.crypto.CryptoError);
            done();
        });
    });

    it("EncryptInvalidKey ", function (done) {
        var facade = tutao.locator.aesCrypter;
        var key = facade.generateRandomKey().slice(0, 3);
        var arrayBuffer = _createArrayBuffer(10);
        facade.encryptArrayBuffer(key, arrayBuffer, function (encrypted, exception) {
            assert.isNull(encrypted);
            assert.isNotNull(exception);
            assert.instanceOf(exception, tutao.crypto.CryptoError);
            done();
        });
    });

    it("DecryptInvalidKey ", function (done) {
        var facade = tutao.locator.aesCrypter;
        var key = facade.generateRandomKey().slice(0, 3);
        var arrayBuffer = _createArrayBuffer(10);
        facade.decryptArrayBuffer(key, arrayBuffer, 10, function (encrypted, exception) {
            assert.isNull(encrypted);
            assert.isNotNull(exception);
            assert.instanceOf(exception, tutao.crypto.CryptoError);
            done();
        });
    });

    it("DecryptInvalidSrcBufferLen ", function (done) {
        var facade = tutao.locator.aesCrypter;
        var key = facade.generateRandomKey();
        var encrypted = _createArrayBuffer(33); // 33 is no valid encrypted size
        facade.decryptArrayBuffer(key, encrypted, 2, function (decrypted, exception) {
            assert.isNull(decrypted);
            assert.isNotNull(exception);
            assert.instanceOf(exception, tutao.crypto.CryptoError);
            done();
        });
    });

    it("DecryptInvalidDstBufferLen ", function (done) {
        var facade = tutao.locator.aesCrypter;
        var key = facade.generateRandomKey();
        var encrypted = _createArrayBuffer(48); // encrypted 48 bytes it too big for 4 plain text bytes
        facade.decryptArrayBuffer(key, encrypted, 4, function (decrypted, exception) {
            assert.isNull(decrypted);
            assert.isNotNull(exception);
            assert.instanceOf(exception, tutao.crypto.CryptoError);
            done();
        });
    });

    it("DecryptInvalidEncrypted ", function (done) {
        var facade = new tutao.crypto.SjclAes();
        var key = facade.generateRandomKey();
        _getEncryptedArrayBuffer(key, 10, function (encrypted) {
            var view = new Uint8Array(encrypted);
            // change the last byte
            view[encrypted.byteLength - 1] = view[encrypted.byteLength - 1] + 1;
            facade.decryptArrayBuffer(key, encrypted, 10, function (decrypted, exception) {
                assert.isNull(decrypted);
                assert.isNotNull(exception);
                assert.instanceOf(exception, tutao.crypto.CryptoError);
                done();
            });
        });
    });

    it("DecryptInvalidDecryptedSize ", function (done) {
        var facade = new tutao.crypto.SjclAes();
        var key = facade.generateRandomKey();
        _getEncryptedArrayBuffer(key, 10, function (encrypted) {
            // use 11 instead of 10
            facade.decryptArrayBuffer(key, encrypted, 11, function (decrypted, exception) {
                assert.isNull(decrypted);
                assert.isNotNull(exception);
                assert.instanceOf(exception, tutao.crypto.CryptoError);
                done();
            });
        });
    });

    it("ByteTo32BitRoundtrip ", function () {
        var facade = _getFacade();
        assert.deepEqual([0], sjcl.codec.bytes.toBits([0, 0, 0, 0]));
        assert.deepEqual([255], sjcl.codec.bytes.toBits([0, 0, 0, 255]));
        assert.deepEqual([256], sjcl.codec.bytes.toBits([0, 0, 1, 0]));
        assert.deepEqual([256 * 256], sjcl.codec.bytes.toBits([0, 1, 0, 0]));
        assert.deepEqual([256 * 256 * 256], sjcl.codec.bytes.toBits([1, 0, 0, 0]));
        assert.deepEqual([(256 * 256 * 256 * 128) - 1], sjcl.codec.bytes.toBits([127, 255, 255, 255]));
        assert.deepEqual([-(256 * 256 * 256 * 128)], sjcl.codec.bytes.toBits([128, 0, 0, 0]));
        assert.deepEqual([-1], sjcl.codec.bytes.toBits([255, 255, 255, 255]));

        assert.deepEqual([0, 0, 0, 0], sjcl.codec.bytes.fromBits([0]));
        assert.deepEqual([0, 0, 0, 255], sjcl.codec.bytes.fromBits([255]));
        assert.deepEqual([0, 0, 1, 0], sjcl.codec.bytes.fromBits([256]));
        assert.deepEqual([0, 1, 0, 0], sjcl.codec.bytes.fromBits([256 * 256]));
        assert.deepEqual([1, 0, 0, 0], sjcl.codec.bytes.fromBits([256 * 256 * 256]));
        assert.deepEqual([127, 255, 255, 255], sjcl.codec.bytes.fromBits([(256 * 256 * 256 * 128) - 1]));
        assert.deepEqual([128, 0, 0, 0], sjcl.codec.bytes.fromBits([-(256 * 256 * 256 * 128)]));
        assert.deepEqual([255, 255, 255, 255], sjcl.codec.bytes.fromBits([-1]));

    });

    it("DecryptBase64InvalidBase64 ", function (done) {
        var facade = new tutao.crypto.SjclAes();
        var key = facade.generateRandomKey();
        facade.decryptBase64(key, "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh&=", 6, function (decryptedBase64, exception) {
            assert.isNotNull(exception);
            assert.equal("error during base64 decryption, original message: this isn't base64!", exception.message);
            assert.isNull(decryptedBase64);
            done();
        });
    });

    it("DecryptBase64InvalidKey ", function (done) {
        var facade = new tutao.crypto.SjclAes();
        facade.decryptBase64([1, 2], "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=", 6, function (decryptedBase64, exception) {
            assert.isNotNull(exception);
            assert.equal("invalid key length: 64", exception.message);
            assert.isNull(decryptedBase64);
            done();
        });
    });

    it("DecryptBase64InvalidSrcBuffer ", function (done) {
        var facade = new tutao.crypto.SjclAes();
        var key = facade.generateRandomKey();
        facade.decryptBase64(key, "AAECA", 6, function (decryptedBase64, exception) {
            assert.isNotNull(exception);
            assert.equal("invalid src buffer len: 3.75", exception.message);
            assert.isNull(decryptedBase64);
            done();
        });
    });

    it("DecryptBase64TooSmallSrcBuffer ", function (done) {
        var facade = new tutao.crypto.SjclAes();
        var key = facade.generateRandomKey();
        facade.decryptBase64(key, "AAECAwQFBgcICQoLDA0ODA==", 6, function (decryptedBase64, exception) {
            assert.isNotNull(exception);
            assert.equal("invalid src buffer len: 16", exception.message);
            assert.isNull(decryptedBase64);
            done();
        });
    });

    it("DecryptBase64InvalidPadding ", function (done) {
        var facade = new tutao.crypto.SjclAes();
        var key = facade.hexToKey("a8db9ef70c44dc8acce26e9f44ca2f37"); // use a fixed key here to avoid that the padding value might accidentally be correct
        facade.decryptBase64(key, "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=", 17, function (decryptedBase64, exception) {
            assert.isNotNull(exception);
            assert.equal("invalid padding value: 243", exception.message);
            assert.isNull(decryptedBase64);
            done();
        });
    });

    it("DecryptBase64InvalidDecryptedSize ", function (done) {
        var facade = new tutao.crypto.SjclAes();
        var key = facade.generateRandomKey();
        facade.encryptArrayBuffer(key, _createArrayBuffer(64), function (encrypted, exception) {
            var encryptedBase64 = sjcl.codec.base64.fromBits(_arrayBufferToBitArray(encrypted));
            facade.decryptBase64(key, encryptedBase64, 65, function (decryptedBase64, exception) {
                assert.isNotNull(exception);
                assert.equal("invalid decrypted size: 65, expected: 64", exception.message);
                assert.isNull(decryptedBase64);
                done();
            });
        });
    });

    it("DecryptBase64InvalidDstLen ", function (done) {
        var facade = new tutao.crypto.SjclAes();
        var key = facade.generateRandomKey();
        facade.encryptArrayBuffer(key, _createArrayBuffer(64), function (encrypted, exception) {
            var encryptedBase64 = sjcl.codec.base64.fromBits(_arrayBufferToBitArray(encrypted));
            facade.decryptBase64(key, encryptedBase64, 63, function (decryptedBase64, exception) {
                assert.isNotNull(exception);
                assert.equal("invalid dst buffer len: 63, src buffer len: 96", exception.message);
                assert.isNull(decryptedBase64);
                done();
            });
        });
    });

    it("DecryptBase64Roundtrip ", function (done) {
        var facade = new tutao.crypto.SjclAes();
        var key = facade.generateRandomKey();
        return _base64Roundtrip(facade, key, _createArrayBuffer(0)).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(1));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(15));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(16));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(17));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(31));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(32));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(32));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(33));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(33));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(33));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(63));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(64));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(12345));
        }).then(function () {
            return _base64Roundtrip(facade, key, _createArrayBuffer(120 * 1024)); // more than 100 KB to test the stTimeout
        }).then(function () {
            done();
        });

    });
});