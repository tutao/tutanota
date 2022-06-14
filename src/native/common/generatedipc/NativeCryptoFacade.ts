/* generated file, don't edit. */

import {PublicKey} from "./PublicKey.js"
import {PrivateKey} from "./PrivateKey.js"
import {EncryptedFileInfo} from "./EncryptedFileInfo.js"
import {RsaKeyPair} from "./RsaKeyPair.js"
export interface NativeCryptoFacade {

	rsaEncrypt(
		publicKey: PublicKey,
		base64Data: string,
		base64Seed: string,
	): Promise<string>
	
	rsaDecrypt(
		privateKey: PrivateKey,
		base64Data: string,
	): Promise<string>
	
	aesEncryptFile(
		key: string,
		fileUri: string,
		iv: string,
	): Promise<EncryptedFileInfo>
	
	aesDecryptFile(
		key: string,
		fileUri: string,
	): Promise<string>
	
	generateRsaKey(
		seed: string,
	): Promise<RsaKeyPair>
	
}
