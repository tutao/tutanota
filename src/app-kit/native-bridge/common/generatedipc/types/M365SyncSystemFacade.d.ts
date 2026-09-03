/* generated file, don't edit. */

import { ImapSyncContext } from "../types/ImapSyncContext"
import { ImapCredentials } from "../types/ImapCredentials"
import { ImapMailbox } from "../types/ImapMailbox"
/**
 * Facade implemented by the native desktop client starting and stopping an Outlook (Microsoft Graph) sync.
 */
export interface M365SyncSystemFacade {
	/**
	 * Start the Microsoft Graph sync for a specific account.
	 */
	startSync(accountSyncId: IdTuple, imapSyncContext: ImapSyncContext): Promise<void>

	/**
	 * Fetches the mail folders from Microsoft Graph, to be used for the folder mapping step
	 */
	getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ReadonlyArray<ImapMailbox>>

	/**
	 * Stop a specific running Microsoft Graph sync.
	 */
	stopSync(accountSyncId: IdTuple): Promise<void>
}
