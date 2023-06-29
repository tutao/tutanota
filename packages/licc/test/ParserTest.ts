import o from "@tutao/otest"
import { ParsedType, parseType } from "../lib/Parser.js"
import { assertThrows } from "@tutao/tutanota-test-utils"

o.spec("Parser", function () {
	o.spec("illegal identifiers are caught", function () {
		o("empty string", async function () {
			await assertThrows(Error, () => Promise.resolve(parseType("")))
		})

		o("number at start", async function () {
			await assertThrows(Error, () => Promise.resolve(parseType("0hello")))
		})

		o("special character at start", async function () {
			await assertThrows(Error, () => Promise.resolve(parseType("?some")))
		})
	})

	o.spec("simple types are parsed correctly", function () {
		o("string", async function () {
			o(parseType("string")).deepEquals({ baseName: "string", generics: [], nullable: false, external: false })
		})
		o("string?", async function () {
			o(parseType("string?")).deepEquals({ baseName: "string", generics: [], nullable: true, external: false })
		})
		o("external type", async function () {
			o(parseType("SomeExternalType")).deepEquals({ baseName: "SomeExternalType", external: true, generics: [], nullable: false })
		})
		o("nullable external", async function () {
			o(parseType("SomeExternalType?")).deepEquals({ baseName: "SomeExternalType", external: true, generics: [], nullable: true })
		})

		o("void", async function () {
			o(parseType("void ")).deepEquals({ baseName: "void", nullable: false, external: false, generics: [] })
		})
	})

	function stringToTest(typeString: string, expected: ParsedType) {
		o(`"${typeString}"`, function () {
			o(parseType(typeString)).deepEquals(expected)
		})
	}

	o.spec("list type is parsed correctly", function () {
		stringToTest("List<boolean>", {
			baseName: "List",
			generics: [{ baseName: "boolean", nullable: false, generics: [], external: false }],
			nullable: false,
			external: false,
		})
		stringToTest("List<string?>", {
			baseName: "List",
			generics: [{ baseName: "string", nullable: true, generics: [], external: false }],
			nullable: false,
			external: false,
		})
		stringToTest("List<number>?", {
			baseName: "List",
			generics: [{ baseName: "number", nullable: false, generics: [], external: false }],
			nullable: true,
			external: false,
		})
		stringToTest("List<List<External?>?>", {
			baseName: "List",
			generics: [
				{
					baseName: "List",
					nullable: true,
					generics: [{ baseName: "External", nullable: true, external: true, generics: [] }],
					external: false,
				},
			],
			nullable: false,
			external: false,
		})
		stringToTest(" List< number > ", {
			baseName: "List",
			generics: [{ baseName: "number", nullable: false, generics: [], external: false }],
			nullable: false,
			external: false,
		})
	})

	o.spec("map type is parsed correctly", function () {
		stringToTest("Map<boolean?, Foo>", {
			baseName: "Map",
			external: false,
			generics: [
				{
					baseName: "boolean",
					generics: [],
					external: false,
					nullable: true,
				},
				{
					baseName: "Foo",
					generics: [],
					external: true,
					nullable: false,
				},
			],
			nullable: false,
		})

		stringToTest("Map<number, number>?", {
			baseName: "Map",
			external: false,
			generics: [
				{ baseName: "number", nullable: false, external: false, generics: [] },
				{ baseName: "number", nullable: false, external: false, generics: [] },
			],
			nullable: true,
		})

		stringToTest("Map<string, string>", {
			baseName: "Map",
			external: false,
			generics: [
				{ baseName: "string", nullable: false, external: false, generics: [] },
				{ baseName: "string", nullable: false, external: false, generics: [] },
			],
			nullable: false,
		})

		stringToTest("Map<List<number>?, number?>", {
			baseName: "Map",
			external: false,
			generics: [
				{
					baseName: "List",
					generics: [{ baseName: "number", nullable: false, generics: [], external: false }],
					nullable: true,
					external: false,
				},
				{ baseName: "number", nullable: true, external: false, generics: [] },
			],
			nullable: false,
		})
	})
})
