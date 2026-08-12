import { InitializeImapImportParams } from "../../workerUtils/imapimport/ImapImporter.js"
import { ImapAccountSyncState, ImapFolderSyncState } from "@tutao/entities/tutanota"
import { AdminImapFacade } from "../../../common/api/worker/facades/lazy/AdminImapFacade"
import { assertMainOrNode } from "@tutao/app-env"

assertMainOrNode()

/**
 * Controller for customer migration (admin) actions, such as starting an IMAP import
 * on behalf of a user. This is a main-thread class that delegates to the worker's
 * AdminImapFacade.
 */
export class CustomerMigrationController {
	constructor(private readonly adminImapFacade: AdminImapFacade) {}

	/**
	 * Start an IMAP import for a specific user.
	 * @param params The IMAP connection and migration parameters.
	 * @param userId The ID of the target user.
	 * @returns The initial sync state and folder sync states.
	 */
	startImapImport(
		params: InitializeImapImportParams,
		userId: Id,
	): Promise<{ imapAccountSyncState: ImapAccountSyncState; initialFolderSyncStates: ImapFolderSyncState[] }> {
		return this.adminImapFacade.initializeImapImportForUser(params, userId)
	}
}
