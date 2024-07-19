import { Base64, Base64Url } from "@tutao/tutanota-utils"
import { CredentialType } from "./CredentialType.js"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"

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

export function credentialsToUnencrypted(credentials: Credentials, databaseKey: Uint8Array | null): UnencryptedCredentials {
	if (credentials.encryptedPassword == null) {
		throw new ProgrammingError("Credentials->UnencryptedCredentials encryptedPassword and encryptedPassphraseKey are both null!")
	}

	return {
		credentialInfo: {
			login: credentials.login,
			type: credentials.type,
			userId: credentials.userId,
		},
		encryptedPassword: credentials.encryptedPassword,
		encryptedPassphraseKey: credentials.encryptedPassphraseKey,
		accessToken: credentials.accessToken,
		databaseKey: databaseKey,
	}
}

export function unencryptedToCredentials(unencryptedCredentials: UnencryptedCredentials): Credentials {
	return {
		login: unencryptedCredentials.credentialInfo.login,
		userId: unencryptedCredentials.credentialInfo.userId,
		type: unencryptedCredentials.credentialInfo.type,
		accessToken: unencryptedCredentials.accessToken,
		encryptedPassword: unencryptedCredentials.encryptedPassword,
		encryptedPassphraseKey: unencryptedCredentials.encryptedPassphraseKey,
	}
}
