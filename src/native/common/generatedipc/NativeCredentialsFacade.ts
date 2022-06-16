/* generated file, don't edit. */

import {CredentialEncryptionMode} from "./CredentialEncryptionMode.js"
export interface NativeCredentialsFacade {

	encryptUsingKeychain(
		data: Uint8Array,
		encryptionMode: CredentialEncryptionMode,
	): Promise<Uint8Array>
	
	decryptUsingKeychain(
		encryptedData: Uint8Array,
		encryptionMode: CredentialEncryptionMode,
	): Promise<Uint8Array>
	
	getSupportedEncryptionModes(
	): Promise<ReadonlyArray<CredentialEncryptionMode>>
	
}
