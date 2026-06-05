import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "./SymmetricCipherVersion.js"
import { AesKey, bitArrayToUint8Array, FIXED_INITIALIZATION_VECTOR, uint8ArrayToBitArray } from "./SymmetricCipherUtils"
import { CryptoError } from "@tutao/crypto/error"
import { assertNotNull, concat } from "@tutao/utils"
import sjcl from "../../internal/sjcl"
import { hmacSha256, verifyHmacSha256, verifyHmacSha256Async } from "../Hmac"
import { SymmetricSubKeys } from "./SymmetricKeyDeriver"
import { AesKeyLength, getAndVerifyAesKeyLength } from "./AesKeyLength"
import { ProgrammingError } from "@tutao/app-env"
import { InitializationVectorSource, InitializationVectorVariant, ParsedCiphertextAesCbc } from "./ParsedCiphertext"
import { MacTag } from "../../CryptoTypes"

export enum AuthenticationEnforcement {
	Strict,
	Relaxed,
}

export enum PaddingStandard {
	None,
	Pkcs5,
}

/**
 * This facade provides the implementation for both encryption and decryption of AES in CBC mode. Supports 128 and 256-bit keys.
 * Depending on the cipher version the encryption is authenticated with HMAC-SHA-256.
 * SymmetricCipherFacade is responsible for handling parameters for encryption/decryption.
 */
export class AesCbcFacade {
	constructor() {}

	/**
	 * This should not be called directly! Use SymmetricCipherFacade instead
	 */
	encrypt(
		subKeys: SymmetricSubKeys,
		plainText: Uint8Array,
		initializationVector: InitializationVectorSource,
		paddingStandard: PaddingStandard,
		cipherVersion: SymmetricCipherVersion,
		authenticationEnforcement: AuthenticationEnforcement = AuthenticationEnforcement.Strict,
	): Uint8Array {
		this.tryToEnforceAuthentication(subKeys, cipherVersion, authenticationEnforcement)
		const usePadding = paddingStandard === PaddingStandard.Pkcs5
		const ciphertext = bitArrayToUint8Array(
			sjcl.mode.cbc.encrypt(
				new sjcl.cipher.aes(subKeys.encryptionKey),
				uint8ArrayToBitArray(plainText),
				uint8ArrayToBitArray(initializationVector === InitializationVectorVariant.Fixed ? FIXED_INITIALIZATION_VECTOR : initializationVector),
				[],
				usePadding,
			),
		)

		let unauthenticatedCiphertext
		if (initializationVector === InitializationVectorVariant.Fixed) {
			unauthenticatedCiphertext = ciphertext
		} else {
			//version byte is not included into authentication tag for legacy reasons
			unauthenticatedCiphertext = concat(initializationVector, ciphertext)
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
		subKeys: SymmetricSubKeys,
		parsedCiphertext: ParsedCiphertextAesCbc,
		paddingStandard: PaddingStandard,
		authenticationEnforcement: AuthenticationEnforcement = AuthenticationEnforcement.Strict,
	): Uint8Array {
		this.authenticate(subKeys, parsedCiphertext, authenticationEnforcement, verifyHmacSha256)
		const usePadding = paddingStandard === PaddingStandard.Pkcs5
		try {
			return bitArrayToUint8Array(
				sjcl.mode.cbc.decrypt(
					new sjcl.cipher.aes(subKeys.encryptionKey),
					uint8ArrayToBitArray(parsedCiphertext.ciphertext),
					uint8ArrayToBitArray(parsedCiphertext.initializationVector),
					[],
					usePadding,
				),
			)
		} catch (e) {
			throw new CryptoError("aes decryption failed", e as Error)
		}
	}

	async decryptAsync(
		subKeys: SymmetricSubKeys,
		parsedCiphertext: ParsedCiphertextAesCbc,
		authenticationEnforcement: AuthenticationEnforcement = AuthenticationEnforcement.Strict,
	): Promise<Uint8Array> {
		await this.authenticate(subKeys, parsedCiphertext, authenticationEnforcement, verifyHmacSha256Async)
		try {
			const encryptionKey = await crypto.subtle.importKey("raw", bitArrayToUint8Array(subKeys.encryptionKey), "AES-CBC", false, ["decrypt"])
			return new Uint8Array(
				await crypto.subtle.decrypt({ name: "AES-CBC", iv: parsedCiphertext.initializationVector }, encryptionKey, parsedCiphertext.ciphertext),
			)
		} catch (e) {
			throw new CryptoError("aes decryption failed", e as Error)
		}
	}

	private authenticate<T>(
		subKeys: SymmetricSubKeys,
		parsedCiphertext: ParsedCiphertextAesCbc,
		authenticationEnforcement: AuthenticationEnforcement,
		verifyHmac: (key: AesKey, data: Uint8Array, tag: MacTag) => T,
	): T | null {
		this.tryToEnforceAuthentication(subKeys, parsedCiphertext.cipherVersion, authenticationEnforcement)
		if (parsedCiphertext.cipherVersion === SymmetricCipherVersion.AesCbcThenHmac && subKeys.cipherVersion === SymmetricCipherVersion.AesCbcThenHmac) {
			const verifiableCiphertext = this.assembleVerifiableCiphertext(parsedCiphertext)
			return verifyHmac(subKeys.authenticationKey, verifiableCiphertext, parsedCiphertext.macTag)
		} else if (parsedCiphertext.cipherVersion !== subKeys.cipherVersion) {
			throw new ProgrammingError("mismatched sub-key and ciphertext cipher versions")
		}
		return null
	}

	private assembleVerifiableCiphertext(parsedCiphertext: ParsedCiphertextAesCbc): Uint8Array {
		if (parsedCiphertext.initializationVectorVariant === InitializationVectorVariant.Random) {
			return concat(parsedCiphertext.initializationVector, parsedCiphertext.ciphertext)
		} else {
			return parsedCiphertext.ciphertext
		}
	}

	private tryToEnforceAuthentication(subKeys: SymmetricSubKeys, cipherVersion: SymmetricCipherVersion, authenticationEnforcement: AuthenticationEnforcement) {
		if (cipherVersion === SymmetricCipherVersion.UnusedReservedUnauthenticated) {
			// this is an unauthenticated cipher version which we only accept for certain exceptions and legacy encryption versions which are only possible for 128-bit keys
			if (authenticationEnforcement === AuthenticationEnforcement.Relaxed) {
				// we accept unauthenticated decryption for exceptions such as the search index
				return
			} else {
				// we must enforce authentication but for legacy 128-bit keys we cannot (backward compatibility)
				const keyLength = getAndVerifyAesKeyLength(subKeys.encryptionKey)
				if (subKeys.authenticationKey != null) {
					if (getAndVerifyAesKeyLength(subKeys.authenticationKey) !== keyLength) {
						throw new CryptoError("invalid sub-keys")
					}
				}
				if (keyLength !== AesKeyLength.Aes128) {
					throw new CryptoError("key length " + keyLength + " is incompatible with cipherVersion " + cipherVersion)
				}
			}
		}
	}
}

export const AES_CBC_FACADE = new AesCbcFacade()
