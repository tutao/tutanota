"use strict";

// the jquery csv is currently on the lib path
describe.skip("CsvConverterTest", function () {

    var assert = chai.assert;

    var csvToArray = function (csvString) {
        return tutao.tutanota.util.CsvConverter.csvToArray(csvString);
    };

    var arrayToCsv = function (array) {
        return tutao.tutanota.util.CsvConverter.arrayToCsv(array);
    };

    it(" oneValidLine", function () {
        assert.deepEqual([
            ["a", "123", "b\r\n"]
        ], csvToArray("a,123,\"b\r\n\""));
    });

    it(" twoValidLines", function () {
        assert.deepEqual([
            ["a", "123", "b\r\n"],
            ["1", "2", "3"]
        ], csvToArray("a,123,\"b\r\n\"\n\r1,2,3"));
    });

    it(" roundtrip", function () {
        assert.equal("\"a\",\"123\",\"b\r\n\"\r\n\"1\",\"2\",\"3\"", arrayToCsv(csvToArray("a,123,\"b\r\n\"\n\r1,2,3")));
    });


});