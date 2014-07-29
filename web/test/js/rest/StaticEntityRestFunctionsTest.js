"use strict";

describe("StaticEntityRestFunctionsTest", function () {

    var assert = chai.assert;

    it("IdComparison ", function () {
        var EntityRestInterface = tutao.rest.EntityRestInterface;
        assert.isTrue(EntityRestInterface.firstBiggerThanSecond("200", "100"));
        assert.isFalse(EntityRestInterface.firstBiggerThanSecond("100", "200"));
        assert.isFalse(EntityRestInterface.firstBiggerThanSecond("100", "100"));
        assert.isTrue(EntityRestInterface.firstBiggerThanSecond("1", "0"));
        assert.isTrue(EntityRestInterface.firstBiggerThanSecond("1000", "200"));
        assert.isFalse(EntityRestInterface.firstBiggerThanSecond("666666666666666666666666666666", "777777777777777777777777777777"));
        assert.isTrue(EntityRestInterface.firstBiggerThanSecond("1666666666666666666666666666666", "777777777777777777777777777777"));
        assert.isTrue(EntityRestInterface.firstBiggerThanSecond("------200000", "------100000"));
    });

});