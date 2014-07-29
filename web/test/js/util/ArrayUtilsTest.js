"use strict";

describe("ArrayUtilsTest", function () {

    var assert = chai.assert;


    it("GetUniqueAndArray ", function () {
        assert.deepEqual(["a", "b"], tutao.util.ArrayUtils.getUniqueAndArray([
            ["a", "c", "b", ""],
            ["cd", "a", "b", "cd"]
        ]).sort());
    });

    it("GetUniqueOrArray ", function () {
        assert.deepEqual(["a", "b", "c", "cd"], tutao.util.ArrayUtils.getUniqueOrArray([
            ["a", "c", "b", ""],
            ["cd", "a", "b", "cd"]
        ]).sort());
    });

    it("GetUniqueArray ", function () {
        assert.deepEqual(["a", "b", "c"], tutao.util.ArrayUtils.getUniqueOrArray(["a", "c", "b", "", "c", "a"]).sort());
    });

    it("Remove ", function () {
        var theArray = ["a"];
        tutao.util.ArrayUtils.remove(theArray, "a");
        assert.deepEqual([], theArray);
    });

    it("Last ", function () {
        assert.equal("b", tutao.util.ArrayUtils.last(["a", "b"]));
        assert.equal(null, tutao.util.ArrayUtils.last([]));
    });

    it("ArrayEquals ", function () {
        assert.isTrue(tutao.util.ArrayUtils.arrayEquals([], []));
        assert.isTrue(tutao.util.ArrayUtils.arrayEquals(["a"], ["a"]));
        assert.isFalse(tutao.util.ArrayUtils.arrayEquals(["a"], ["b"]));
        assert.isFalse(tutao.util.ArrayUtils.arrayEquals(["a"], []));
        assert.isFalse(tutao.util.ArrayUtils.arrayEquals([], ["a"]));
    });

    it("Contains ", function () {
        assert.isTrue(tutao.util.ArrayUtils.contains(["a", "b"], "a"));
        assert.isTrue(tutao.util.ArrayUtils.contains(["a", "b"], "b"));
        assert.isFalse(tutao.util.ArrayUtils.contains(["a", "b"], "c"));
        assert.isFalse(tutao.util.ArrayUtils.contains([], "c"));
    });

    it("AddAll ", function () {
        var array = [1, 2, 3];
        tutao.util.ArrayUtils.addAll(array, [44, 45]);
        assert.deepEqual([1, 2, 3, 44, 45], array);

        var array = [];
        tutao.util.ArrayUtils.addAll(array, []);
        assert.deepEqual([], array);

        var array = [1, 2, 3];
        tutao.util.ArrayUtils.addAll(array, []);
        assert.deepEqual([1, 2, 3], array);

        var array = [];
        tutao.util.ArrayUtils.addAll(array, [44, 45]);
        assert.deepEqual([44, 45], array);
    });

    it("PrependAll ", function () {
        var array = [1, 2, 3];
        tutao.util.ArrayUtils.prependAll(array, [44, 45]);
        assert.deepEqual([44, 45, 1, 2, 3], array);

        var array = [];
        tutao.util.ArrayUtils.prependAll(array, []);
        assert.deepEqual([], array);

        var array = [1, 2, 3];
        tutao.util.ArrayUtils.prependAll(array, []);
        assert.deepEqual([1, 2, 3], array);

        var array = [];
        tutao.util.ArrayUtils.prependAll(array, [44, 45]);
        assert.deepEqual([44, 45], array);
    });

});