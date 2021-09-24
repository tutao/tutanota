// @flow
import {promiseMap} from "../../api/common/utils/PromiseUtils"

export interface CredentialsEncryption {
	encrypt(credentials: Credentials): Promise<Base64>;

	decrypt(encryptedCredentials: Base64): Promise<Credentials>;
}

export interface CredentialsStorage {
	store(userId: Id, encryptedCredentials: Base64): void;

	loadByUserId(userId: Id): [Id, Base64] | null;

	loadAll(): Array<[Id, Base64]>;

	deleteByUserId(userId: Id): void;
}

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
		this._credentialsStorage.store(credentials.userId, encryptedCredentials)
	}

	async getCredentialsByUserId(userId: Id): Promise<Credentials | null> {
		const userIdAndCredentials = this._credentialsStorage.loadByUserId(userId)
		if (!Array.isArray(userIdAndCredentials)) {
			return null
		}
		return this._credentialsEncryption.decrypt(userIdAndCredentials[1])
	}

	async getAllCredentials(): Promise<Array<Credentials>> {
		const encrypted = this._credentialsStorage.loadAll()
		return promiseMap(encrypted, (encryptedItem) => this._credentialsEncryption.decrypt(encryptedItem[1]))
	}

	/**
	 * Returns the stored credentials of all internal users, i.e. users that have a "real" tutanota account and not the ones that have a
	 * secure external mailbox.
	 */
	async getAllInternal(): Promise<Array<Credentials>> {
		const allCredentials = await this.getAllCredentials()
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

