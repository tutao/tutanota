import { Nullable } from "@tutao/lang-api"

export const enum CredentialType {
	Internal = "internal",
	External = "external",
}

/** Data obtained after logging in. */
export interface Credentials {
	/**
	 * Identifier which we use for logging in.
	 * Email address used to log in for internal users, userId for external users.
	 * */
	login: string

	/** Session#accessKey encrypted password. Is set when session is persisted. */
	encryptedPassword: Nullable<Base64>
	encryptedPassphraseKey: Uint8Array<ArrayBuffer> | null
	accessToken: Base64Url
	userId: Id
	type: CredentialType
}
