"use strict";

describe("UtilsTest", function () {

    var assert = chai.assert;
    it("i2osp ", function () {
        var a = new tutao.crypto.Utils();
        var i = parseInt("44332211", 16);
        var bytes = a.i2osp(i);
        assert.deepEqual(bytes, [68, 51, 34, 17]);
    });

    it("_mgf1 ", function () {
        var a = new tutao.crypto.Utils();
        var bytes = [1, 2, 3, 4];
        assert.equal(sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(a.mgf1(bytes, 32))), "e25f9f0a2c2664632d1be5e2f25b2794c371091b61eb762ad98861da3a2221ee");
        assert.equal(sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(a.mgf1(bytes, 63))), "e25f9f0a2c2664632d1be5e2f25b2794c371091b61eb762ad98861da3a2221ee366dcb38806a930d052d8b7bac72a4e59bbe8a78792b4d975ed944dc0f64f6");
        assert.equal(sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(a.mgf1(bytes, 64))), "e25f9f0a2c2664632d1be5e2f25b2794c371091b61eb762ad98861da3a2221ee366dcb38806a930d052d8b7bac72a4e59bbe8a78792b4d975ed944dc0f64f6e5");
        assert.equal(sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(a.mgf1(bytes, 65))), "e25f9f0a2c2664632d1be5e2f25b2794c371091b61eb762ad98861da3a2221ee366dcb38806a930d052d8b7bac72a4e59bbe8a78792b4d975ed944dc0f64f6e5c3");
    });

    it("pad ", function () {
        _testPadding([], 16);
        _testPadding([1], 15);
        _testPadding([1,2], 14);
        _testPadding([1,2,3], 13);
        _testPadding([1,2,3,4,5,6,7,8,9,0,1,2,3,4,5], 1);
        _testPadding([1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6], 16);
        _testPadding([1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7], 15);
        _testPadding([1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1], 1);
        _testPadding([1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2], 16);
        _testPadding([1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3], 15);
    });

    var _testPadding = function(array, expectedNbrOfPaddingBytes) {
        var padded = tutao.crypto.Utils.pad(new Uint8Array(array));
        assert.equal(expectedNbrOfPaddingBytes, padded.byteLength - array.length);
        for (var i=0; i<array.length; i++) {
            assert.equal(array[i], padded[i]);
        }
        for (i=0; i<expectedNbrOfPaddingBytes; i++) {
            assert.equal(expectedNbrOfPaddingBytes, padded[array.length + i]);
        }

        var unpadded = tutao.crypto.Utils.unpad(padded);
        assert.equal(array.length, unpadded.length);
        for (i=0; i<array.length; i++) {
            assert.equal(array[i], unpadded[i]);
        }
    };

    it("checkIs128BitKey", function() {
        var key128 = new tutao.crypto.SjclAes().generateRandomKey();
        var key256 = new tutao.crypto.SjclAes256Gcm().generateRandomKey();
        var badKey = sjcl.codec.arrayBuffer.toBits(tutao.locator.randomizer.generateRandomData(20).buffer);
        assert.isTrue(tutao.crypto.Utils.checkIs128BitKey(key128));
        assert.isFalse(tutao.crypto.Utils.checkIs128BitKey(key256));
        assert.throws(function() { tutao.crypto.Utils.checkIs128BitKey(badKey); }, tutao.crypto.CryptoError);
    });
});