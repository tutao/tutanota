import o from "@tutao/otest"
import { constantTimeByteEquals, constantTimeUint8ArrayEquals, constantTimeUint8ArrayEqualsWithFancyByteLevelConstantTimeness } from "../lib/index.js"
import { assertThrows } from "@tutao/tutanota-test-utils"

o.spec("ConstantTimeTest", function () {
	o.spec("constantTimeByteEquals", function () {
		o("gives the correct result", function () {
			o(constantTimeByteEquals(0, 0)).equals(true)
			o(constantTimeByteEquals(255, 255)).equals(true)
			o(constantTimeByteEquals(0, 255)).equals(false)
			o(constantTimeByteEquals(255, 0)).equals(false)

			o(constantTimeByteEquals(1, 1)).equals(true)
			o(constantTimeByteEquals(123, 123)).equals(true)
			o(constantTimeByteEquals(1, 123)).equals(false)
			o(constantTimeByteEquals(123, 1)).equals(false)
		})

		o("ensures inputs are bytes", async function () {
			await assertThrows(Error, async () => constantTimeByteEquals(0, 256))
			await assertThrows(Error, async () => constantTimeByteEquals(0, -1))
		})
	})
	o.spec("constantTimeUint8ArrayEqualsWithFancyByteLevelConstantTimeness", function () {
		o("false for arrays of different lengths", function () {
			o(constantTimeUint8ArrayEqualsWithFancyByteLevelConstantTimeness(new Uint8Array(1), new Uint8Array(2))).equals(false)
		})

		o("false for arrays of the same length but differing content", function () {
			o(constantTimeUint8ArrayEqualsWithFancyByteLevelConstantTimeness(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]))).equals(false)
		})

		o("true for arrays of the same length and same content", function () {
			o(constantTimeUint8ArrayEqualsWithFancyByteLevelConstantTimeness(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).equals(true)
		})

		o("true for two empty arrays", function () {
			o(constantTimeUint8ArrayEqualsWithFancyByteLevelConstantTimeness(new Uint8Array(), new Uint8Array())).equals(true)
		})
	})

	o.spec("constantTimeUint8ArrayEquals", function () {
		o("false for arrays of different lengths", function () {
			o(constantTimeUint8ArrayEquals(new Uint8Array(1), new Uint8Array(2))).equals(false)
		})

		o("false for arrays of the same length but differing content", function () {
			o(constantTimeUint8ArrayEquals(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]))).equals(false)
		})

		o("true for arrays of the same length and same content", function () {
			o(constantTimeUint8ArrayEquals(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).equals(true)
		})

		o("true for two empty arrays", function () {
			o(constantTimeUint8ArrayEquals(new Uint8Array(), new Uint8Array())).equals(true)
		})
	})
})
