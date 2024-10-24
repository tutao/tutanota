import { createFileImporter, ImportState, TutaCredentials, TutaCredentialType } from "@tutao/node-mimimi"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../misc/credentials/CredentialType.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { MailImportFacade } from "../../native/common/generatedipc/MailImportFacade"

export class DesktopMailImportFacade implements MailImportFacade {
	constructor(private readonly win: ApplicationWindow) {}

	async setupImapImport(apiUrl: string, unencryptedTutaCredentials: UnencryptedCredentials): Promise<void> {
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

			//const importCredentials = ImportCredentials.setup(tutaCredentials, imapCredentials)
			//const importerObj = await importCredentials.login()

			//console.log(importerObj)
		} catch (e) {
			console.log(e)
		}
	}

	startImapImport(): Promise<void> {
		throw new Error("Method not implemented.")
	}

	stopImapImport(): Promise<void> {
		throw new Error("Method not implemented.")
	}

	async importFromFiles(apiUrl: string, unencryptedTutaCredentials: UnencryptedCredentials, filePaths: Array<string>, targetFolder: string): Promise<string> {
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

		const importStatusList = await Promise.all(
			filePaths.map(async (filePath) => {
				const isMboxFile = filePath.endsWith(".mbox")
				const fileImporter = await createFileImporter(unencryptedTutaCredentials.credentialInfo.login, tutaCredentials, filePath, isMboxFile)
				return fileImporter.continueImportNapi()
			}),
		)
		let importSuccessful = importStatusList.every((importStatus) => importStatus.state == ImportState.Finished)
		return importSuccessful ? "importSuccessful" : "importFailure"
	}
}
