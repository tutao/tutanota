import { ImapAccountSyncState, ImapFolderSyncState } from "@tutao/entities/tutanota"
import { ImapFacade } from "./ImapFacade"
import { InitializeImapImportParams } from "../../../../../mail-app/workerUtils/imapimport/ImapImporter"
import { assertWorkerOrNode } from "@tutao/app-env"

assertWorkerOrNode()

export class AdminImapFacade {
	constructor(private readonly imapFacadeFactory: (userId: Id) => Promise<ImapFacade>) {}

	async initializeImapImportForUser(
		params: InitializeImapImportParams,
		userId: Id,
	): Promise<{ imapAccountSyncState: ImapAccountSyncState; initialFolderSyncStates: ImapFolderSyncState[] }> {
		const imapFacade = await this.imapFacadeFactory(userId)
		return imapFacade.initializeImapImport(params)
	}
}
