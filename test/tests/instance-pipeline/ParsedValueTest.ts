import o, { assertThrows } from "@tutao/otest"
import { ParsedValue } from "../../../src/platform-kit/instance-pipeline/ParsedValue"
import { random } from "../../../src/platform-kit/crypto"
import { uint8ArrayToBase64 } from "../../../src/platform-kit/utils"

o.spec("ParsedValueTest", () => {
	o("byteArray is base64 encoded", () => {
		const bytes = random.generateRandomData(10)
		o(ParsedValue.fromByteArray(bytes)).deepEquals(ParsedValue.fromString(uint8ArrayToBase64(bytes)))
	})

	o("gettingAs byte array base64 decodes the string", async () => {
		const bytes = random.generateRandomData(10)
		o(ParsedValue.fromByteArray(bytes).asByteArray()).equals(bytes)

		const err = await assertThrows(Error, async () => ParsedValue.fromString("non-base64-encoded").asByteArray())
		o(err.message.startsWith("invalid base64 length")).equals(true)
	})

	o("string is converted to boolean", () => {
		o(ParsedValue.fromString("1").asBoolean()).equals(true)
		o(ParsedValue.fromString("0").asBoolean()).equals(false)
		o(ParsedValue.fromString("300").asBoolean()).equals(true)
		o(ParsedValue.fromString("garbage").asBoolean()).equals(true)
	})
})
