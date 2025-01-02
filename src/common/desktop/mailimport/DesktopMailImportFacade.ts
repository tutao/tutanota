import { ImporterApi, TutaCredentials } from "@tutao/node-mimimi"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../misc/credentials/CredentialType.js"
import { NativeMailImportFacade } from "../../native/common/generatedipc/NativeMailImportFacade"
import { elementIdPart, listIdPart } from "../../api/common/utils/EntityUtils.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { ResumableImport } from "../../native/common/generatedipc/ResumableImport.js"
import { LocalImportMailState } from "../../native/common/generatedipc/LocalImportMailState.js"

export class DesktopMailImportFacade implements NativeMailImportFacade {
	private configDirectory: string

	constructor(private readonly win: ApplicationWindow, configDirectory: string) {
		ImporterApi.initLog()
		this.configDirectory = configDirectory
	}

	async deinitLogger() {
		ImporterApi.deinitLog()
	}

	async startFileImport(
		mailboxId: string,
		apiUrl: string,
		unencTutaCredentials: UnencryptedCredentials,
		targetOwnerGroup: string,
		targetFolderId: IdTuple,
		filePaths: Array<string>,
	): Promise<void> {
		const tutaCredentials = this.createTutaCredentials(unencTutaCredentials, apiUrl)

		const targetFolderIdTuple: [string, string] = [targetFolderId[0], targetFolderId[1]]

		await ImporterApi.startFileImport(mailboxId, tutaCredentials, targetOwnerGroup, targetFolderIdTuple, filePaths, this.configDirectory)
	}

	private createTutaCredentials(unencTutaCredentials: UnencryptedCredentials, apiUrl: string) {
		const tutaCredentials: TutaCredentials = {
			accessToken: unencTutaCredentials?.accessToken,
			isInternalCredential: unencTutaCredentials.credentialInfo.type === CredentialType.Internal,
			encryptedPassphraseKey: unencTutaCredentials.encryptedPassphraseKey ? Array.from(unencTutaCredentials.encryptedPassphraseKey) : [],
			login: unencTutaCredentials.credentialInfo.login,
			userId: unencTutaCredentials.credentialInfo.userId,
			apiUrl: apiUrl,
			clientVersion: env.versionNumber,
		}
		return tutaCredentials
	}

	async getImportState(mailboxId: string): Promise<LocalImportMailState | null> {
		let localState = await ImporterApi.getImportState(mailboxId)
		if (!localState) {
			return null
		}

		return {
			remoteStateId: [localState.remoteStateId.listId, localState.remoteStateId.elementId],
			status: localState.currentStatus,
			start_timestamp: localState.startTimestamp,
			totalMails: localState.totalCount,
			successfulMails: localState.successCount,
			failedMails: localState.failedCount,
		}
	}

	async setProgressAction(mailboxId: string, apiUrl: string, unencTutaCredentials: UnencryptedCredentials, progressAction: number) {
		return ImporterApi.setProgressAction(mailboxId, this.createTutaCredentials(unencTutaCredentials, apiUrl), progressAction, this.configDirectory)
	}

	async getResumeableImport(mailboxId: string): Promise<ResumableImport> {
		const resumableImport = await ImporterApi.getResumableImport(this.configDirectory, mailboxId)
		return {
			remoteStateId: [resumableImport.remoteStateId.listId, resumableImport.remoteStateId.elementId],
			remainingEmlCount: resumableImport.remainingEmlCount,
		}
	}

	async resumeFileImport(mailboxId: string, apiUrl: string, unencTutaCredentials: UnencryptedCredentials, importStateId: IdTuple): Promise<void> {
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

		await ImporterApi.resumeFileImport(mailboxId, tutaCredentials, importMailStateId, this.configDirectory)
	}
}
