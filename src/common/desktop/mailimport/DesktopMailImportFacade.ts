import { ImporterApi, ImportProgressAction, LocalImportState as LocalImportState, TutaCredentials } from "../../../../packages/node-mimimi/dist/binding.cjs"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../misc/credentials/CredentialType.js"
import { NativeMailImportFacade } from "../../native/common/generatedipc/NativeMailImportFacade"
import { elementIdPart, listIdPart } from "../../api/common/utils/EntityUtils.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { ResumableImport } from "../../native/common/generatedipc/ResumableImport.js"

export class DesktopMailImportFacade implements NativeMailImportFacade {
	private nextCallbackAction: ImportProgressAction | null
	private configDirectory: string
	private importerApi: ImporterApi | null = null

	constructor(private readonly win: ApplicationWindow, configDirectory: string) {
		ImporterApi.initLog()
		this.nextCallbackAction = null
		this.configDirectory = configDirectory
	}

	async deinitLogger() {
		ImporterApi.deinitLog()
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

		this.importerApi = null
		this.importerApi = await ImporterApi.createFileImporter(tutaCredentials, targetOwnerGroup, targetFolderIdTuple, filePaths, this.configDirectory)
		this.nextCallbackAction = ImportProgressAction.Continue
		await this.importerApi.startImport((localImportState: LocalImportState) => {
			return this.importStateCallback(localImportState)
		})
		this.importerApi = null
	}

	async importStateCallback(localState: LocalImportState) {
		this.win.mailImportFacade.onNewLocalImportMailState({
			remoteStateId: [localState.remoteStateId.listId, localState.remoteStateId.elementId],
			status: localState.currentStatus,
			start_timestamp: localState.startTimestamp,
			totalMails: localState.totalCount,
			successfulMails: localState.successCount,
			failedMails: localState.failedCount,
		})

		return {
			action: this.nextCallbackAction,
		}
	}

	async setContinueProgressAction() {
		this.nextCallbackAction = ImportProgressAction.Continue
	}

	async setStopProgressAction(): Promise<void> {
		this.nextCallbackAction = ImportProgressAction.Stop
	}

	async setPausedProgressAction(): Promise<void> {
		this.nextCallbackAction = ImportProgressAction.Pause
	}

	async getResumeableImport(mailboxId: string): Promise<ResumableImport> {
		const resumableImport = await ImporterApi.getResumableImport(this.configDirectory, mailboxId)
		return {
			remoteStateId: [resumableImport.remoteStateId.listId, resumableImport.remoteStateId.elementId],
			remainingEmlCount: resumableImport.remainingEmlCount,
		}
	}

	async resumeImport(apiUrl: string, unencTutaCredentials: UnencryptedCredentials, importStateId: IdTuple): Promise<void> {
		let importMailStateId = {
			listId: listIdPart(importStateId),
			elementId: elementIdPart(importStateId),
		}
		const tutaCredentials: TutaCredentials = {
			accessToken: unencTutaCredentials?.accessToken,
			isInternalCredential: unencTutaCredentials.credentialInfo.type === CredentialType.Internal,
			encryptedPassphraseKey: unencTutaCredentials.encryptedPassphraseKey ? Array.from(unencTutaCredentials.encryptedPassphraseKey) : [],
			login: unencTutaCredentials.credentialInfo.login,
			userId: unencTutaCredentials.credentialInfo.userId,
			apiUrl: apiUrl,
			clientVersion: env.versionNumber,
		}

		// force napi to drop the previous importer
		this.importerApi = null
		this.importerApi = await ImporterApi.resumeFileImport(tutaCredentials, importMailStateId, this.configDirectory)
		await this.importerApi.startImport((localImportState: LocalImportState) => {
			return this.importStateCallback(localImportState)
		})
		this.importerApi = null
	}
}
