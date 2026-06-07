import { CryptoError } from "../../error.js"

/**
 * The version of the symmetric cipher.
 * Must fit into 1 byte, so 255 is the maximum allowed enum value.
 */
export const enum SymmetricCipherVersion {
	UnusedReservedUnauthenticated = 0, // Un(!)authenticated encryption. DO NOT USE THIS to write a version byte! In theory, this could be the original version (AES-128-CBC without MAC), but this version does not have a version byte nor a version explicitly declared.
	AesCbcThenHmac = 1, // Authenticated encryption Aes-128/256 (depending on the key length) AES-CBC-then-HMAC
	AeadWithGroupKey = 2, // Authenticated encryption with associated data using group key derived sub-keys based on AES-CTR-then-BLAKE3, where BLAKE3 is also computed over the associated data
	AeadWithSessionKey = 3, // Authenticated encryption with associated data using session key derived sub-keys based on AES-CTR-then-BLAKE3, where BLAKE3 is also computed over the associated data
}

/**
 * Get the SymmetricCipherVersion from either the version byte or the full ciphertext
 */
export function getSymmetricCipherVersion(ciphertext: Uint8Array): SymmetricCipherVersion {
	// we always have an even number of bytes because the block size and the mac tag size are even
	// we prepend an additional version byte of one byte if we have a mac
	// therefore we will only have an odd number of bytes if there is a mac
	if (ciphertext.length % 2 === 1) {
		const versionByte = ciphertext[0]
		if (versionByte === SymmetricCipherVersion.AesCbcThenHmac) {
			return SymmetricCipherVersion.AesCbcThenHmac
		} else if (versionByte === SymmetricCipherVersion.AeadWithGroupKey) {
			return SymmetricCipherVersion.AeadWithGroupKey
		} else if (versionByte === SymmetricCipherVersion.AeadWithSessionKey) {
			return SymmetricCipherVersion.AeadWithSessionKey
		} else if (versionByte === SymmetricCipherVersion.UnusedReservedUnauthenticated) {
			return SymmetricCipherVersion.UnusedReservedUnauthenticated
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
	return Uint8Array.from([getVersionByte(version)])
}

export function getVersionByte(version: SymmetricCipherVersion): number {
	return version as number
}
