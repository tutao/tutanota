"use strict";

describe("BaseTest", function () {

    var assert = chai.assert;

    it(" ", function () {
        goog.provide("tutao.hello.yuhu");
        assert.deepEqual({}, tutao.hello.yuhu);
    });

});