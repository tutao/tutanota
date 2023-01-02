/* generated file, don't edit. */

import { RsaPublicKey } from "./RsaPublicKey.js"
import { RsaPrivateKey } from "./RsaPrivateKey.js"
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
			case "generateRsaKey": {
				const seed: Uint8Array = arg[0]
				return this.facade.generateRsaKey(seed)
			}
		}
	}
}
