/* generated file, don't edit. */

import { CredentialsInfo } from "./CredentialsInfo.js"
/**
 * Key definition for shortcuts.
 */
export interface PersistedCredentials {
	readonly credentialInfo: CredentialsInfo
	readonly accessToken: Uint8Array
	readonly databaseKey: Uint8Array | null
	readonly encryptedPassword: string
	readonly encryptedPassphraseKey: Uint8Array | null
}
