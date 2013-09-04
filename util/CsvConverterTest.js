"use strict";

goog.provide('CsvConverterTest');

TestCase("CsvConverterTest", {
	
	csvToArray: function(csvString) {
		return tutao.tutanota.util.CsvConverter.csvToArray(csvString);
	},
	
	arrayToCsv: function(array) {
		return tutao.tutanota.util.CsvConverter.arrayToCsv(array);
	},
	
	"test oneValidLine": function() {
		assertEquals([["a", "123", "b\r\n"]], this.csvToArray("a,123,\"b\r\n\""));
	},

	"test twoValidLines": function() {
		assertEquals([["a", "123", "b\r\n"], ["1", "2", "3"]], this.csvToArray("a,123,\"b\r\n\"\n\r1,2,3"));
	},
	
	"test roundtrip": function() {
		assertEquals("\"a\",\"123\",\"b\r\n\"\r\n\"1\",\"2\",\"3\"", this.arrayToCsv(this.csvToArray("a,123,\"b\r\n\"\n\r1,2,3")));
	}
});