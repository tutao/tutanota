"use strict";

goog.provide('ArrayUtilsTest');

var ArrayUtilsTest = TestCase("ArrayUtilsTest");

ArrayUtilsTest.prototype.testGetUniqueAndArray = function() {
	assertEquals(["a", "b"], tutao.util.ArrayUtils.getUniqueAndArray([["a", "c", "b", ""], ["cd", "a", "b", "cd"]]).sort());
};

ArrayUtilsTest.prototype.testGetUniqueOrArray = function() {
	assertEquals(["a", "b", "c", "cd"], tutao.util.ArrayUtils.getUniqueOrArray([["a", "c", "b", ""], ["cd", "a", "b", "cd"]]).sort());
};

ArrayUtilsTest.prototype.testGetUniqueArray = function() {
	assertEquals(["a", "b", "c"], tutao.util.ArrayUtils.getUniqueOrArray(["a", "c", "b", "", "c", "a"]).sort());
};

ArrayUtilsTest.prototype.testRemove = function() {
	var theArray = ["a"];
	tutao.util.ArrayUtils.remove(theArray, "a");
	assertEquals([], theArray);
};

ArrayUtilsTest.prototype.testLast = function() {
	assertEquals("b", tutao.util.ArrayUtils.last(["a", "b"]));
	assertEquals(null, tutao.util.ArrayUtils.last([]));
};

ArrayUtilsTest.prototype.testArrayEquals = function() {
	assertTrue(tutao.util.ArrayUtils.arrayEquals([], []));
	assertTrue(tutao.util.ArrayUtils.arrayEquals(["a"], ["a"]));
	assertFalse(tutao.util.ArrayUtils.arrayEquals(["a"], ["b"]));
	assertFalse(tutao.util.ArrayUtils.arrayEquals(["a"], []));
	assertFalse(tutao.util.ArrayUtils.arrayEquals([], ["a"]));
};

ArrayUtilsTest.prototype.testContains = function() {
	assertTrue(tutao.util.ArrayUtils.contains(["a", "b"], "a"));
	assertTrue(tutao.util.ArrayUtils.contains(["a", "b"], "b"));
	assertFalse(tutao.util.ArrayUtils.contains(["a", "b"], "c"));
	assertFalse(tutao.util.ArrayUtils.contains([], "c"));
};
