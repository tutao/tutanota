import o from "@tutao/otest"
import { PdfWriter } from "../../../../../src/common/api/worker/pdf/PdfWriter.js"
import { PDF_DEFAULT_OBJECTS, PdfDictValue } from "../../../../../src/common/api/worker/pdf/PdfConstants.js"
import { mapToObject } from "@tutao/tutanota-test-utils"
import { PdfObject } from "../../../../../src/common/api/worker/pdf/PdfObject.js"

o.spec("PdfWriter", function () {
	const textEncoder = new TextEncoder()

	o("Correctly parse object references to reference strings", function () {
		const writer = new PdfWriter(textEncoder, fetch)
		writer.createObject(PDF_DEFAULT_OBJECTS[0].dictionary, PDF_DEFAULT_OBJECTS[0].refId)
		writer.createObject(new Map(), "PAGES")
		writer.createObject(new Map(), "PAGE1")

		o(writer.pdfReferenceToString({ refId: "CATALOG" })).equals("1 0 R")
		o(writer.pdfReferenceToString({ refId: "PAGES" })).equals("2 0 R")
		o(writer.pdfReferenceToString({ refId: "PAGE1" })).equals("3 0 R")
		o(writer.pdfListToString([{ refId: "PAGE1" }, { refId: "CATALOG" }])).equals("[ 3 0 R 1 0 R ]")
		o(writer.pdfListToString([{ refId: "CATALOG" }, { refId: "PAGES" }])).equals("[ 1 0 R 2 0 R ]")
		o(
			writer.pdfDictionaryToString(
				new Map<string, PdfDictValue>([
					["ref", { refId: "CATALOG" }],
					["nonRef", "meow"],
				]),
			),
		).equals("<< /ref 1 0 R /nonRef meow >>")
		o(writer.pdfDictionaryToString(new Map<string, PdfDictValue>())).equals("<< >>")
	})

	o("Resolve deeply nested object references correctly", function () {
		const writer = new PdfWriter(textEncoder, fetch)
		writer.createObject(new Map(), "ListRef")
		writer.createObject(new Map(), "RefVal")
		writer.createObject(new Map(), "NestedRefVal")
		writer.createObject(new Map(), "DeviousRefVal")

		const nestedMap = new Map<string, PdfDictValue>([
			["Foo", "Bar"],
			["List", ["One", "Two", { refId: "ListRef" }]],
			["Ref", { refId: "RefVal" }],
			[
				"Map",
				new Map<string, PdfDictValue>([
					["NestedFoo", "NestedBar"],
					["NestedRef", { refId: "NestedRefVal" }],
				]),
			],
			["SuperEvilListWithANestedDictionary", [new Map<string, PdfDictValue>([["DeviousRef", { refId: "DeviousRefVal" }]])]],
		])

		o(mapToObject(writer.resolveReferences(nestedMap))).deepEquals(
			mapToObject(
				new Map<string, string>([
					["Foo", "Bar"],
					["List", "[ One Two 1 0 R ]"],
					["Ref", "2 0 R"],
					["Map", "<< /NestedFoo NestedBar /NestedRef 3 0 R >>"],
					["SuperEvilListWithANestedDictionary", "[ << /DeviousRef 4 0 R >> ]"],
				]),
			),
		)
	})

	o("Can retrieve objects with a refId", function () {
		const writer = new PdfWriter(textEncoder, fetch)
		writer.createObject(new Map(), "Pablo")
		writer.createObject(new Map(), "Valerie")

		o(writer.getObjectByRefId("Pablo")).deepEquals(new PdfObject(1, new Map()))
		o(writer.getObjectByRefId("Valerie")).deepEquals(new PdfObject(2, new Map()))
		o(() => writer.getObjectByRefId("Zach")).throws(Error)
	})

	o("Xref table is created correctly", function () {
		const writer = new PdfWriter(textEncoder, fetch)
		// Xref with only the zero object
		o(writer.makeXRefTable()).equals("xref\n0 1\n0000000000 65535 f \n")

		// Xref with unresolved byte-positions throws
		writer.createObject(new Map(), "CATALOG")
		o(() => writer.makeXRefTable()).throws(Error)

		// Xref with one object and correct byte-positions. Byte-position for an empty object must be 15
		const generatedObject = writer.getObjectByRefId("CATALOG")
		writer.calculateBytePositions(generatedObject, generatedObject.encodeToUInt8Array(textEncoder))
		o(writer.makeXRefTable()).equals(`xref\n0 2\n0000000000 65535 f \n0000000015 00000 n \n`)
	})

	o("Trailer is created correctly", function () {
		const writer = new PdfWriter(textEncoder, fetch)
		const now = Date.now().toString()

		// empty trailer throws because no refId to catalog
		o(() => writer.makeTrailer(now)).throws(Error)

		writer.createObject(new Map(), "CATALOG")
		o(writer.makeTrailer(now)).equals(`trailer\n<<\n/Size 2/Root 1 0 R/ID [(${now})(${now})]\n>>\nstartxref\n15\n%%EOF`)
	})
})
