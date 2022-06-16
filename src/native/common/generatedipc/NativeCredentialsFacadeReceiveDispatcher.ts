/* generated file, don't edit. */

import {CredentialEncryptionMode} from "./CredentialEncryptionMode.js"
import {NativeCredentialsFacade} from "./NativeCredentialsFacade.js"

export class NativeCredentialsFacadeReceiveDispatcher {
	constructor(private readonly facade: NativeCredentialsFacade) {}
	async dispatch(method: string, arg: Array<any>) : Promise<any> {
		switch(method) {
			case "encryptUsingKeychain": {
				const data: Uint8Array = arg[0]
				const encryptionMode: CredentialEncryptionMode = arg[1]
				return this.facade.encryptUsingKeychain(
					data,
					encryptionMode,
				)
			}
			case "decryptUsingKeychain": {
				const encryptedData: Uint8Array = arg[0]
				const encryptionMode: CredentialEncryptionMode = arg[1]
				return this.facade.decryptUsingKeychain(
					encryptedData,
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
