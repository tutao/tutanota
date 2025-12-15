/**
 * This facade contains all methods for encryption/ decryption for Authenticated Encryption with Associated Data (AEAD).
 *
 * We use AES-CBC then HMAC-SHA-256, where the tag is computed over: version byte, IV, ciphertext and associated data.
 */
import { SymmetricKeyDeriver } from "./SymmetricKeyDeriver"
import { AesKey, bitArrayToUint8Array, SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES, uint8ArrayToBitArray } from "./SymmetricCipherUtils"
import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "./SymmetricCipherVersion"
import { assertNotNull, concat } from "@tutao/tutanota-utils"
import sjcl from "../../internal/sjcl"
import { hmacSha256, verifyHmacSha256 } from "../Hmac"

export class AeadFacade {
	constructor(private readonly symmetricKeyDeriver: SymmetricKeyDeriver) {}
	encrypt(key: AesKey, plainText: Uint8Array, iv: Uint8Array, associatedData: Uint8Array): Uint8Array {
		// Cipher cipher = Cipher.getInstance((padding) ? AES_ENCRYPTION_MODE_PADDING : AES_ENCRYPTION_MODE_NO_PADDING);
		// IvParameterSpec params = new IvParameterSpec(iv);

		const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, SymmetricCipherVersion.Aead)

		//C ←  AESCBC,E (EK , IV , M)
		const aesCbcCiphertext = bitArrayToUint8Array(
			sjcl.mode.cbc.encrypt(new sjcl.cipher.aes(subKeys.encryptionKey), uint8ArrayToBitArray(plainText), uint8ArrayToBitArray(iv), [], true),
		)

		//T ← HMAC(AK , VAEAD ||IV ||C||AD
		const unauthenticatedData = concat(symmetricCipherVersionToUint8Array(SymmetricCipherVersion.Aead), iv, aesCbcCiphertext, associatedData)

		const tag = hmacSha256(assertNotNull(subKeys.authenticationKey), unauthenticatedData)

		//CT ← VAEAD ||IV ||C||T
		return concat(unauthenticatedData, tag)
	}

	// 	decrypt( key: AesKey, cipherText: Uint8Array,  associatedData: Uint8Array) {
	// 		try {
	// 			const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, SymmetricCipherVersion.Aead);
	//
	// 			//T ′ ← HMAC(AK , VAEAD ||IV ||C||AD)
	// 			const cipherTextWithoutMac = cipherText.subarray(0, cipherText.length - SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES);
	// 			const authenticationTag = cipherText.subarray(cipherText.length - SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES, cipherText.length);
	// 			const ciphertextWithoutMacWithData = concat(cipherTextWithoutMac, associatedData)
	// 			verifyHmacSha256(assertNotNull(subKeys.authenticationKey),  ciphertextWithoutMacWithData, associatedData);
	//
	// 			byte[] iv = Arrays.copyOfRange(cipherTextWithoutMac, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES,
	// 					SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES + IV_LENGTH_BYTES);
	// 			byte[] aesCbcCiphertext = Arrays.copyOfRange(cipherTextWithoutMac, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES + IV_LENGTH_BYTES,
	// 					cipherTextWithoutMac.length);
	//
	// 			Cipher cipher = Cipher.getInstance((padding) ? AES_ENCRYPTION_MODE_PADDING : AES_ENCRYPTION_MODE_NO_PADDING);
	// 			IvParameterSpec params = new IvParameterSpec(iv);
	// 			cipher.init(Cipher.DECRYPT_MODE, subKeys.encryptionKey(), params);
	// 			return cipher.doFinal(aesCbcCiphertext);
	// 		} catch (InvalidKeyException | IllegalBlockSizeException | BadPaddingException | NoSuchAlgorithmException | NoSuchPaddingException
	// 				 | InvalidAlgorithmParameterException e) {
	// 			throw new TutaDbException(e);
	// 		}
	// 	}
	// }
}
