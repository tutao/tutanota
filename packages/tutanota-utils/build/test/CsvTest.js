import o from "@tutao/otest";
import { renderCsv } from "../lib/Csv.js";
o.spec("Csv", function () {
    o("should render csv as expected", function () {
        const header = ["these", "are", "columns"];
        const rows = [
            ["a", "b", "c"],
            ["1", "2", "3"],
        ];
        o(renderCsv(header, rows)).equals("these;are;columns\n" + "a;b;c\n" + "1;2;3");
    });
    o("should escape columns which contains the separator", function () {
        o(renderCsv(["column 1", "column 2"], [["value;1", "value;2"]])).equals("column 1;column 2\n" + `"value;1";"value;2"`);
    });
    o("should escape columns which contain newlines", function () {
        o(renderCsv(["column 1", "column 2"], [
            ["value 1\nand a new line", "value 2\nand a new line"],
            ["value 3\nand a new line", "value 4\nand a new line"],
        ])).equals("column 1;column 2\n" + `"value 1\nand a new line";"value 2\nand a new line"\n` + `"value 3\nand a new line";"value 4\nand a new line"`);
    });
    o("should escape columns which contain double quotes", function () {
        o(renderCsv(["column 1", "column 2"], [['some "text"', "another text"]])).equals("column 1;column 2\n" + '"some ""text""";another text');
    });
});
