import { EccPublicKey } from "@tutao/tutanota-crypto"

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
	const senderIdentityPubKey = readAttribute(encoded, 0)
	const ephemeralPubKey = readAttribute(encoded, senderIdentityPubKey.index)
	const kyberCipherText = readAttribute(encoded, ephemeralPubKey.index)
	const bucketKeyCipherText = readAttribute(encoded, kyberCipherText.index)

	return {
		senderIdentityPubKey: senderIdentityPubKey.attribute,
		ephemeralPubKey: ephemeralPubKey.attribute,
		encapsulation: {
			kyberCipherText: kyberCipherText.attribute,
			kekEncBucketKey: bucketKeyCipherText.attribute,
		},
	}
}

export function encodePQMessage({ senderIdentityPubKey, ephemeralPubKey, encapsulation }: PQMessage): Uint8Array {
	const result = new Uint8Array(
		4 + senderIdentityPubKey.length + 4 + ephemeralPubKey.length + 4 + encapsulation.kyberCipherText.length + 4 + encapsulation.kekEncBucketKey.length,
	)
	let index = writeAttribute(result, senderIdentityPubKey, 0)
	index = writeAttribute(result, ephemeralPubKey, index)
	index = writeAttribute(result, encapsulation.kyberCipherText, index)
	writeAttribute(result, encapsulation.kekEncBucketKey, index)

	return result
}

function writeAttribute(result: Uint8Array, attribute: Uint8Array, index: number): number {
	writeInt(result, attribute.length, index)
	index += 4
	result.set(attribute, index)
	index += attribute.length
	return index
}

function readAttribute(encoded: Uint8Array, index: number): { index: number; attribute: Uint8Array } {
	const length = readInt(encoded, index)
	index += 4
	const attribute = encoded.slice(index, length + index)
	index += length
	return { index, attribute }
}

function writeInt(array: Uint8Array, value: number, index: number) {
	array[index] = (value & 0xff000000) >> 24
	array[index + 1] = (value & 0x00ff0000) >> 16
	array[index + 2] = (value & 0x0000ff00) >> 8
	array[index + 3] = (value & 0x000000ff) >> 0
}

function readInt(array: Uint8Array, index: number): number {
	const bytes = array.subarray(index, index + 4)
	let n = 0
	for (const byte of bytes.values()) {
		n = (n << 8) | byte
	}
	return n
}
