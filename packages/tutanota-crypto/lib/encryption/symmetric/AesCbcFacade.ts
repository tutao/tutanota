import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "./SymmetricCipherVersion.js"
import {
	AesKey,
	bitArrayToUint8Array,
	FIXED_IV,
	IV_BYTE_LENGTH,
	SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES,
	SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES,
	uint8ArrayToBitArray,
} from "./SymmetricCipherUtils.js"
import { CryptoError } from "../../misc/CryptoError.js"
import { assertNotNull, concat } from "@tutao/tutanota-utils"
import sjcl from "../../internal/sjcl.js"
import { hmacSha256, MacTag, verifyHmacSha256 } from "../Hmac.js"
import { SYMMETRIC_KEY_DERIVER, SymmetricKeyDeriver } from "./SymmetricKeyDeriver.js"
import { AesKeyLength, getAndVerifyAesKeyLength } from "./AesKeyLength.js"

/**
 * This facade provides the implementation for both encryption and decryption of AES in CBC mode. Supports 128 and 256-bit keys.
 * Depending on the cipher version the encryption is authenticated with HMAC-SHA-256.
 * SymmetricCipherFacade is responsible for handling parameters for encryption/decryption.
 */
export class AesCbcFacade {
	constructor(private readonly symmetricKeyDeriver: SymmetricKeyDeriver) {}

	/**
	 * This should not be called directly! Use SymmetricCipherFacade instead
	 */
	encrypt(
		key: AesKey,
		plainText: Uint8Array,
		mustPrependIv: boolean,
		iv: Uint8Array,
		padding: boolean,
		cipherVersion: SymmetricCipherVersion,
		skipAuthenticationEnforcement: boolean = false,
	): Uint8Array {
		this.tryToEnforceAuthentication(key, cipherVersion, skipAuthenticationEnforcement)
		const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, cipherVersion)
		const cipherText = bitArrayToUint8Array(
			sjcl.mode.cbc.encrypt(new sjcl.cipher.aes(subKeys.encryptionKey), uint8ArrayToBitArray(plainText), uint8ArrayToBitArray(iv), [], padding),
		)

		let unauthenticatedCiphertext
		if (mustPrependIv) {
			//version byte is not included into authentication tag for legacy reasons
			unauthenticatedCiphertext = concat(iv, cipherText)
		} else {
			unauthenticatedCiphertext = cipherText
		}
		switch (cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
				return unauthenticatedCiphertext
			case SymmetricCipherVersion.AesCbcThenHmac: {
				const authenticationKey = assertNotNull(subKeys.authenticationKey)
				const authenticationTag = hmacSha256(authenticationKey, unauthenticatedCiphertext)
				return concat(symmetricCipherVersionToUint8Array(SymmetricCipherVersion.AesCbcThenHmac), unauthenticatedCiphertext, authenticationTag)
			}
			default:
				throw new CryptoError("unexpected cipher version " + cipherVersion)
		}
	}

	/**
	 * This should not be called directly! Use SymmetricCipherFacade instead
	 */
	decrypt(
		key: AesKey,
		cipherText: Uint8Array,
		ivIsPrepended: boolean,
		padding: boolean,
		cipherVersion: SymmetricCipherVersion,
		skipAuthenticationEnforcement: boolean = false,
	): Uint8Array {
		this.tryToEnforceAuthentication(key, cipherVersion, skipAuthenticationEnforcement)
		const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, cipherVersion)
		let cipherTextWithoutMacAndVersionByte: Uint8Array
		switch (cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
				cipherTextWithoutMacAndVersionByte = cipherText
				break
			case SymmetricCipherVersion.AesCbcThenHmac: {
				const authenticationKey = assertNotNull(subKeys.authenticationKey)
				cipherTextWithoutMacAndVersionByte = cipherText.subarray(
					SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES,
					cipherText.length - SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES,
				)
				const providedMacBytes = cipherText.subarray(cipherText.length - SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES, cipherText.length)
				verifyHmacSha256(authenticationKey, cipherTextWithoutMacAndVersionByte, providedMacBytes as MacTag)
				break
			}
			default:
				throw new Error("unexpected cipher version " + cipherVersion)
		}
		let iv: Uint8Array
		let aesCbcCiphertext: Uint8Array
		if (ivIsPrepended) {
			iv = cipherTextWithoutMacAndVersionByte.subarray(0, IV_BYTE_LENGTH)
			aesCbcCiphertext = cipherTextWithoutMacAndVersionByte.subarray(IV_BYTE_LENGTH, cipherTextWithoutMacAndVersionByte.length)
		} else {
			iv = FIXED_IV
			aesCbcCiphertext = cipherTextWithoutMacAndVersionByte
		}
		try {
			return bitArrayToUint8Array(
				sjcl.mode.cbc.decrypt(
					new sjcl.cipher.aes(subKeys.encryptionKey),
					uint8ArrayToBitArray(aesCbcCiphertext),
					uint8ArrayToBitArray(iv),
					[],
					padding,
				),
			)
		} catch (e) {
			throw new CryptoError("aes decryption failed", e as Error)
		}
	}

	private tryToEnforceAuthentication(key: AesKey, cipherVersion: SymmetricCipherVersion, skipAuthenticationEnforcement: boolean) {
		if (cipherVersion === SymmetricCipherVersion.UnusedReservedUnauthenticated) {
			// this is an unauthenticated cipher version which we only accept for certain exceptions and legacy encryptions which are only possible for 128-bit keys
			if (skipAuthenticationEnforcement) {
				// we accept unauthenticated decryption for exceptions such as the search index
				return
			} else {
				// we must enforce authentication but for legacy 128-bit keys we cannot (backward compatibility)
				const keyLength = getAndVerifyAesKeyLength(key)
				if (keyLength !== AesKeyLength.Aes128) {
					throw new CryptoError("key length " + keyLength + " is incompatible with cipherVersion " + cipherVersion)
				}
			}
		}
	}
}
export const AES_CBC_FACADE = new AesCbcFacade(SYMMETRIC_KEY_DERIVER)
