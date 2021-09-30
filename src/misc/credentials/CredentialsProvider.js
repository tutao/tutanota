// @flow
import {promiseMap} from "../../api/common/utils/PromiseUtils"

export type EncryptedCredentials = {|
	login: string,
	encryptedPassword: Base64,
	encryptedAccessToken: Base64Url,
	+userId: Id,
	type: "internal" | "external"
|}

/**
 * Interface for encrypting credentials.
 */
export interface CredentialsEncryption {
	encrypt(credentials: Credentials): Promise<EncryptedCredentials>;

	decrypt(encryptedCredentials: EncryptedCredentials): Promise<Credentials>;
}

/**
 * Interface for storing credentials.
 */
export interface CredentialsStorage {
	store(encryptedCredentials: EncryptedCredentials): void;

	loadByUserId(userId: Id): EncryptedCredentials | null;

	loadAll(): Array<EncryptedCredentials>;

	deleteByUserId(userId: Id): void;
}

/**
 * Main entry point to interact with credentials, i.e. storing and retrieving credentials from/to persistence.
 */
export class CredentialsProvider {
	+_credentialsEncryption: CredentialsEncryption
	+_credentialsStorage: CredentialsStorage

	constructor(credentialsEncryption: CredentialsEncryption, storage: CredentialsStorage) {
		this._credentialsEncryption = credentialsEncryption
		this._credentialsStorage = storage
	}

	/**
	 * Stores credentials. If credentials already exist for emailAddress or userId, they will be overwritten.
	 * @param credentials
	 */
	async store(credentials: Credentials): Promise<void> {
		const encryptedCredentials = await this._credentialsEncryption.encrypt(credentials)
		this._credentialsStorage.store(encryptedCredentials)
	}

	async getCredentialsByUserId(userId: Id): Promise<Credentials | null> {
		const userIdAndCredentials = this._credentialsStorage.loadByUserId(userId)
		if (userIdAndCredentials == null) {
			return null
		}
		return this._credentialsEncryption.decrypt(userIdAndCredentials)
	}

	async getAllEncryptedCredentials(): Promise<Array<EncryptedCredentials>> {
		return this._credentialsStorage.loadAll()
	}

	/**
	 * Returns the stored credentials of all internal users, i.e. users that have a "real" tutanota account and not the ones that have a
	 * secure external mailbox.
	 */
	async getAllInternalEncryptedCredentials(): Promise<Array<EncryptedCredentials>> {
		const allCredentials = await this.getAllEncryptedCredentials()
		return allCredentials.filter((credential) => {
			return credential.type === "internal"
		})
	}

	/**
	 * Deletes stored credentials with specified userId.
	 * No-op if credentials are not there.
	 */
	async deleteByUserId(userId: Id): Promise<void> {
		this._credentialsStorage.deleteByUserId(userId)
	}

}

