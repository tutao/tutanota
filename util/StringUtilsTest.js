"use strict";

goog.provide('StringUtilsTest');

var StringUtilsTest = TestCase("StringUtilsTest");

StringUtilsTest.prototype.testStartsWith = function() {
	assertTrue(tutao.util.StringUtils.startsWith("", ""));
	assertTrue(tutao.util.StringUtils.startsWith("x", ""));
	assertTrue(tutao.util.StringUtils.startsWith("x", "x"));
	assertTrue(tutao.util.StringUtils.startsWith("xa", "x"));
	assertTrue(tutao.util.StringUtils.startsWith("xa", "xa"));
	assertFalse(tutao.util.StringUtils.startsWith("xa", "xb"));
	assertFalse(tutao.util.StringUtils.startsWith("xa", "xab"));
};
