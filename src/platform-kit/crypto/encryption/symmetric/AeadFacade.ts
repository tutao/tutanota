import { AeadSubKeys } from "./SymmetricKeyDeriver.js"
import { AesKeyLength, getAndVerifyAesKeyLength } from "./AesKeyLength.js"
import { concat } from "@tutao/utils"
import { bitArrayToUint8Array, generateInitializationVector, uint8ArrayToBitArray } from "./SymmetricCipherUtils.js"
import sjcl from "../../internal/sjcl.js"
import { blake3Mac, blake3MacVerify } from "../../hashes/Blake3.js"
import { CryptoError } from "../../error.js"
import { SymmetricCipherVersion } from "./SymmetricCipherVersion"
import { ProgrammingError } from "@tutao/app-env"
import { ParsedCiphertextAead } from "./ParsedCiphertext"

export const PADDING_BLOCK_SIZE: number = 4
export const PADDING_BYTE: number = 0x80
export const PADDING_ZERO_BYTE: number = 0x00

/**
 * This facade contains all methods for encryption/ decryption for Authenticated Encryption with Associated Data (AEAD).
 *
 * We use AES-CTR then BLAKE3, where the tag is computed over: version byte, nonce, ciphertext and associated data.
 */
export class AeadFacade {
	private pad(plaintext: Uint8Array): Uint8Array {
		const bytesToAppend = PADDING_BLOCK_SIZE - (plaintext.length % PADDING_BLOCK_SIZE)
		const paddedPlaintext = new Uint8Array(plaintext.length + bytesToAppend)
		paddedPlaintext.set(plaintext)
		paddedPlaintext.fill(PADDING_ZERO_BYTE, plaintext.length)
		paddedPlaintext[plaintext.length] = PADDING_BYTE
		return paddedPlaintext
	}

	private unpad(paddedPlaintext: Uint8Array): Uint8Array {
		let index = paddedPlaintext.length - 1
		let zeroByteCount = 0
		while (true) {
			if (index < 0) {
				throw new CryptoError("invalid padding")
			}
			const byte = paddedPlaintext[index]
			if (byte === PADDING_BYTE) {
				return paddedPlaintext.subarray(0, index)
			}
			if (byte !== PADDING_ZERO_BYTE) {
				throw new CryptoError("invalid padding")
			}
			zeroByteCount += 1
			if (zeroByteCount >= PADDING_BLOCK_SIZE) {
				throw new CryptoError("invalid padding")
			}
			index -= 1
		}
	}

	/**
	 * Encrypt with AEAD.
	 */
	encrypt(subKeys: AeadSubKeys, plaintext: Uint8Array, associatedData: Uint8Array): Uint8Array {
		const paddedPlaintext = this.pad(plaintext)
		return this.encryptInternal(subKeys, paddedPlaintext, associatedData)
	}

	/**
	 * Encrypt the plaintext with AEAD. It must already be padded.
	 * @private
	 */
	encryptInternal(subKeys: AeadSubKeys, plaintext: Uint8Array, associatedData: Uint8Array): Uint8Array {
		this.validateKeyLength(subKeys)

		const initializationVector = generateInitializationVector()
		const aesCtrCiphertext = bitArrayToUint8Array(
			sjcl.mode.ctr.encrypt(new sjcl.cipher.aes(subKeys.encryptionKey), uint8ArrayToBitArray(plaintext), uint8ArrayToBitArray(initializationVector), []),
		)

		const initializationVectorAndCiphertext = concat(initializationVector, aesCtrCiphertext)
		const initializationVectorAndCiphertextLength = this.getSigned32BitIntegerFromNumberAsUint8Array(initializationVectorAndCiphertext.length)

		const authenticationKey = bitArrayToUint8Array(subKeys.authenticationKey)
		const tag = blake3Mac(authenticationKey, concat(initializationVectorAndCiphertextLength, initializationVectorAndCiphertext, associatedData))

		return concat(this.ciphertextVersionPrefix(subKeys), initializationVectorAndCiphertext, tag)
	}

	private ciphertextVersionPrefix(subKeys: AeadSubKeys): Uint8Array {
		switch (subKeys.cipherVersion) {
			case SymmetricCipherVersion.AeadWithGroupKey: {
				const keyVersionLengthByte = 0
				if (subKeys.groupKeyVersion == null) {
					throw new ProgrammingError("AEAD encryption with group key requires a group key version")
				}
				return Uint8Array.of(subKeys.cipherVersion, keyVersionLengthByte, subKeys.groupKeyVersion)
			}
			case SymmetricCipherVersion.AeadWithSessionKey:
				return Uint8Array.of(subKeys.cipherVersion)
		}
	}

	/**
	 * Decrypt with AEAD.
	 */
	decrypt(subKeys: AeadSubKeys, parsedCiphertext: ParsedCiphertextAead, associatedData: Uint8Array): Uint8Array {
		this.validateKeyLength(subKeys)
		if (subKeys.cipherVersion !== parsedCiphertext.cipherVersion) {
			throw new CryptoError("AEAD sub-keys have the wrong cipher version for decryption")
		}

		const initializationVectorAndCiphertext = concat(parsedCiphertext.initializationVector, parsedCiphertext.ciphertext)
		const initializationVectorAndCiphertextLength = this.getSigned32BitIntegerFromNumberAsUint8Array(initializationVectorAndCiphertext.length)
		const authenticatedData = concat(initializationVectorAndCiphertextLength, initializationVectorAndCiphertext, associatedData)
		const authenticationKey = bitArrayToUint8Array(subKeys.authenticationKey)
		blake3MacVerify(authenticationKey, authenticatedData, parsedCiphertext.macTag)

		const paddedPlaintext = bitArrayToUint8Array(
			sjcl.mode.ctr.decrypt(
				new sjcl.cipher.aes(subKeys.encryptionKey),
				uint8ArrayToBitArray(parsedCiphertext.ciphertext),
				uint8ArrayToBitArray(parsedCiphertext.initializationVector),
				[],
			),
		)
		return this.unpad(paddedPlaintext)
	}

	private validateKeyLength(key: AeadSubKeys) {
		getAndVerifyAesKeyLength(key.encryptionKey, [AesKeyLength.Aes256])
		getAndVerifyAesKeyLength(key.authenticationKey, [AesKeyLength.Aes256])
	}

	private getSigned32BitIntegerFromNumberAsUint8Array(integer: number): Uint8Array {
		return bitArrayToUint8Array([integer])
	}
}

export const AEAD_FACADE = new AeadFacade()
