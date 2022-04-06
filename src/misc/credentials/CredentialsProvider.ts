import type {CredentialEncryptionMode} from "./CredentialEncryptionMode"
import type {ICredentialsKeyMigrator} from "./CredentialsKeyMigrator"
import type {Base64, Base64Url} from "@tutao/tutanota-utils"
import {assertNotNull} from "@tutao/tutanota-utils"
import type {Credentials} from "./Credentials"
import {DatabaseKeyFactory} from "./DatabaseKeyFactory"
import {OfflineDbFacade} from "../../desktop/db/OfflineDbFacade"
import {InterWindowEventBus} from "../../native/common/InterWindowEventBus"
import {InterWindowEvent} from "../../desktop/ipc/IInterWindowEventBus"

/**
 * Type for persistent credentials, that contain the full credentials data.
 */
export type PersistentCredentials = {
	credentialInfo: CredentialsInfo
	accessToken: Base64
	databaseKey: Base64 | null
	encryptedPassword: Base64Url
}

/**
 * Credentials type that does not contain the actual credentials, but only meta information.
 */
export type CredentialsInfo = {
	login: string
	userId: Id
	type: "internal" | "external"
}

/**
 * Interface for encrypting credentials. If and how credentials are encrypted with an additional layer is platform-dependent and will
 * be decided by the platform-specific implementation of this interface.
 */
export interface CredentialsEncryption {
	/**
	 * Encrypts {@param credentials} using the encryption mode set for the device.
	 * @param credentials
	 */
	encrypt(credentials: CredentialsAndDatabaseKey): Promise<PersistentCredentials>

	/**
	 * Decrypts {@param encryptedCredentials} using the encryption mode set for the device.
	 * @param encryptedCredentials
	 */
	decrypt(encryptedCredentials: PersistentCredentials): Promise<CredentialsAndDatabaseKey>

	/**
	 * Returns all credentials encryption modes that are supported by the device.
	 */
	getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionMode>>
}

/**
 * Interface for storing credentials on a device.
 */
export interface CredentialsStorage {
	/**
	 * Stores {@param persistentCredentials}. If another set of credentials exists for the same userId, it will be overwritten.
	 * @param persistentCredentials
	 */
	store(persistentCredentials: PersistentCredentials): void

	/**
	 * Loads the credentials for {@param userId}.
	 * @param userId
	 */
	loadByUserId(userId: Id): PersistentCredentials | null

	/**
	 * Loads all credentials stored on the device.
	 */
	loadAll(): Array<PersistentCredentials>

	/**
	 * Deletes any stored credentials for {@param userId}.
	 * @param userId
	 */
	deleteByUserId(userId: Id): void

	/**
	 * Returns the credentials encryption mode, i.e. how the intermediate key used for encrypting credentials is encrypted on the device.
	 */
	getCredentialEncryptionMode(): CredentialEncryptionMode | null

	/**
	 * Sets the credentials encryption mode, i.e. how the intermediate key used for encrypting credentials is encrypted on the device.
	 * @param encryptionMode
	 */
	setCredentialEncryptionMode(encryptionMode: CredentialEncryptionMode | null): void

	/**
	 * Returns the (encrypted) key used for encrypting the access token and the database key
	 * This is encrypted using a key in the device's keystore
	 */
	getCredentialsEncryptionKey(): Uint8Array | null

	/**
	 * Sets the (encrypted) key used for encrypting credentials.
	 * @param credentialsEncryptionKey
	 */
	setCredentialsEncryptionKey(credentialsEncryptionKey: Uint8Array | null): void
}

export type CredentialsAndDatabaseKey = {
	credentials: Credentials,
	databaseKey?: Uint8Array | null
}

/**
 * Main entry point to interact with credentials, i.e. storing and retrieving credentials from/to persistence.
 */
export interface ICredentialsProvider {
	/**
	 * Stores credentials. If credentials already exist for login, they will be overwritten.
	 * Also creates a database key
	 */
	store(credentialsAndKey: CredentialsAndDatabaseKey): Promise<void>

	getCredentialsInfoByUserId(userId: Id): Promise<CredentialsInfo | null>

	/**
	 * Returns the full credentials for the userId passed in.
	 * @param userId
	 */
	getCredentialsByUserId(userId: Id): Promise<CredentialsAndDatabaseKey | null>

	/**
	 * Returns the stored credentials infos of all internal users, i.e. users that have a "real" tutanota account and not the ones that
	 * have a secure external mailbox.
	 */
	getInternalCredentialsInfos(): Promise<Array<CredentialsInfo>>

	/**
	 * Deletes stored credentials with specified userId.
	 * No-op if credentials are not there.
	 */
	deleteByUserId(userId: Id): Promise<void>

	/**
	 * Sets the credentials encryption mode, i.e. how the intermediate key used for encrypting credentials is protected.
	 * @param encryptionMode
	 * @throws KeyPermanentlyInvalidatedError
	 * @throws CredentialAuthenticationError
	 */
	setCredentialsEncryptionMode(encryptionMode: CredentialEncryptionMode): Promise<void>

	/**
	 * Returns the credentials encryption mode, i.e. how the intermediate key used for encrypting credentials is protected.
	 */
	getCredentialsEncryptionMode(): CredentialEncryptionMode | null

	/**
	 * Returns all credentials encryption modes that are supported by the device.
	 */
	getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionMode>>

	/**
	 * Removes all stored credentials as well as any settings associated with credentials encryption.
	 */
	clearCredentials(reason: Error | string): Promise<void>
}

export const CREDENTIALS_DELETED_EVENT = "credentialsDeleted"

export interface CredentialsDeletedEvent extends InterWindowEvent {
	name: typeof CREDENTIALS_DELETED_EVENT,
	userId: Id,
}

/**
 * Platoform-independent implementation for ICredentialsProvider.
 */
export class CredentialsProvider implements ICredentialsProvider {

	constructor(
		private readonly credentialsEncryption: CredentialsEncryption,
		private readonly storage: CredentialsStorage,
		private readonly keyMigrator: ICredentialsKeyMigrator,
		private readonly databaseKeyFactory: DatabaseKeyFactory,
		private readonly offlineDbFacade: OfflineDbFacade | null,
		private readonly interWindowEventBus: InterWindowEventBus | null,
	) {
	}

	async store(credentialsAndKey: CredentialsAndDatabaseKey): Promise<void> {
		const encryptedCredentials = await this.credentialsEncryption.encrypt(credentialsAndKey)
		this.storage.store(encryptedCredentials)
	}

	async getCredentialsInfoByUserId(userId: Id): Promise<CredentialsInfo | null> {
		const persistentCredentials = this.storage.loadByUserId(userId)

		return persistentCredentials?.credentialInfo ?? null
	}

	async getCredentialsByUserId(userId: Id): Promise<CredentialsAndDatabaseKey | null> {
		const persistentCredentials = this.storage.loadByUserId(userId)

		if (persistentCredentials == null) {
			return null
		}

		const decrypted = await this.credentialsEncryption.decrypt(persistentCredentials)

		if (decrypted.databaseKey == null) {
			// When offline mode is first released, there will be users who have saved credentials but no database key.
			// In the future, we will never save credentials without it, but we need to create one here

			decrypted.databaseKey = await this.databaseKeyFactory.generateKey()

			if (decrypted.databaseKey != null) {
				// TODO this might prompt the user to unlock the keychain again
				// 		We should figure out what to do about this
				const reEncrypted = await this.credentialsEncryption.encrypt(decrypted)
				this.storage.store(reEncrypted)
			}
		}

		return decrypted
	}

	async getInternalCredentialsInfos(): Promise<Array<CredentialsInfo>> {
		const allCredentials = this.storage.loadAll().map(persistentCredentials => persistentCredentials.credentialInfo)
		return allCredentials.filter(credential => {
			return credential.type === "internal"
		})
	}

	async deleteByUserId(userId: Id): Promise<void> {
		const event: CredentialsDeletedEvent = {
			name: CREDENTIALS_DELETED_EVENT,
			userId,
		}
		this.interWindowEventBus?.send(event)
		await this.offlineDbFacade?.deleteDatabaseForUser(userId)
		this.storage.deleteByUserId(userId)
	}

	async setCredentialsEncryptionMode(encryptionMode: CredentialEncryptionMode): Promise<void> {
		if (encryptionMode === this.getCredentialsEncryptionMode()) {
			return
		}

		const oldKeyEncrypted = this.storage.getCredentialsEncryptionKey()

		if (oldKeyEncrypted) {
			// if we have a key we must have a method
			const oldEncryptionMode = assertNotNull(this.storage.getCredentialEncryptionMode())
			const newlyEncryptedKey = await this.keyMigrator.migrateCredentialsKey(oldKeyEncrypted, oldEncryptionMode, encryptionMode)

			this.storage.setCredentialsEncryptionKey(newlyEncryptedKey)
		}

		this.storage.setCredentialEncryptionMode(encryptionMode)
	}

	getCredentialsEncryptionMode(): CredentialEncryptionMode | null {
		return this.storage.getCredentialEncryptionMode()
	}

	async getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionMode>> {
		return await this.credentialsEncryption.getSupportedEncryptionModes()
	}

	async clearCredentials(reason: Error | string): Promise<void> {
		console.warn("clearing all stored credentials:", reason)
		const storedCredentials = this.storage.loadAll()

		for (let storedCredential of storedCredentials) {
			await this.deleteByUserId(storedCredential.credentialInfo.userId)
		}

		this.storage.setCredentialsEncryptionKey(null)

		this.storage.setCredentialEncryptionMode(null)
	}
}