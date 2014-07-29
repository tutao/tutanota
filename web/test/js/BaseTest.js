"use strict";

describe("BaseTest", function () {

    var assert = chai.assert;

    it(" ", function () {
        goog.provide("test.hello.yuhu");
        assert.deepEqual({}, test.hello.yuhu);
    });

});