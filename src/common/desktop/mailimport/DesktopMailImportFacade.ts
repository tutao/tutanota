import { ImporterApi, TutaCredentials, TutaCredentialType } from "../../../../packages/node-mimimi/dist/binding.cjs"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../misc/credentials/CredentialType.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { NativeMailImportFacade } from "../../native/common/generatedipc/NativeMailImportFacade"

export class DesktopMailImportFacade implements NativeMailImportFacade {
	constructor(private readonly win: ApplicationWindow) {
		ImporterApi.initLog()
	}

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

	async importFromFiles(
		apiUrl: string,
		unencTutaCredentials: UnencryptedCredentials,
		targetOwnerGroup: string,
		targetFolderId: IdTuple,
		filePaths: Array<string>,
	): Promise<string> {
		const tutaCredentials: TutaCredentials = {
			accessToken: unencTutaCredentials?.accessToken,
			credentialType: unencTutaCredentials.credentialInfo.type == CredentialType.Internal ? TutaCredentialType.Internal : TutaCredentialType.External,
			encryptedPassphraseKey: unencTutaCredentials.encryptedPassphraseKey ? Array.from(unencTutaCredentials.encryptedPassphraseKey) : [],
			login: unencTutaCredentials.credentialInfo.login,
			userId: unencTutaCredentials.credentialInfo.userId,
			apiUrl: apiUrl,
			clientVersion: env.versionNumber,
		}

		const targetFolderIdTuple: [string, string] = [targetFolderId[0], targetFolderId[1]]
		const fileImporter = await ImporterApi.createFileImporter(tutaCredentials, targetOwnerGroup, targetFolderIdTuple, filePaths)
		const importStatus = await fileImporter.continueImport()
		return importStatus ? "importSuccessful" : "importFailure"
	}
}
