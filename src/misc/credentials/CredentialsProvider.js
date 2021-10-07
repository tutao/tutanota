// @flow

export type PersistentCredentials = {|
	credentialInfo: CredentialsInfo,
	accessToken: Base64,
	encryptedPassword: Base64Url,
|}

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
	encrypt(credentials: Credentials): Promise<PersistentCredentials>;

	decrypt(encryptedCredentials: PersistentCredentials): Promise<Credentials>;
}

/**
 * Interface for storing credentials.
 */
export interface CredentialsStorage {
	store(encryptedCredentials: PersistentCredentials): void;

	loadByUserId(userId: Id): PersistentCredentials | null;

	loadAll(): Array<PersistentCredentials>;

	deleteByUserId(userId: Id): void;
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
}

export class CredentialsProvider implements ICredentialsProvider {
	+_credentialsEncryption: CredentialsEncryption
	+_credentialsStorage: CredentialsStorage

	constructor(credentialsEncryption: CredentialsEncryption, storage: CredentialsStorage) {
		this._credentialsEncryption = credentialsEncryption
		this._credentialsStorage = storage
	}

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

}

