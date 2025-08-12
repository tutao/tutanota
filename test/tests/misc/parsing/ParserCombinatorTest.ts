import o from "@tutao/otest"
import { makeEscapedStringParser, ParserError, StringIterator } from "../../../../src/common/misc/parsing/ParserCombinator"

o.spec("ParserCombinator", function () {
	o.spec("makeEscapedStringParser", function () {
		o.test("when there's a fully quoted that ends in the middle string it is parsed correctly", function () {
			const input = `"hello" rest`
			o.check(makeEscapedStringParser()(new StringIterator(input))).equals("hello")
		})

		o.test("when input ends without quote it throws", function () {
			const input = `"hello`
			o.check(() => makeEscapedStringParser()(new StringIterator(input))).throws(ParserError)
		})

		o.test("when input doesn't start with a quote it throws", function () {
			const input = `hello"`
			o.check(() => makeEscapedStringParser()(new StringIterator(input))).throws(ParserError)
		})

		o.test("when there's an escaped quote it is unescaped", function () {
			const input = `"hello \\"world"`
			o.check(makeEscapedStringParser()(new StringIterator(input))).equals(`hello "world`)
		})

		o.test("when input ends with escape it throws", function () {
			const input = `"hello\\`
			o.check(() => makeEscapedStringParser()(new StringIterator(input))).throws(ParserError)
		})
	})
})
