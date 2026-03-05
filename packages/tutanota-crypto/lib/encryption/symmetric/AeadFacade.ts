// /**
//  * This facade contains all methods for encryption/ decryption for Authenticated Encryption with Associated Data (AEAD).
//  *
//  * We use AES-CTR then BLAKE3, where the tag is computed over: version byte, nonce, ciphertext and associated data.
//  */
import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "./SymmetricCipherVersion"
import { SymmetricSubKeys } from "./SymmetricKeyDeriver"
import { AesKeyLength, getAndVerifyAesKeyLength } from "./AesKeyLength"
import { assertNotNull, concat } from "@tutao/tutanota-utils"
import { bitArrayToUint8Array, generateIV, uint8ArrayToBitArray } from "./SymmetricCipherUtils"
import sjcl from "../../internal/sjcl"
import { blake3Mac } from "../../hashes/Blake3"

export class AeadFacade {
	encrypt(key: SymmetricSubKeys, plainText: Uint8Array, associatedData: Uint8Array): Uint8Array {
		this.validateKeyLength(key)

		const iv = generateIV()
		const aesCtrCiphertext = bitArrayToUint8Array(
			sjcl.mode.ctr.encrypt(new sjcl.cipher.aes(key.encryptionKey), uint8ArrayToBitArray(plainText), uint8ArrayToBitArray(iv), []),
		)

		const unauthenticatedCiphertext = concat(symmetricCipherVersionToUint8Array(SymmetricCipherVersion.Aead), iv, aesCtrCiphertext)
		const unauthenticatedCiphertextLength = bitArrayToUint8Array([unauthenticatedCiphertext.length])

		const tag = blake3Mac(assertNotNull(key.authenticationKey), concat(unauthenticatedCiphertextLength, unauthenticatedCiphertext, associatedData))

		return concat(unauthenticatedCiphertext, tag)
	}

	// byte[] decrypt(SymmetricSubKeys key, byte[] cipherText, byte[] associatedData) throws InvalidKeyException {
	// 	validateKeyLength(key);
	//
	// 	try {
	// 		// T ′ ← Blake3(KA, VAEAD ||N||S||AD)
	// 		byte[] cipherTextWithoutMac = Arrays.copyOfRange(cipherText, 0, cipherText.length - DEFAULT_BLAKE3_OUTPUT_SIZE_BYTES);
	// 		byte[] authenticationTag = Arrays.copyOfRange(cipherText, cipherText.length - DEFAULT_BLAKE3_OUTPUT_SIZE_BYTES, cipherText.length);
	// 		byte[] cipherTextWIthoutMacLength = ByteBuffer.allocate(4).putInt(cipherTextWithoutMac.length).array();
	// 		blake3.verifyMac(authenticationTag, key.authenticationKey(), cipherTextWIthoutMacLength, cipherTextWithoutMac, associatedData);
	//
	// 		byte[] iv = Arrays.copyOfRange(cipherTextWithoutMac, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES,
	// 			SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES + IV_LENGTH_BYTES);
	// 		byte[] aesCtrCiphertext = Arrays.copyOfRange(cipherTextWithoutMac, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES + IV_LENGTH_BYTES,
	// 			cipherTextWithoutMac.length);
	//
	// 		Cipher cipher = Cipher.getInstance(AES_CTR_ENCRYPTION_MODE);
	// 		IvParameterSpec params = new IvParameterSpec(iv);
	//
	// 		cipher.init(Cipher.DECRYPT_MODE, key.encryptionKey(), params);
	// 		return cipher.doFinal(aesCtrCiphertext);
	// 	} catch (InvalidKeyException | IllegalBlockSizeException | BadPaddingException | NoSuchAlgorithmException | NoSuchPaddingException
	// 	| InvalidAlgorithmParameterException e) {
	// 		throw new TutaDbException(e);
	// 	}
	// }

	private validateKeyLength(key: SymmetricSubKeys) {
		// authentication key length is verified when computing the mac
		getAndVerifyAesKeyLength(key.encryptionKey, [AesKeyLength.Aes256])
		getAndVerifyAesKeyLength(assertNotNull(key.authenticationKey), [AesKeyLength.Aes256])
	}
}
