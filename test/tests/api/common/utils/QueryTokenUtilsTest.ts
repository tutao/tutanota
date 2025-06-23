import o from "@tutao/otest"
import { splitTextForHighlighting, splitQuery } from "../../../../../src/common/api/common/utils/QueryTokenUtils"

o.spec("QueryTokenUtils", () => {
	o.spec("splitQuery", () => {
		o.test("empty string returns nothing", () => {
			o.check(splitQuery("")).deepEquals([])
		})
		o.test("empty quotes are excluded", () => {
			o.check(splitQuery('""')).deepEquals([])
			o.check(splitQuery('"hello" "" "world"')).deepEquals([
				{ token: "hello", exact: true },
				{ token: "world", exact: true },
			])
		})
		o.test("non-exact if non-quoted", () => {
			o.check(splitQuery('unquoted "quoted" unquoted again "quoted again"')).deepEquals([
				{ token: "unquoted", exact: false },
				{ token: "quoted", exact: true },
				{ token: "unquoted", exact: false },
				{ token: "again", exact: false },
				{ token: "quoted again", exact: true },
			])
		})
	})
	o.spec("splitTextForHighlighting", () => {
		o.test("exact match", () => {
			o.check(splitTextForHighlighting("my very eager mother just sold us nine pizzas", splitQuery('"my very eager"'))).deepEquals([
				{ text: "my very eager", highlighted: true },
				{ text: " mother just sold us nine pizzas", highlighted: false },
			])
			o.check(splitTextForHighlighting("Tutanota is now Tuta", splitQuery('"tuta"'))).deepEquals([
				{ text: "Tuta", highlighted: true },
				{ text: "nota is now ", highlighted: false },
				{ text: "Tuta", highlighted: true },
			])
		})
		o.test("partial match", () => {
			o.check(splitTextForHighlighting("my very eager mother just sold us nine pizzas", splitQuery("my very eage moth nin"))).deepEquals([
				{ text: "my", highlighted: true },
				{ text: " ", highlighted: false },
				{ text: "very", highlighted: true },
				{ text: " ", highlighted: false },
				{ text: "eage", highlighted: true },
				{ text: "r ", highlighted: false },
				{ text: "moth", highlighted: true },
				{ text: "er just sold us ", highlighted: false },
				{ text: "nin", highlighted: true },
				{ text: "e pizzas", highlighted: false },
			])
			o.check(splitTextForHighlighting("Tutanota is now Tuta", splitQuery("tuta"))).deepEquals([
				{ text: "Tuta", highlighted: true },
				{ text: "nota is now ", highlighted: false },
				{ text: "Tuta", highlighted: true },
			])
		})
		o.test("mix exact and partial match", () => {
			o.check(splitTextForHighlighting("my very eager mother just sold us nine pizzas", splitQuery('"my very eager" pizza'))).deepEquals([
				{ text: "my very eager", highlighted: true },
				{ text: " mother just sold us nine ", highlighted: false },
				{ text: "pizza", highlighted: true },
				{ text: "s", highlighted: false },
			])
		})
		o.test("tokens are substrings of other tokens", () => {
			o.check(splitTextForHighlighting("is this a mail or a thesis", splitQuery("is this a mail or a thesis"))).deepEquals([
				{ text: "is", highlighted: true },
				{ text: " ", highlighted: false },
				{ text: "this", highlighted: true },
				{ text: " ", highlighted: false },
				{ text: "a", highlighted: true },
				{ text: " ", highlighted: false },
				{ text: "mail", highlighted: true },
				{ text: " ", highlighted: false },
				{ text: "or", highlighted: true },
				{ text: " ", highlighted: false },
				{ text: "a", highlighted: true },
				{ text: " ", highlighted: false },
				{ text: "thesis", highlighted: true },
			])
			o.check(splitTextForHighlighting("is this a mail or a thesis", splitQuery('"is this a mail or a thesis"'))).deepEquals([
				{ text: "is this a mail or a thesis", highlighted: true },
			])
		})
		o.test("empty query", () => {
			o.check(splitTextForHighlighting("this will just be returned back", [])).deepEquals([
				{ text: "this will just be returned back", highlighted: false },
			])
		})
	})
})
