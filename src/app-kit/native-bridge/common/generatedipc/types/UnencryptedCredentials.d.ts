/* generated file, don't edit. */

import { CredentialsInfo } from "./CredentialsInfo.js"
/**
 * Credentials ready to be used at runtime
 */
export interface UnencryptedCredentials {
	readonly credentialInfo: CredentialsInfo
	readonly accessToken: string
	readonly databaseKey: Uint8Array | null
	readonly encryptedPassword: string
	readonly encryptedPassphraseKey: Uint8Array | null
}
