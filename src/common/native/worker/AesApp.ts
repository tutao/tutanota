import { AesKey, IV_BYTE_LENGTH, keyToUint8Array, Randomizer } from "@tutao/crypto"
import { FileUri } from "../common/FileApp"
import { NativeCryptoFacade } from "@tutao/native-bridge"
import { EncryptedFileInfo } from "@tutao/native-bridge"

export class AesApp {
	constructor(
		private readonly nativeCryptoFacade: NativeCryptoFacade,
		private readonly random: Randomizer,
	) {}

	/**
	 * Encrypts a file with the provided key
	 * @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
	 */
	aesEncryptFile(key: AesKey, fileUrl: FileUri): Promise<EncryptedFileInfo> {
		const iv = this.random.generateRandomData(IV_BYTE_LENGTH)
		const encodedKey = keyToUint8Array(key)
		return this.nativeCryptoFacade.aesEncryptFile(encodedKey, fileUrl, iv)
	}

	/**
	 * Decrypt bytes with the provided key
	 * @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
	 */
	aesDecryptFile(key: AesKey, fileUrl: FileUri): Promise<FileUri> {
		const encodedKey = keyToUint8Array(key)
		return this.nativeCryptoFacade.aesDecryptFile(encodedKey, fileUrl)
	}
}
