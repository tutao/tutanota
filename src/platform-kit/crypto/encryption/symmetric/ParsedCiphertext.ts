import {
	FIXED_INITIALIZATION_VECTOR,
	INITIALIZATION_VECTOR_LENGTH_BYTES,
	InitializationVector,
	MacTag,
	SymmetricCipherVersion,
	validateInitializationVectorLength,
} from "@tutao/crypto"
import { assertNotNull, isKeyVersion, KeyVersion, Nullable } from "@tutao/utils"
import { CryptoError } from "@tutao/crypto/error"
import { SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES } from "./SymmetricCipherUtils"

export enum InitializationVectorVariant {
	Fixed = "fixedInitializationVector",
	Random = "randomInitializationVector",
}

export type InitializationVectorSource = InitializationVector | typeof InitializationVectorVariant.Fixed

export interface ParsedCiphertextUnusedReservedUnauthenticated {
	cipherVersion: typeof SymmetricCipherVersion.UnusedReservedUnauthenticated
	initializationVector: InitializationVector
	ciphertext: Uint8Array
	initializationVectorVariant: InitializationVectorVariant
}

export interface ParsedCiphertextAesCbcThenHmac {
	cipherVersion: typeof SymmetricCipherVersion.AesCbcThenHmac
	initializationVector: InitializationVector
	ciphertext: Uint8Array
	macTag: MacTag
	initializationVectorVariant: InitializationVectorVariant
}

export interface ParsedCiphertextAeadWithGroupKey {
	cipherVersion: typeof SymmetricCipherVersion.AeadWithGroupKey
	groupKeyVersion: KeyVersion
	initializationVector: InitializationVector
	ciphertext: Uint8Array
	macTag: MacTag
}

export interface ParsedCiphertextAeadWithSessionKey {
	cipherVersion: typeof SymmetricCipherVersion.AeadWithSessionKey
	initializationVector: InitializationVector
	ciphertext: Uint8Array
	macTag: MacTag
}

export type ParsedCiphertextAesCbc = ParsedCiphertextUnusedReservedUnauthenticated | ParsedCiphertextAesCbcThenHmac
export type ParsedCiphertextAead = ParsedCiphertextAeadWithGroupKey | ParsedCiphertextAeadWithSessionKey
export type ParsedCiphertext = ParsedCiphertextAesCbc | ParsedCiphertextAead

// Ciphertexts come in many flavors, containing potentially many elements. Not all elements will be present in every
// flavor, but they are always laid out in the same order. The following diagram illustrates the general format:
//
// |---------------------------------------------------------|
// | V GKVL GKV |           IV            |     CT     | MAC |
// |            |                         |------------|     |
// |            |                         | ciphertext |     |
// |            |--------------------------------------|     |
// |            | initialization vector and ciphertext |     |
// |            |--------------------------------------------|
// |            |             tagged ciphertext              |
// |---------------------------------------------------------|
// |                  versioned ciphertext                   |
// |---------------------------------------------------------|
//
// V: cipher version
// GKVL: group key version length
// GKV: group key version
// IV: initialization vector
// CT: ciphertext
// MAC: message authentication code

export function parseVersionedCiphertext(
	versionedCiphertext: Uint8Array,
	initializationVectorVariant: InitializationVectorVariant = InitializationVectorVariant.Random,
): ParsedCiphertext {
	if (versionedCiphertext.length % 2 === 0) {
		return parseVersionedCipherTextUnusedReservedUnauthenticated(versionedCiphertext, initializationVectorVariant)
	}

	const versionByte = versionedCiphertext[0]
	if (!Object.values(SymmetricCipherVersion).includes(versionByte as SymmetricCipherVersion)) {
		throw new CryptoError("invalid cipher version")
	}
	const cipherVersion = versionByte as SymmetricCipherVersion
	let ciphertext = versionedCiphertext.subarray(SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES)

	if (cipherVersion === SymmetricCipherVersion.UnusedReservedUnauthenticated) {
		return parseVersionedCipherTextUnusedReservedUnauthenticated(ciphertext, initializationVectorVariant)
	}

	let groupKeyVersion: Nullable<KeyVersion> = null
	if (cipherVersion === SymmetricCipherVersion.AeadWithGroupKey) {
		;({ groupKeyVersion, ciphertext } = extractGroupKeyVersion(ciphertext))
	}

	let macTag: MacTag
	;({ ciphertext, macTag } = extractMacTag(ciphertext))

	if (
		initializationVectorVariant === InitializationVectorVariant.Fixed &&
		(cipherVersion === SymmetricCipherVersion.AeadWithGroupKey || cipherVersion === SymmetricCipherVersion.AeadWithSessionKey)
	) {
		throw new CryptoError("AEAD requires a random initialization vector")
	}

	let initializationVector: InitializationVector
	if (initializationVectorVariant === InitializationVectorVariant.Random) {
		;({ initializationVector, ciphertext } = extractInitializationVector(ciphertext))
	} else {
		initializationVector = FIXED_INITIALIZATION_VECTOR
	}

	switch (cipherVersion) {
		case SymmetricCipherVersion.AesCbcThenHmac:
			return {
				cipherVersion,
				initializationVector,
				ciphertext,
				macTag,
				initializationVectorVariant,
			}
		case SymmetricCipherVersion.AeadWithGroupKey:
			return {
				cipherVersion,
				groupKeyVersion: assertNotNull(groupKeyVersion),
				initializationVector,
				ciphertext,
				macTag,
			}
		case SymmetricCipherVersion.AeadWithSessionKey:
			return {
				cipherVersion,
				initializationVector,
				ciphertext,
				macTag,
			}
	}
}

function parseVersionedCipherTextUnusedReservedUnauthenticated(
	ciphertext: Uint8Array,
	initializationVectorVariant: InitializationVectorVariant,
): ParsedCiphertextUnusedReservedUnauthenticated {
	let initializationVector
	if (initializationVectorVariant === InitializationVectorVariant.Random) {
		;({ initializationVector, ciphertext } = extractInitializationVector(ciphertext))
	} else {
		initializationVector = FIXED_INITIALIZATION_VECTOR
	}
	return {
		cipherVersion: SymmetricCipherVersion.UnusedReservedUnauthenticated,
		initializationVector,
		ciphertext,
		initializationVectorVariant,
	}
}

function extractInitializationVector(ciphertext: Uint8Array): { initializationVector: InitializationVector; ciphertext: Uint8Array } {
	if (ciphertext.length < INITIALIZATION_VECTOR_LENGTH_BYTES) {
		throw new CryptoError("aes decryption failed> initialization vector must be 128 bits")
	}
	return {
		initializationVector: validateInitializationVectorLength(ciphertext.subarray(0, INITIALIZATION_VECTOR_LENGTH_BYTES)),
		ciphertext: ciphertext.subarray(INITIALIZATION_VECTOR_LENGTH_BYTES),
	}
}

function extractMacTag(ciphertext: Uint8Array): { ciphertext: Uint8Array; macTag: MacTag } {
	if (ciphertext.length < SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES) {
		throw new CryptoError("aes decryption failed> message authentication code must be 256 bits")
	}
	return {
		ciphertext: ciphertext.subarray(0, ciphertext.length - SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES),
		macTag: ciphertext.subarray(ciphertext.length - SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES) as MacTag,
	}
}

function extractGroupKeyVersion(ciphertext: Uint8Array): { groupKeyVersion: KeyVersion; ciphertext: Uint8Array } {
	if (ciphertext.length < 2) {
		throw new CryptoError("aes decryption failed> group key version (including length) must be 16 bits")
	}
	const keyVersionLengthByte = ciphertext[0]
	if (keyVersionLengthByte !== 0) {
		throw new CryptoError("aes decryption failed> currently only one byte is supported for group key versions")
	}
	const groupKeyVersion = ciphertext[1]
	if (!isKeyVersion(groupKeyVersion)) {
		throw new CryptoError("aes decryption failed> unsupported group key version number")
	}
	return {
		groupKeyVersion,
		ciphertext: ciphertext.subarray(2),
	}
}
