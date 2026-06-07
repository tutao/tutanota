import { CryptoError } from "../../error.js"

/**
 * The version of the symmetric cipher.
 * Must fit into 1 byte, so 255 is the maximum allowed enum value.
 */
const enum CipherVersion {
	UnusedReservedUnauthenticated = 0, // Un(!)authenticated encryption. DO NOT USE THIS to write a version byte! In theory, this could be the original version (AES-128-CBC without MAC), but this version does not have a version byte nor a version explicitly declared.
	AesCbcThenHmac = 1, // Authenticated encryption Aes-128/256 (depending on the key length) AES-CBC-then-HMAC
	AeadWithGroupKey = 2, // Authenticated encryption with associated data using group key derived sub-keys based on AES-CTR-then-BLAKE3, where BLAKE3 is also computed over the associated data
	AeadWithSessionKey = 3, // Authenticated encryption with associated data using session key derived sub-keys based on AES-CTR-then-BLAKE3, where BLAKE3 is also computed over the associated data
}

export abstract class AbstractSymmetricCipherVersion {
	abstract getVersionByte(): CipherVersion
}

export abstract class SymmetricAesCbcCipherVersion extends AbstractSymmetricCipherVersion {}

export abstract class SymmetricAeadCipherVersionMaybeWithGroupKeyVersion extends AbstractSymmetricCipherVersion {}

export class SymmetricCipherVersionUnusedReservedUnauthenticated extends AbstractSymmetricCipherVersion {
	getVersionByte(): CipherVersion {
		throw new Error("This version does not have a version byte.")
	}
}

export class SymmetricCipherVersionAesCbcThenHmac extends AbstractSymmetricCipherVersion {
	getVersionByte(): CipherVersion {
		return CipherVersion.AesCbcThenHmac
	}
}

export class SymmetricCipherVersionAeadWithGroupKey extends SymmetricAeadCipherVersionMaybeWithGroupKeyVersion {
	getVersionByte(): CipherVersion {
		return CipherVersion.AeadWithGroupKey
	}
}

export class SymmetricCipherVersionAeadWithSessionKey extends SymmetricAeadCipherVersionMaybeWithGroupKeyVersion {
	getVersionByte(): CipherVersion {
		return CipherVersion.AeadWithSessionKey
	}
}

export const SymmetricCipherVersion = {
	UnusedReservedUnauthenticated: new SymmetricCipherVersionUnusedReservedUnauthenticated(),
	AesCbcThenHmac: new SymmetricCipherVersionAesCbcThenHmac(),
	AeadWithGroupKey: new SymmetricCipherVersionAeadWithGroupKey(),
	AeadWithSessionKey: new SymmetricCipherVersionAeadWithSessionKey(),
}

/**
 * Get the SymmetricCipherVersion from either the version byte or the full ciphertext
 */
export function getSymmetricCipherVersion(ciphertext: Uint8Array): AbstractSymmetricCipherVersion {
	// we always have an even number of bytes because the block size and the mac tag size are even
	// we prepend an additional version byte of one byte if we have a mac
	// therefore we will only have an odd number of bytes if there is a mac
	if (ciphertext.length % 2 === 1) {
		const versionByte = ciphertext[0]
		if (versionByte === CipherVersion.AesCbcThenHmac) {
			return SymmetricCipherVersion.AesCbcThenHmac
		} else if (versionByte === CipherVersion.AeadWithGroupKey) {
			return SymmetricCipherVersion.AeadWithGroupKey
		} else if (versionByte === CipherVersion.AeadWithSessionKey) {
			return SymmetricCipherVersion.AeadWithSessionKey
		}
		throw new CryptoError("invalid cipher version")
	} else {
		return SymmetricCipherVersion.UnusedReservedUnauthenticated
	}
}

/**
 * Get a byte array of length 1 that holds the provided version byte.
 */
export function symmetricCipherVersionToUint8Array(version: AbstractSymmetricCipherVersion): Uint8Array {
	return Uint8Array.from([version.getVersionByte()])
}
