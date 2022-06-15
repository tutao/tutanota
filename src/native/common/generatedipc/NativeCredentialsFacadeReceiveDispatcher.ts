/* generated file, don't edit. */

import {CredentialEncryptionMode} from "./CredentialEncryptionMode.js"
import {NativeCredentialsFacade} from "./NativeCredentialsFacade.js"

export class NativeCredentialsFacadeReceiveDispatcher {
	constructor(private readonly facade: NativeCredentialsFacade) {}
	async dispatch(method: string, arg: Array<any>) : Promise<any> {
		switch(method) {
			case "encryptUsingKeychain": {
				const base64EncodedData: string = arg[0]
				const encryptionMode: CredentialEncryptionMode = arg[1]
				return this.facade.encryptUsingKeychain(
					base64EncodedData,
					encryptionMode,
				)
			}
			case "decryptUsingKeychain": {
				const base64EncodedEncryptedData: string = arg[0]
				const encryptionMode: CredentialEncryptionMode = arg[1]
				return this.facade.decryptUsingKeychain(
					base64EncodedEncryptedData,
					encryptionMode,
				)
			}
			case "getSupportedEncryptionModes": {
				return this.facade.getSupportedEncryptionModes(
				)
			}
		}
	}
}
