import { ImporterApi, LocalImportState as LocalImportState, TutaCredentials } from "../../../../packages/node-mimimi/dist/binding.cjs"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../misc/credentials/CredentialType.js"
import { NativeMailImportFacade } from "../../native/common/generatedipc/NativeMailImportFacade"
import { elementIdPart, GENERATED_MIN_ID, listIdPart } from "../../api/common/utils/EntityUtils.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { MailImportFacade } from "../../native/common/generatedipc/MailImportFacade.js"

export class DesktopMailImportFacade implements NativeMailImportFacade {
	private stoppedImportQueues: Map<Id, boolean> = new Map()
	private configDirectory: string

	constructor(private readonly win: ApplicationWindow, configDirectory: string) {
		ImporterApi.initLog()
		this.configDirectory = configDirectory
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
		const fileImporter = await ImporterApi.createFileImporter(tutaCredentials, targetOwnerGroup, targetFolderIdTuple, filePaths, this.configDirectory)
		await fileImporter.startImport((localState: LocalImportState) => {
			return DesktopMailImportFacade.importStateCallback(this.win.mailImportFacade, this.stoppedImportQueues, localState)
		})
	}

	static async importStateCallback(mailImportFacade: MailImportFacade, stoppedImportQueues: Map<Id, boolean>, localState: LocalImportState) {
		await mailImportFacade.onNewLocalImportMailState({
			remoteStateId: [localState.remoteStateId.listId, localState.remoteStateId.elementId],
			status: localState.currentStatus,
			start_timestamp: localState.startTimestamp,
			totalMails: localState.totalCount,
			successfulMails: localState.successCount,
			failedMails: localState.failedCount,
		})

		const shouldStop = stoppedImportQueues.get(localState.remoteStateId.elementId) ?? false
		stoppedImportQueues.delete(localState.remoteStateId.elementId)

		return {
			shouldStop: shouldStop,
		}
	}

	async stopImport(importMailStateElementId: Id): Promise<void> {
		this.stoppedImportQueues.set(importMailStateElementId, true)
	}

	async getResumableImportStateId(): Promise<IdTuple> {
		const resumableImportStateIdPromise = ImporterApi.getResumableImportStateId(this.configDirectory)
		let id = await resumableImportStateIdPromise
		return [id.listId, id.elementId]
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

		const fileImporter = await ImporterApi.resumeFileImport(tutaCredentials, importMailStateId, this.configDirectory)
		await fileImporter.startImport((localState: LocalImportState) => {
			return DesktopMailImportFacade.importStateCallback(this.win.mailImportFacade, this.stoppedImportQueues, localState)
		})
	}
}
