import o from "@tutao/otest"
import { areStringPartsOneByteLength } from "../../../../../src/common/api/worker/pdf/PdfDocument.js"

o.spec("PdfDocument", function () {
	o("Chars with over one byteLength are detected in StringParts", async function () {
		o(areStringPartsOneByteLength("Hello World".split(""))).equals(true)
		o(areStringPartsOneByteLength("ÄäÖöÜü".split(""))).equals(true)
		o(areStringPartsOneByteLength(`"'That's Wrong!'";.,`.split(""))).equals(true)
		o(areStringPartsOneByteLength("Wybieram się w podróż do Stambułu".split(""))).equals(false)
		o(areStringPartsOneByteLength("我要去伊斯坦布尔旅行".split(""))).equals(false)
		o(areStringPartsOneByteLength("𱁬".split(""))).equals(false)
	})
})
