import o from "@tutao/otest"
import { PdfObject } from "../../../../../src/common/api/worker/pdf/PdfObject.js"
import { PdfDictValue, PdfStreamEncoding } from "../../../../../src/common/api/worker/pdf/PdfConstants.js"
import { PdfStreamObject } from "../../../../../src/common/api/worker/pdf/PdfStreamObject.js"

o.spec("PdfObject", function () {
	const emptyObject = new PdfObject(3, new Map<string, PdfDictValue>())
	const someObject = new PdfObject(
		92,
		new Map<string, PdfDictValue>([
			["Key1", "Val1"],
			["Key2", "[ meow ]"],
		]),
	)
	const forbiddenObject = new PdfObject(
		2,
		new Map<string, PdfDictValue>([
			["Key1", "Val1"],
			["Key2", { refId: "UNRESOLVED" }],
		]),
	)
	const streamObject = new PdfStreamObject(
		45,
		new Map<string, PdfDictValue>([
			["Kiwi", "Valorant"],
			["Banana", "Apple"],
		]),
		new Uint8Array([34, 32, 30]),
		PdfStreamEncoding.DCT,
	)

	o("PDF object head is properly generated", function () {
		o(emptyObject.parseObjectHead()).equals("3 0 obj\n<<\n\n>>\n")
		o(someObject.parseObjectHead()).equals("92 0 obj\n<<\n/Key1 Val1/Key2 [ meow ]\n>>\n")
		o(streamObject.parseObjectHead()).equals("45 0 obj\n<<\n/Kiwi Valorant/Banana Apple/Filter /DCTDecode/Length 3\n>>\nstream\n")
		o(() => forbiddenObject.parseObjectHead()).throws(Error)
	})

	o("PDF object tail is properly generated", function () {
		o(emptyObject.parseObjectTail()).equals("endobj\n")
		o(someObject.parseObjectTail()).equals("endobj\n")
		o(streamObject.parseObjectTail()).equals("\nendstream\nendobj\n")
	})

	o("Stream objects create correct stream-related dictionary keys", function () {
		const streamO1 = new PdfStreamObject(69, new Map<string, PdfDictValue>([]), new Uint8Array([1, 2, 3, 4, 5]), PdfStreamEncoding.FLATE)
		const streamO2 = new PdfStreamObject(420, new Map<string, PdfDictValue>([]), new Uint8Array([1, 2, 3]), PdfStreamEncoding.NONE)

		o(streamO1.parseObjectHead()).equals("69 0 obj\n<<\n/Filter /FlateDecode/Length 5\n>>\nstream\n")
		o(streamO2.parseObjectHead()).equals("420 0 obj\n<<\n/Length 3\n>>\nstream\n")
	})
})
