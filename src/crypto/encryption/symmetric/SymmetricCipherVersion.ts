import { CryptoError } from "../../error.js"
import { KeyVersion } from "@tutao/utils"

/**
 * The version of the symmetric cipher.
 * Must fit into 1 byte, so 255 is the maximum allowed enum value.
 */
export const SymmetricCipherVersion = {
	UnusedReservedUnauthenticated: 0, // Un(!)authenticated encryption. DO NOT USE THIS to write a version byte! In theory, this could be the original version (AES-128-CBC without MAC), but this version does not have a version byte nor a version explicitly declared.
	AesCbcThenHmac: 1, // Authenticated encryption Aes-128/256 (depending on the key length) AES-CBC-then-HMAC
	AeadWithGroupKey: 2, // Authenticated encryption with associated data using group key derived sub-keys based on AES-CTR-then-BLAKE3, where BLAKE3 is also computed over the associated data
	AeadWithSessionKey: 3, // Authenticated encryption with associated data using session key derived sub-keys based on AES-CTR-then-BLAKE3, where BLAKE3 is also computed over the associated data
} as const

export type SymmetricCipherVersion = (typeof SymmetricCipherVersion)[keyof typeof SymmetricCipherVersion]
export type SymmetricAesCipherVersion = typeof SymmetricCipherVersion.UnusedReservedUnauthenticated | typeof SymmetricCipherVersion.AesCbcThenHmac
export type SymmetricAeadCipherVersion = typeof SymmetricCipherVersion.AeadWithGroupKey | typeof SymmetricCipherVersion.AeadWithSessionKey

export type SymmetricCipherVersionAeadWithGroupKey = {
	cipherVersion: typeof SymmetricCipherVersion.AeadWithGroupKey
	groupKeyVersion: KeyVersion
}
export type SymmetricCipherVersionAeadWithSessionKey = {
	cipherVersion: typeof SymmetricCipherVersion.AeadWithSessionKey
}

export type SymmetricAeadCipherVersionMaybeWithGroupKeyVersion = SymmetricCipherVersionAeadWithGroupKey | SymmetricCipherVersionAeadWithSessionKey

/**
 * Get the SymmetricCipherVersion from either the version byte or the full ciphertext
 */
export function getSymmetricCipherVersion(ciphertext: Uint8Array): SymmetricCipherVersion {
	// we always have an even number of bytes because the block size and the mac tag size are even
	// we prepend an additional version byte of one byte if we have a mac
	// therefore we will only have an odd number of bytes if there is a mac
	if (ciphertext.length % 2 === 1) {
		const versionByte = ciphertext[0]
		if (Object.values(SymmetricCipherVersion).includes(versionByte as SymmetricCipherVersion)) {
			return versionByte as SymmetricCipherVersion
		}
		throw new CryptoError("invalid cipher version")
	} else {
		return SymmetricCipherVersion.UnusedReservedUnauthenticated
	}
}

/**
 * Get a byte array of length 1 that holds the provided version byte.
 */
export function symmetricCipherVersionToUint8Array(version: SymmetricCipherVersion): Uint8Array {
	return Uint8Array.from([version.valueOf()])
}
