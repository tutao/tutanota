"use strict";

goog.provide('tutao.tutanota.util.CsvConverter');

/**
 * Converts a CSV string to a two-dimensional array.
 */
tutao.tutanota.util.CsvConverter.csvToArray = function(csvString) {
	return $.csv.toArrays(csvString);
};

/**
 * Converts a two-dimensional array to a CSV string.
 */
tutao.tutanota.util.CsvConverter.arrayToCsv = function(array) {
	var separator = ",";
	var csv = "";
	for (var i=0; i<array.length;i++) {
		for (var a=0; a<array[i].length;a++) {			
			csv += tutao.tutanota.util.CsvConverter._stringToCsvField(array[i][a]);
			if (a != array[i].length - 1) {
				csv += ",";
			}
		}
		if (i != array.length - 1) {
			csv += "\r\n";
		}
	}
	return csv;
};

tutao.tutanota.util.CsvConverter._stringToCsvField = function(string) {
	var s = string.replace(/\"/g,"\\\""); // escape quotes
	return "\"" + s + "\""; // quote the string to allow CRLF inside
};
