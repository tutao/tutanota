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

});