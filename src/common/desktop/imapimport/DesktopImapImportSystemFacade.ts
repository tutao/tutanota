import { ImapImportSystemFacade } from "../../native/common/generatedipc/ImapImportSystemFacade.js"
import { ImapCredentials, ImportCredentials, TutaCredentials, TutaCredentialType } from "@tutao/node-mimimi"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../misc/credentials/CredentialType.js"
import { getApiBaseUrl } from "../../api/common/Env.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { locator } from "../../api/main/CommonLocator.js"

export class DesktopImapImportSystemFacade implements ImapImportSystemFacade {
	constructor(private readonly win: ApplicationWindow) {}

	async setup(apiUrl: string, unencryptedTutaCredentials: UnencryptedCredentials, imapCredentials: ImapCredentials): Promise<void> {
		try {
			const tutaCredentials: TutaCredentials = {
				accessToken: unencryptedTutaCredentials?.accessToken,
				credentialType:
					unencryptedTutaCredentials.credentialInfo.type == CredentialType.Internal ? TutaCredentialType.Internal : TutaCredentialType.External,
				encryptedPassphraseKey: unencryptedTutaCredentials.encryptedPassphraseKey ? Array.from(unencryptedTutaCredentials.encryptedPassphraseKey) : [],
				login: unencryptedTutaCredentials.credentialInfo.login,
				userId: unencryptedTutaCredentials.credentialInfo.userId,
				apiUrl: apiUrl,
				clientVersion: env.versionNumber,
			}

			const importCredentials = ImportCredentials.setup(tutaCredentials, imapCredentials)
			const importerObj = await importCredentials.login()

			console.log(importerObj)
		} catch (e) {
			console.log(e)
		}
	}

	startImport(): Promise<void> {
		throw new Error("Method not implemented.")
	}

	stopImport(): Promise<void> {
		throw new Error("Method not implemented.")
	}
}
