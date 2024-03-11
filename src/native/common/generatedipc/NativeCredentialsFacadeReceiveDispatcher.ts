/* generated file, don't edit. */

import { CredentialEncryptionMode } from "./CredentialEncryptionMode.js"
import { PersistedCredentials } from "./PersistedCredentials.js"
import { NativeCredentialsFacade } from "./NativeCredentialsFacade.js"

export class NativeCredentialsFacadeReceiveDispatcher {
	constructor(private readonly facade: NativeCredentialsFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "encryptUsingKeychain": {
				const data: Uint8Array = arg[0]
				const encryptionMode: CredentialEncryptionMode = arg[1]
				return this.facade.encryptUsingKeychain(data, encryptionMode)
			}
			case "decryptUsingKeychain": {
				const encryptedData: Uint8Array = arg[0]
				const encryptionMode: CredentialEncryptionMode = arg[1]
				return this.facade.decryptUsingKeychain(encryptedData, encryptionMode)
			}
			case "getSupportedEncryptionModes": {
				return this.facade.getSupportedEncryptionModes()
			}
			case "loadAll": {
				return this.facade.loadAll()
			}
			case "store": {
				const credentials: PersistedCredentials = arg[0]
				return this.facade.store(credentials)
			}
			case "loadByUserId": {
				const id: string = arg[0]
				return this.facade.loadByUserId(id)
			}
			case "deleteByUserId": {
				const id: string = arg[0]
				return this.facade.deleteByUserId(id)
			}
			case "getCredentialEncryptionMode": {
				return this.facade.getCredentialEncryptionMode()
			}
			case "setCredentialEncryptionMode": {
				const encryptionMode: CredentialEncryptionMode | null = arg[0]
				return this.facade.setCredentialEncryptionMode(encryptionMode)
			}
			case "getCredentialsEncryptionKey": {
				return this.facade.getCredentialsEncryptionKey()
			}
			case "setCredentialsEncryptionKey": {
				const credentialsEncryptionKey: Uint8Array | null = arg[0]
				return this.facade.setCredentialsEncryptionKey(credentialsEncryptionKey)
			}
		}
	}
}
