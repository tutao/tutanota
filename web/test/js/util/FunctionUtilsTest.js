"use strict";

describe("FunctionUtilsTest", function () {

    var assert = chai.assert;


    it("BindPrototypeMethodsToThis ", function () {
        var A = function () {
            tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
        };
        A.prototype.method = function () {
            return this;
        };

        var a = new A();
        assert.equal(a, a.method.call("this is not <this>"));
    });


});