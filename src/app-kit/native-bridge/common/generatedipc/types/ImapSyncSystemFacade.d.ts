/* generated file, don't edit. */

import { ImapSyncState } from "../types/ImapSyncState"
import { ImapError } from "../types/ImapError"
import { ImapCredentials } from "../types/ImapCredentials"
import { ImapGetMailboxResult } from "../types/ImapGetMailboxResult"
/**
 * Facade implemented by the native desktop client starting and stopping an IMAP sync.
 */
export interface ImapSyncSystemFacade {
	/**
	 * Start the IMAP sync for a specific account.
	 */
	startSync(accountSyncId: IdTuple, imapSyncState: ImapSyncState): Promise<ImapError | null>

	/**
	 * Fetches the folders from the IMAP server, to be used for the folder mapping step
	 */
	getImapMailboxesFromServer(imapAccount: ImapCredentials): Promise<ImapGetMailboxResult>

	/**
	 * Stop a specific running IMAP sync.
	 */
	stopSync(accountSyncId: IdTuple): Promise<void>
}
