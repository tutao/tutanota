/* generated file, don't edit. */

import {CredentialEncryptionMode} from "./CredentialEncryptionMode.js"
export interface NativeCredentialsFacade {

	encryptUsingKeychain(
		base64EncodedData: string,
		encryptionMode: CredentialEncryptionMode,
	): Promise<string>
	
	decryptUsingKeychain(
		base64EncodedEncryptedData: string,
		encryptionMode: CredentialEncryptionMode,
	): Promise<string>
	
	getSupportedEncryptionModes(
	): Promise<ReadonlyArray<CredentialEncryptionMode>>
	
}
