import o from "@tutao/otest"
import { parseCsv } from "../../../src/common/misc/parsing/CsvParser.js"
o.spec("Parser combinator test", function () {})
o.spec("CSV parsing test", function () {
	o("Parse good csv no quotes no empty columns no surrounding spaces", function () {
		const csv = "foo,bar,baz,quux\nshrek and fiona,donkey,farquaad"
		const actual = parseCsv(csv).rows
		const expected = [
			["foo", "bar", "baz", "quux"],
			["shrek and fiona", "donkey", "farquaad"],
		]
		o(actual).deepEquals(expected)
	})
	o("Parse good csv no quotes no empty columns", function () {
		const csv = " foo , bar ,  baz  ,  quux  \n  shrek and fiona  , donkey , farquaad "
		const actual = parseCsv(csv).rows
		const expected = [
			[" foo ", " bar ", "  baz  ", "  quux  "],
			["  shrek and fiona  ", " donkey ", " farquaad "],
		]
		o(actual).deepEquals(expected)
	})
	o("Parse good csv no quotes", function () {
		const csv = " foo,,  ,quux\n shrek and fiona  , donkey ,farquaad"
		const actual = parseCsv(csv).rows
		const expected = [
			[" foo", "", "  ", "quux"],
			[" shrek and fiona  ", " donkey ", "farquaad"],
		]
		o(actual).deepEquals(expected)
	})
	o("Parse good csv with quotes and surrounding spaces and empty columns", function () {
		const csv = ` "foo","","  ", " quux " \n" shrek and fiona"  ," donkey" ,"farquaad"`
		const actual = parseCsv(csv).rows
		const expected = [
			["foo", "", "  ", " quux "],
			[" shrek and fiona", " donkey", "farquaad"],
		]
		o(actual).deepEquals(expected)
	})
	o("Parse good csv with empty lines", function () {
		const csv = `\n\nfoo,bar,baz,quux\n\n\nshrek and fiona,donkey,farquaad\n,  ,\n phoebe,rachael,monica,chandler,joey,ross\n\n`
		const actual = parseCsv(csv).rows
		const expected = [
			[""],
			["foo", "bar", "baz", "quux"],
			["shrek and fiona", "donkey", "farquaad"],
			["", "  ", ""],
			[" phoebe", "rachael", "monica", "chandler", "joey", "ross"],
			[""],
		]
		o(actual).deepEquals(expected)
	})
	o("Parse good csv with quotes inside quotes", function () {
		const csv = `"""this is a quote"" - some guy", "this is a regular quoted column, that has a comma in it"\n"this is the second line with a single quoted column"`
		const actual = parseCsv(csv).rows
		const expected = [
			[`"this is a quote" - some guy`, "this is a regular quoted column, that has a comma in it"],
			["this is the second line with a single quoted column"],
		]
		o(actual).deepEquals(expected)
	})
})
