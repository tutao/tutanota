/* generated file, don't edit. */

import { CredentialEncryptionMode } from "./CredentialEncryptionMode.js"
import { PersistedCredentials } from "./PersistedCredentials.js"
/**
 * Operations for credential encryption operations using OS keychain.
 */
export interface NativeCredentialsFacade {
	encryptUsingKeychain(data: Uint8Array, encryptionMode: CredentialEncryptionMode): Promise<Uint8Array>

	decryptUsingKeychain(encryptedData: Uint8Array, encryptionMode: CredentialEncryptionMode): Promise<Uint8Array>

	getSupportedEncryptionModes(): Promise<ReadonlyArray<CredentialEncryptionMode>>

	loadAll(): Promise<ReadonlyArray<PersistedCredentials>>

	store(credentials: PersistedCredentials): Promise<void>

	loadByUserId(id: string): Promise<PersistedCredentials | null>

	deleteByUserId(id: string): Promise<void>

	getCredentialEncryptionMode(): Promise<CredentialEncryptionMode | null>

	setCredentialEncryptionMode(encryptionMode: CredentialEncryptionMode | null): Promise<void>

	getCredentialsEncryptionKey(): Promise<Uint8Array | null>

	setCredentialsEncryptionKey(credentialsEncryptionKey: Uint8Array | null): Promise<void>
}
