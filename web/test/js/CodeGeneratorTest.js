"use strict";

describe("CodeGeneratorTest", function () {

    var assert = chai.assert;

    it(" defaults for encrypted values", function () {
        var e = new tutao.entity.valueencrypted.Et({bool: "", bytes: "", date: "", number: "", string: ""});
        assert.equal(false, e.getBool());
        assert.equal("", e.getBytes());
        assert.deepEqual(new Date(0), e.getDate());
        assert.equal("0", e.getNumber());
        assert.equal("", e.getString());
    });

});