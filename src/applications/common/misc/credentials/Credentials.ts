import { ProgrammingError } from "@tutao/app-env"
import { UnencryptedCredentials } from "@tutao/native-bridge/generatedIpc/types"

import { Credentials } from "../../../../platform-kit/network/types"

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
