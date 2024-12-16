import { ImporterApi, LocalImportState, TutaCredentials } from "../../../../packages/node-mimimi/dist/binding.cjs"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../misc/credentials/CredentialType.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { NativeMailImportFacade } from "../../native/common/generatedipc/NativeMailImportFacade"
import { createImportMailState, ImportMailState } from "../../api/entities/tutanota/TypeRefs.js"
import { GENERATED_MIN_ID } from "../../api/common/utils/EntityUtils.js"

export class DesktopMailImportFacade implements NativeMailImportFacade {
	private shouldStopImport: boolean = false
	public localImportState: Map<Id, ImportMailState> = new Map()

	constructor(private readonly win: ApplicationWindow) {
		ImporterApi.initLog()
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

		await fileImporter.startImport(this.importStateCallback)
	}

	importStateCallback(localState: LocalImportState) {
		if (localState.remoteStateElementId != GENERATED_MIN_ID) {
			this.localImportState.set(localState.remoteStateElementId, DesktopMailImportFacade.localStateAsRemote(localState))
		}

		return {
			shouldStop: this.shouldStopImport,
		}
	}

	async stopImport(): Promise<void> {
		this.shouldStopImport = true
	}

	public static localStateAsRemote(localImportState: LocalImportState): ImportMailState {
		return createImportMailState({
			failedMails: localImportState.failedCount.toString(),
			successfulMails: localImportState.successCount.toString(),
			targetFolder: ["fake-id", "fake-id"],
			status: localImportState.currentStatus.toString(),
			importedMails: "fake-id",
		})
	}
}
