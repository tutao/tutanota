"use strict";

goog.provide('CodeGeneratorTest');

TestCase("CodeGeneratorTest", {
	
	"test defaults for encrypted values": function(queue) {
		var e = new tutao.entity.valueencrypted.Et({bool: "", bytes: "", date: "", number: "", string: ""});
		assertEquals(false, e.getBool());
		assertEquals("", e.getBytes());
		assertEquals(new Date(0), e.getDate());
		assertEquals("0", e.getNumber());
		assertEquals("", e.getString());
	}
	
});
