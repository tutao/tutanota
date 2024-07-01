import o from "@tutao/otest"
import { Deflater } from "../../../../../src/common/api/worker/pdf/Deflater.js"
import pako from "pako"

o.spec("Deflater", function () {
	o("correctly deflate", async function () {
		const input = new Uint8Array([1, 7, 35, 232])
		const expected = pako.deflate(input)
		const actual = await new Deflater().deflate(input)
		o(actual).deepEquals(expected)
	})
})
