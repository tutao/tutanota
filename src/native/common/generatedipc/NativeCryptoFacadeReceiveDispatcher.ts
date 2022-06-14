/* generated file, don't edit. */

import {PublicKey} from "./PublicKey.js"
import {PrivateKey} from "./PrivateKey.js"
import {NativeCryptoFacade} from "./NativeCryptoFacade.js"

export class NativeCryptoFacadeReceiveDispatcher {
	constructor(private readonly facade: NativeCryptoFacade) {}
	async dispatch(method: string, arg: Array<any>) : Promise<any> {
		switch(method) {
			case "rsaEncrypt": {
				const publicKey: PublicKey = arg[0]
				const base64Data: string = arg[1]
				const base64Seed: string = arg[2]
				return this.facade.rsaEncrypt(
					publicKey,
					base64Data,
					base64Seed,
				)
			}
			case "rsaDecrypt": {
				const privateKey: PrivateKey = arg[0]
				const base64Data: string = arg[1]
				return this.facade.rsaDecrypt(
					privateKey,
					base64Data,
				)
			}
			case "aesEncryptFile": {
				const key: string = arg[0]
				const fileUri: string = arg[1]
				const iv: string = arg[2]
				return this.facade.aesEncryptFile(
					key,
					fileUri,
					iv,
				)
			}
			case "aesDecryptFile": {
				const key: string = arg[0]
				const fileUri: string = arg[1]
				return this.facade.aesDecryptFile(
					key,
					fileUri,
				)
			}
			case "generateRsaKey": {
				const seed: string = arg[0]
				return this.facade.generateRsaKey(
					seed,
				)
			}
		}
	}
}
