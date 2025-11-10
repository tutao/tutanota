import { CryptoError } from "../../misc/CryptoError.js"

import { AesKey } from "./SymmetricCipherUtils.js"

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

export function getAndVerifyAesKeyLength(key: AesKey, acceptedBitLengths: AesKeyLength[] = ACCEPTED_BIT_LENGTHS): AesKeyLength {
	// AesKey is an array of 4 byte numbers. therefore converting the length to bits means 4*8
	const keyLength: number = key.length * 4 * 8
	if (acceptedBitLengths.includes(keyLength)) {
		return keyLength
	} else {
		throw new CryptoError(`Illegal key length: ${keyLength} (expected: ${acceptedBitLengths})`)
	}
}
