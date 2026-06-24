import { CryptoError } from "@tutao/crypto/error"
import { Aes128Key, Aes256Key, AesKey, BitArray } from "./SymmetricCipherUtils.js"

export enum AesKeyLength {
	Aes128 = 128,
	Aes256 = 256,
}

const ACCEPTED_BIT_LENGTHS: AesKeyLength[] = Object.keys(AesKeyLength).map((key) => {
	// @ts-ignore
	return AesKeyLength[key]
})

export function getKeyLengthInBytes(keyLength: AesKeyLength): number {
	return keyLength / 8
}

export function makeAesKey(key: BitArray, acceptedBitLengths: AesKeyLength[] = ACCEPTED_BIT_LENGTHS): AesKey {
	// AesKey is an array of 4 byte numbers. therefore converting the length to bits means 4*8
	const keyLength: number = key.length * 4 * 8
	if (!acceptedBitLengths.includes(keyLength)) {
		throw new CryptoError(`Illegal key length: ${keyLength} (expected: ${acceptedBitLengths})`)
	}
	switch (keyLength) {
		case AesKeyLength.Aes128:
			return new Aes128Key(key)
		case AesKeyLength.Aes256:
			return new Aes256Key(key)
	}
	throw new CryptoError(`illegal key length ${keyLength}`)
}

export function assert256BitKey(key: AesKey): Aes256Key {
	const length = key.bits.length * 4 * 8
	if (key instanceof Aes256Key) {
		return key
	} else {
		throw new CryptoError(`Illegal key length: ${length} (expected: 256)`)
	}
}
