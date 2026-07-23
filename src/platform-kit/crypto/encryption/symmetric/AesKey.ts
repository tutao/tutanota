import { CryptoError } from "@tutao/crypto/error"

export type BitArray = number[]

export enum AesKeyLength {
	Aes128 = 128,
	Aes256 = 256,
}

export abstract class AesKeyOrSubKeys {}

export abstract class AesKey extends AesKeyOrSubKeys {
	abstract readonly bits: BitArray
	abstract readonly keyLength: AesKeyLength
}

export class Aes256Key extends AesKey {
	readonly keyLength: typeof AesKeyLength.Aes256 = AesKeyLength.Aes256

	constructor(public readonly bits: BitArray) {
		// AesKey is an array of 4 byte numbers. therefore converting the length to bits means 4*8
		const keyLength: number = bits.length * 4 * 8
		if (keyLength !== AesKeyLength.Aes256) {
			throw new CryptoError(`invalid key length ${keyLength}`)
		}
		super()
	}
}

export class Aes128Key extends AesKey {
	readonly keyLength: typeof AesKeyLength.Aes128 = AesKeyLength.Aes128

	constructor(public readonly bits: BitArray) {
		// AesKey is an array of 4 byte numbers. therefore converting the length to bits means 4*8
		const keyLength: number = bits.length * 4 * 8
		if (keyLength !== AesKeyLength.Aes128) {
			throw new CryptoError(`invalid key length ${keyLength}`)
		}
		super()
	}
}

export function getKeyLengthInBytes(keyLength: AesKeyLength): number {
	return keyLength / 8
}

export function assert256BitKey(key: AesKey): Aes256Key {
	if (key instanceof Aes256Key) {
		return key
	} else {
		const length = key.bits.length * 4 * 8
		throw new CryptoError(`Illegal key length: ${length} (expected: 256)`)
	}
}
