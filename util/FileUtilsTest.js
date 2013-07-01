"use strict";

goog.provide('FileUtilsTest');

TestCase("FileUtilsTest", {
	
	"test getFileNameExtension": function() {
		assertEquals("", tutao.tutanota.util.FileUtils.getFileNameExtension("test"));
		assertEquals("", tutao.tutanota.util.FileUtils.getFileNameExtension("test."));
		assertEquals("a", tutao.tutanota.util.FileUtils.getFileNameExtension("test.a"));
		assertEquals("a", tutao.tutanota.util.FileUtils.getFileNameExtension(".a"));
		assertEquals("b", tutao.tutanota.util.FileUtils.getFileNameExtension("test.a.b"));
	}
});