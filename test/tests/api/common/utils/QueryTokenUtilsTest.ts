import o from "@tutao/otest"
import { highlightTextInQuery, splitQuery } from "../../../../../src/common/api/common/utils/QueryTokenUtils"

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
	o.spec("highlightTextInQuery", () => {
		o.test("does not match non-prefix", () => {
			o.check(highlightTextInQuery("mymark", splitQuery("mark"))).deepEquals([
				{
					text: "mymark",
					highlighted: false,
				},
			])
			o.check(highlightTextInQuery("markmark", splitQuery("mark"))).deepEquals([
				{ text: "mark", highlighted: true },
				{ text: "mark", highlighted: false },
			])
			o.check(highlightTextInQuery("Tutanota is now Tuta", splitQuery("tuta nota"))).deepEquals([
				{ text: "Tuta", highlighted: true },
				{ text: "nota is now ", highlighted: false },
				{ text: "Tuta", highlighted: true },
			])
		})
		o.test("exact match", () => {
			o.check(highlightTextInQuery("my very eager mother just sold us nine pizzas", splitQuery('"my very eager"'))).deepEquals([
				{ text: "my very eager", highlighted: true },
				{ text: " mother just sold us nine pizzas", highlighted: false },
			])
			o.check(highlightTextInQuery("Tutanota is now Tuta", splitQuery('"tuta"'))).deepEquals([
				{ text: "Tutanota is now ", highlighted: false },
				{ text: "Tuta", highlighted: true },
			])
		})
		o.test("partial match", () => {
			o.check(highlightTextInQuery("my very eager mother just sold us nine pizzas", splitQuery("my very eage moth nin"))).deepEquals([
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
			o.check(highlightTextInQuery("Tutanota is now Tuta", splitQuery("tuta"))).deepEquals([
				{ text: "Tuta", highlighted: true },
				{ text: "nota is now ", highlighted: false },
				{ text: "Tuta", highlighted: true },
			])
		})
		o.test("mix exact and partial match", () => {
			o.check(highlightTextInQuery("my very eager mother just sold us nine pizzas", splitQuery('"my very eager" pizza'))).deepEquals([
				{ text: "my very eager", highlighted: true },
				{ text: " mother just sold us nine ", highlighted: false },
				{ text: "pizza", highlighted: true },
				{ text: "s", highlighted: false },
			])
		})
	})
})
