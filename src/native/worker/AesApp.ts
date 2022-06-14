import {uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {IV_BYTE_LENGTH, keyToBase64, Randomizer} from "@tutao/tutanota-crypto"
import {FileUri} from "../common/FileApp"
import {NativeCryptoFacade} from "../common/generatedipc/NativeCryptoFacade"
import {EncryptedFileInfo} from "../common/generatedipc/EncryptedFileInfo"

export class AesApp {

	constructor(
		private readonly nativeCryptoFacade: NativeCryptoFacade,
		private readonly random: Randomizer,
	) {
	}

	/**
	 * Encrypts a file with the provided key
	 * @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
	 */
	aesEncryptFile(key: Aes128Key, fileUrl: FileUri): Promise<EncryptedFileInfo> {
		const iv = this.random.generateRandomData(IV_BYTE_LENGTH)
		let encodedKey = keyToBase64(key)
		return this.nativeCryptoFacade.aesEncryptFile(encodedKey, fileUrl, uint8ArrayToBase64(iv))
	}

	/**
	 * Decrypt bytes with the provided key
	 * @return Returns the URI of the decrypted file. Resolves to an exception if the encryption failed.
	 */
	aesDecryptFile(key: Aes128Key, fileUrl: FileUri): Promise<FileUri> {
		let encodedKey = keyToBase64(key)
		return this.nativeCryptoFacade.aesDecryptFile(encodedKey, fileUrl)
	}
}