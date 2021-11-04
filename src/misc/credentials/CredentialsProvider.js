// @flow

import type {CredentialEncryptionModeEnum} from "./CredentialEncryptionMode"
import type {ICredentialsKeyMigrator} from "./CredentialsKeyMigrator"
import {assertNotNull} from "@tutao/tutanota-utils"
import type {Base64, Base64Url} from "@tutao/tutanota-utils/"
import type {Credentials} from "./Credentials"

/**
 * Type for persistent credentials, that contain the full credentials data.
 */
export type PersistentCredentials = {|
	credentialInfo: CredentialsInfo,
	accessToken: Base64,
	encryptedPassword: Base64Url,
|}

/**
 * Credentials type that does not contain the actual credentials, but only meta information.
 */
export type CredentialsInfo = {|
	login: string,
	userId: Id,
	type: "internal" | "external"
|}

/**
 * Interface for encrypting credentials. If and how credentials are encrypted with an additional layer is platform-dependent and will
 * be decided by the platform-specific implementation of this interface.
 */
export interface CredentialsEncryption {
	/**
	 * Encrypts {@param credentials} using the encryption mode set for the device.
	 * @param credentials
	 */
	encrypt(credentials: Credentials): Promise<PersistentCredentials>;

	/**
	 * Decrypts {@param encryptedCredentials} using the encryption mode set for the device.
	 * @param encryptedCredentials
	 */
	decrypt(encryptedCredentials: PersistentCredentials): Promise<Credentials>;

	/**
	 * Returns all credentials encryption modes that are supported by the device.
	 */
	getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionModeEnum>>;
}

/**
 * Interface for storing credentials on a device.
 */
export interface CredentialsStorage {
	/**
	 * Stores {@param persistentCredentials}. If another set of credentials exists for the same userId, it will be overwritten.
	 * @param persistentCredentials
	 */
	store(persistentCredentials: PersistentCredentials): void;

	/**
	 * Loads the credentials for {@param userId}.
	 * @param userId
	 */
	loadByUserId(userId: Id): PersistentCredentials | null;

	/**
	 * Loads all credentials stored on the device.
	 */
	loadAll(): Array<PersistentCredentials>;

	/**
	 * Deletes any stored credentials for {@param userId}.
	 * @param userId
	 */
	deleteByUserId(userId: Id): void;

	/**
	 * Returns the credentials encryption mode, i.e. how the intermediate key used for encrypting credentials is encrypted on the device.
	 */
	getCredentialEncryptionMode(): ?CredentialEncryptionModeEnum;

	/**
	 * Sets the credentials encryption mode, i.e. how the intermediate key used for encrypting credentials is encrypted on the device.
	 * @param encryptionMode
	 */
	setCredentialEncryptionMode(encryptionMode: CredentialEncryptionModeEnum | null): void;

	/**
	 * Returns the (encrypted) key used for encrypting credentials.
	 */
	getCredentialsEncryptionKey(): ?Uint8Array;

	/**
	 * Sets the (encrypted) key used for encrypting credentials.
	 * @param credentialsEncryptionKey
	 */
	setCredentialsEncryptionKey(credentialsEncryptionKey: Uint8Array | null): void
}

/**
 * Main entry point to interact with credentials, i.e. storing and retrieving credentials from/to persistence.
 */
export interface ICredentialsProvider {
	/**
	 * Stores credentials. If credentials already exist for login, they will be overwritten.
	 * @param credentials
	 */
	store(credentials: Credentials): Promise<void>;

	getCredentialsInfoByUserId(userId: Id): Promise<CredentialsInfo | null>;

	/**
	 * Returns the full credentials for the userId passed in.
	 * @param userId
	 */
	getCredentialsByUserId(userId: Id): Promise<Credentials | null>;

	/**
	 * Returns all credential infos stored on the device.
	 */
	getCredentialsInfos(): Promise<Array<CredentialsInfo>>;

	/**
	 * Returns the stored credentials infos of all internal users, i.e. users that have a "real" tutanota account and not the ones that
	 * have a secure external mailbox.
	 */
	getInternalCredentialsInfos(): Promise<Array<CredentialsInfo>>;

	/**
	 * Deletes stored credentials with specified userId.
	 * No-op if credentials are not there.
	 */
	deleteByUserId(userId: Id): Promise<void>;

	/**
	 * Sets the credentials encryption mode, i.e. how the intermediate key used for encrypting credentials is protected.
	 * @param encryptionMode
	 */
	setCredentialsEncryptionMode(encryptionMode: CredentialEncryptionModeEnum): Promise<void>;

	/**
	 * Returns the credentials encryption mode, i.e. how the intermediate key used for encrypting credentials is protected.
	 */
	getCredentialsEncryptionMode(): ?CredentialEncryptionModeEnum;

	/**
	 * Returns all credentials encryption modes that are supported by the device.
	 */
	getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionModeEnum>>;

	/**
	 * Removes all stored credentials as well as any settings associated with credentials encryption.
	 */
	clearCredentials(): Promise<void>;
}

/**
 * Platoform-independent implementation for ICredentialsProvider.
 */
export class CredentialsProvider implements ICredentialsProvider {
	+_credentialsEncryption: CredentialsEncryption
	+_credentialsStorage: CredentialsStorage
	+_keyMigrator: ICredentialsKeyMigrator

	constructor(credentialsEncryption: CredentialsEncryption, storage: CredentialsStorage, keyMigrator: ICredentialsKeyMigrator) {
		this._credentialsEncryption = credentialsEncryption
		this._credentialsStorage = storage
		this._keyMigrator = keyMigrator
	}

	async store(credentials: Credentials): Promise<void> {
		const encryptedCredentials = await this._credentialsEncryption.encrypt(credentials)
		this._credentialsStorage.store(encryptedCredentials)
	}

	async getCredentialsInfoByUserId(userId: Id): Promise<CredentialsInfo | null> {
		const persistentCredentials = this._credentialsStorage.loadByUserId(userId)
		return persistentCredentials?.credentialInfo ?? null
	}

	async getCredentialsByUserId(userId: Id): Promise<Credentials | null> {
		const userIdAndCredentials = this._credentialsStorage.loadByUserId(userId)
		if (userIdAndCredentials == null) {
			return null
		}
		return this._credentialsEncryption.decrypt(userIdAndCredentials)
	}

	async getCredentialsInfos(): Promise<Array<CredentialsInfo>> {
		return this._credentialsStorage.loadAll().map((persistentCredentials) => persistentCredentials.credentialInfo)
	}

	async getInternalCredentialsInfos(): Promise<Array<CredentialsInfo>> {
		const allCredentials = await this.getCredentialsInfos()
		return allCredentials.filter((credential) => {
			return credential.type === "internal"
		})
	}

	async deleteByUserId(userId: Id): Promise<void> {
		this._credentialsStorage.deleteByUserId(userId)
	}

	async setCredentialsEncryptionMode(encryptionMode: CredentialEncryptionModeEnum): Promise<void> {
		if (encryptionMode === this.getCredentialsEncryptionMode()) {
			return
		}

		const oldKeyEncrypted = this._credentialsStorage.getCredentialsEncryptionKey()

		if (oldKeyEncrypted) {
			// if we have a key we must have a method
			const oldEncryptionMode = assertNotNull(this._credentialsStorage.getCredentialEncryptionMode())
			const newlyEncryptedKey = await this._keyMigrator.migrateCredentialsKey(oldKeyEncrypted, oldEncryptionMode, encryptionMode)
			this._credentialsStorage.setCredentialsEncryptionKey(newlyEncryptedKey)
		}

		this._credentialsStorage.setCredentialEncryptionMode(encryptionMode)
	}

	getCredentialsEncryptionMode(): ?CredentialEncryptionModeEnum {
		return this._credentialsStorage.getCredentialEncryptionMode()
	}

	async getSupportedEncryptionModes(): Promise<Array<CredentialEncryptionModeEnum>> {
		return await this._credentialsEncryption.getSupportedEncryptionModes()
	}

	async clearCredentials(): Promise<void> {
		const storedCredentials = this._credentialsStorage.loadAll()
		for (let storedCredential of storedCredentials) {
			await this.deleteByUserId(storedCredential.credentialInfo.userId)
		}
		this._credentialsStorage.setCredentialsEncryptionKey(null)
		this._credentialsStorage.setCredentialEncryptionMode(null)
	}
}
