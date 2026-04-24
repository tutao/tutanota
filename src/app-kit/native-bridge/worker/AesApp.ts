import { AesKey, generateInitializationVector, keyToUint8Array } from "../../../platform-kit/crypto"
import { NativeCryptoFacade } from "../common/generatedipc/types/NativeCryptoFacade.js"
import { FileUri } from "../common/FileApp.js"
import { EncryptedFileInfo } from "../common/generatedipc/types/EncryptedFileInfo.js"

export class AesApp {
	constructor(private readonly nativeCryptoFacade: NativeCryptoFacade) {}

	/**
	 * Encrypts a file with the provided key
	 * @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
	 */
	aesEncryptFile(key: AesKey, fileUrl: FileUri): Promise<EncryptedFileInfo> {
		const initializationVector = generateInitializationVector()
		const encodedKey = keyToUint8Array(key)
		return this.nativeCryptoFacade.aesEncryptFile(encodedKey, fileUrl, initializationVector)
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
