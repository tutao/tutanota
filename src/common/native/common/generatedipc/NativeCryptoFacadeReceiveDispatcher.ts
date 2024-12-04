/* generated file, don't edit. */

import { RsaPublicKey } from "./RsaPublicKey.js"
import { RsaPrivateKey } from "./RsaPrivateKey.js"
import { KyberPublicKey } from "./KyberPublicKey.js"
import { KyberPrivateKey } from "./KyberPrivateKey.js"
import { NativeCryptoFacade } from "./NativeCryptoFacade.js"

export class NativeCryptoFacadeReceiveDispatcher {
	constructor(private readonly facade: NativeCryptoFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "rsaEncrypt": {
				const publicKey: RsaPublicKey = arg[0]
				const data: Uint8Array = arg[1]
				const seed: Uint8Array = arg[2]
				return this.facade.rsaEncrypt(publicKey, data, seed)
			}
			case "rsaDecrypt": {
				const privateKey: RsaPrivateKey = arg[0]
				const data: Uint8Array = arg[1]
				return this.facade.rsaDecrypt(privateKey, data)
			}
			case "aesEncryptFile": {
				const key: Uint8Array = arg[0]
				const fileUri: string = arg[1]
				const iv: Uint8Array = arg[2]
				return this.facade.aesEncryptFile(key, fileUri, iv)
			}
			case "aesDecryptFile": {
				const key: Uint8Array = arg[0]
				const fileUri: string = arg[1]
				return this.facade.aesDecryptFile(key, fileUri)
			}
			case "argon2idGeneratePassphraseKey": {
				const passphrase: string = arg[0]
				const salt: Uint8Array = arg[1]
				return this.facade.argon2idGeneratePassphraseKey(passphrase, salt)
			}
			case "generateKyberKeypair": {
				const seed: Uint8Array = arg[0]
				return this.facade.generateKyberKeypair(seed)
			}
			case "kyberEncapsulate": {
				const publicKey: KyberPublicKey = arg[0]
				const seed: Uint8Array = arg[1]
				return this.facade.kyberEncapsulate(publicKey, seed)
			}
			case "kyberDecapsulate": {
				const privateKey: KyberPrivateKey = arg[0]
				const ciphertext: Uint8Array = arg[1]
				return this.facade.kyberDecapsulate(privateKey, ciphertext)
			}
		}
	}
}
