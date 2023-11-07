import o from "@tutao/otest"
import { decodePQMessage, encodePQMessage, PQMessage, PQMESSAGE_VERSION } from "../../../../../src/api/worker/facades/PQMessage.js"
import { concat, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { assertThrows } from "@tutao/tutanota-test-utils"

o.spec("PQMessage test", function () {
	o.spec("encodeDecodeRoundtrip", function () {
		o("should lead to same result", async function () {
			const pqMessage: PQMessage = {
				version: PQMESSAGE_VERSION,
				senderIdentityPubKey: stringToUtf8Uint8Array("id"),
				ephemeralPubKey: stringToUtf8Uint8Array("eph"),
				encapsulation: {
					kyberCipherText: stringToUtf8Uint8Array("kyberCipherText"),
					kekEncBucketKey: stringToUtf8Uint8Array("bucketKeyCipherText"),
				},
			}

			var encodedPqMessage = encodePQMessage(pqMessage)

			o(
				concat(
					new Uint8Array([PQMESSAGE_VERSION]),
					new Uint8Array([0, stringToUtf8Uint8Array("id").length]),
					stringToUtf8Uint8Array("id"),
					new Uint8Array([0, stringToUtf8Uint8Array("eph").length]),
					stringToUtf8Uint8Array("eph"),
					new Uint8Array([0, stringToUtf8Uint8Array("kyberCipherText").length]),
					stringToUtf8Uint8Array("kyberCipherText"),
					new Uint8Array([0, stringToUtf8Uint8Array("bucketKeyCipherText").length]),
					stringToUtf8Uint8Array("bucketKeyCipherText"),
				),
			).deepEquals(encodedPqMessage)

			o(pqMessage).deepEquals(decodePQMessage(encodedPqMessage))
		})
		o("decode errors due to bad input", async function () {
			await assertThrows(Error, async () => decodePQMessage(new Uint8Array([])))
			await assertThrows(Error, async () => decodePQMessage(new Uint8Array([123])))
		})
		o("encode errors due to bad input", async function () {
			const pqMessage: PQMessage = {
				version: 256,
				senderIdentityPubKey: stringToUtf8Uint8Array("id"),
				ephemeralPubKey: stringToUtf8Uint8Array("eph"),
				encapsulation: {
					kyberCipherText: stringToUtf8Uint8Array("kyberCipherText"),
					kekEncBucketKey: stringToUtf8Uint8Array("bucketKeyCipherText"),
				},
			}
			await assertThrows(Error, async () => encodePQMessage(pqMessage))
		})
	})
})
