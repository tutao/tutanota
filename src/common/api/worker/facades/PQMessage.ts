import { EccPublicKey } from "@tutao/tutanota-crypto"
import { byteArraysToBytes, bytesToByteArrays } from "@tutao/tutanota-utils/dist/Encoding.js"

export type PQMessage = {
	senderIdentityPubKey: EccPublicKey
	ephemeralPubKey: EccPublicKey
	encapsulation: PQBucketKeyEncapsulation
}

export type PQBucketKeyEncapsulation = {
	kyberCipherText: Uint8Array
	kekEncBucketKey: Uint8Array
}

export function decodePQMessage(encoded: Uint8Array): PQMessage {
	const pqMessageParts = bytesToByteArrays(encoded, 4)
	return {
		senderIdentityPubKey: pqMessageParts[0],
		ephemeralPubKey: pqMessageParts[1],
		encapsulation: {
			kyberCipherText: pqMessageParts[2],
			kekEncBucketKey: pqMessageParts[3],
		},
	}
}

export function encodePQMessage({ senderIdentityPubKey, ephemeralPubKey, encapsulation }: PQMessage): Uint8Array {
	return byteArraysToBytes([senderIdentityPubKey, ephemeralPubKey, encapsulation.kyberCipherText, encapsulation.kekEncBucketKey])
}
