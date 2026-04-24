/* generated file, don't edit. */

import { CredentialEncryptionMode } from "./CredentialEncryptionMode.js"
import { PersistedCredentials } from "./PersistedCredentials.js"
import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
/**
 * Operations for credential encryption operations using OS keychain.
 */
export interface NativeCredentialsFacade {
	getSupportedEncryptionModes(): Promise<ReadonlyArray<CredentialEncryptionMode>>

	loadAll(): Promise<ReadonlyArray<PersistedCredentials>>

	/**
	 * Encrypt and store credentials
	 */
	store(credentials: UnencryptedCredentials): Promise<void>

	/**
	 * Store already encrypted credentials
	 */
	storeEncrypted(credentials: PersistedCredentials): Promise<void>

	loadByUserId(id: string): Promise<UnencryptedCredentials | null>

	deleteByUserId(id: string): Promise<void>

	getCredentialEncryptionMode(): Promise<CredentialEncryptionMode | null>

	setCredentialEncryptionMode(encryptionMode: CredentialEncryptionMode): Promise<void>

	clear(): Promise<void>

	/**
	 * Migrate existing credentials to native db
	 */
	migrateToNativeCredentials(
		credentials: ReadonlyArray<PersistedCredentials>,
		encryptionMode: CredentialEncryptionMode,
		credentialsKey: Uint8Array,
	): Promise<void>
}
