import { ImporterApi, LocalImportState as LocalImportState, TutaCredentials } from "../../../../packages/node-mimimi/dist/binding.cjs"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../misc/credentials/CredentialType.js"
import { NativeMailImportFacade } from "../../native/common/generatedipc/NativeMailImportFacade"
import { GENERATED_MIN_ID } from "../../api/common/utils/EntityUtils.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { MailImportFacade } from "../../native/common/generatedipc/MailImportFacade.js"

export class DesktopMailImportFacade implements NativeMailImportFacade {
	private stoppedImportQueues: Map<Id, boolean> = new Map()

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
		await fileImporter.startImport((localState: LocalImportState) => {
			return DesktopMailImportFacade.importStateCallback(this.win.mailImportFacade, this.stoppedImportQueues, localState)
		})
	}

	static async importStateCallback(mailImportFacade: MailImportFacade, stoppedImportQueues: Map<Id, boolean>, localState: LocalImportState) {
		if (localState.remoteStateId == GENERATED_MIN_ID) {
			return {
				shouldStop: false,
			}
		} else {
			console.log("swear this is defined")
			await mailImportFacade.onNewLocalImportMailState({
				importMailStateElementId: localState.remoteStateId,
				successfulMails: localState.successCount,
				failedMails: localState.failedCount,
				status: localState.currentStatus,
			})

			const shouldStop = stoppedImportQueues.get(localState.remoteStateId) ?? false
			stoppedImportQueues.delete(localState.remoteStateId)

			return {
				shouldStop: shouldStop,
			}
		}
	}

	async stopImport(importMailStateElementId: Id): Promise<void> {
		this.stoppedImportQueues.set(importMailStateElementId, true)
	}
}
