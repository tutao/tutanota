"use strict";

describe("BaseTest", function () {

    var assert = chai.assert;

    it(" ", function () {
        tutao.provide("tutao.hello.yuhu");
        assert.deepEqual({}, tutao.hello.yuhu);
    });

});