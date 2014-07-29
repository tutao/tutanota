"use strict";

describe("FileUtilsTest", function () {

    var assert = chai.assert;

    it(" getFileNameExtension", function () {
        assert.equal("", tutao.tutanota.util.FileUtils.getFileNameExtension("test"));
        assert.equal("", tutao.tutanota.util.FileUtils.getFileNameExtension("test."));
        assert.equal("a", tutao.tutanota.util.FileUtils.getFileNameExtension("test.a"));
        assert.equal("a", tutao.tutanota.util.FileUtils.getFileNameExtension(".a"));
        assert.equal("b", tutao.tutanota.util.FileUtils.getFileNameExtension("test.a.b"));
    });

});