"use strict";

describe("StringUtilsTest", function () {

    var assert = chai.assert;

    it("StartsWith ", function () {
        assert.isTrue(tutao.util.StringUtils.startsWith("", ""));
        assert.isTrue(tutao.util.StringUtils.startsWith("x", ""));
        assert.isTrue(tutao.util.StringUtils.startsWith("x", "x"));
        assert.isTrue(tutao.util.StringUtils.startsWith("xa", "x"));
        assert.isTrue(tutao.util.StringUtils.startsWith("xa", "xa"));
        assert.isFalse(tutao.util.StringUtils.startsWith("xa", "xb"));
        assert.isFalse(tutao.util.StringUtils.startsWith("xa", "xab"));
    });

});