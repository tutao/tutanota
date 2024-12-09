import { ImporterApi, TutaCredentials } from "../../../../packages/node-mimimi/dist/binding.cjs"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../misc/credentials/CredentialType.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { NativeMailImportFacade } from "../../native/common/generatedipc/NativeMailImportFacade"

export class DesktopMailImportFacade implements NativeMailImportFacade {
	constructor(private readonly win: ApplicationWindow) {
		ImporterApi.initLog()
	}

	async setupImapImport(apiUrl: string, unencTutaCredentials: UnencryptedCredentials): Promise<void> {
		// not yet implemented
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
	): Promise<void> {
		const tutaCredentials: TutaCredentials = {
			accessToken: unencTutaCredentials?.accessToken,
			isInternalCredential: unencTutaCredentials.credentialInfo.type === CredentialType.Internal,
			encryptedPassphraseKey: unencTutaCredentials.encryptedPassphraseKey ? Array.from(unencTutaCredentials.encryptedPassphraseKey) : [],
			login: unencTutaCredentials.credentialInfo.login,
			userId: unencTutaCredentials.credentialInfo.userId,
			apiUrl: apiUrl,
			clientVersion: env.versionNumber,
		}

		const targetFolderIdTuple: [string, string] = [targetFolderId[0], targetFolderId[1]]
		const fileImporter = await ImporterApi.createFileImporter(tutaCredentials, targetOwnerGroup, targetFolderIdTuple, filePaths)
		await fileImporter.continueImport()
	}
}
