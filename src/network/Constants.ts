import { CredentialType } from "@tutao/app-env"

export const enum WsConnectionState {
	connecting,
	connected,
	terminated,
}
export const enum ConnectMode {
	Initial,
	Reconnect,
}

/** Data obtained after logging in. */
export interface Credentials {
	/**
	 * Identifier which we use for logging in.
	 * Email address used to log in for internal users, userId for external users.
	 * */
	login: string

	/** Session#accessKey encrypted password. Is set when session is persisted. */
	encryptedPassword: Base64 | null
	encryptedPassphraseKey: Uint8Array | null
	accessToken: Base64Url
	userId: Id
	type: CredentialType
}
