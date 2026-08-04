/* generated file, don't edit. */

import { CredentialsInfo } from "./CredentialsInfo.js"
/**
 * Key definition for shortcuts.
 */
export interface PersistedCredentials {
	readonly credentialInfo: CredentialsInfo
	readonly accessToken: Uint8Array<ArrayBuffer>
	readonly databaseKey: Uint8Array<ArrayBuffer> | null
	readonly encryptedPassword: string
	readonly encryptedPassphraseKey: Uint8Array<ArrayBuffer> | null
}
