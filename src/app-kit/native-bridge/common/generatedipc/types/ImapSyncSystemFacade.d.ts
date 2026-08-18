/* generated file, don't edit. */

import { ImapSyncContext } from "../types/ImapSyncContext"
import { ImapCredentials } from "../types/ImapCredentials"
import { ImapGetMailboxResult } from "../types/ImapGetMailboxResult"
import { ImapVerifyConnectionResult } from "../types/ImapVerifyConnectionResult"
/**
 * Facade implemented by the native desktop client starting and stopping an IMAP sync.
 */
export interface ImapSyncSystemFacade {
	/**
	 * Start the IMAP sync for a specific account.
	 */
	startSync(accountSyncId: IdTuple, imapSyncContext: ImapSyncContext): Promise<void>

	/**
	 * Fetches the folders from the IMAP server, to be used for the folder mapping step
	 */
	getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ImapGetMailboxResult>

	/**
	 * Verifies that a connection to the IMAP server can be established with the given credentials, without listing mailboxes.
	 */
	verifyImapConnection(imapCredentials: ImapCredentials): Promise<ImapVerifyConnectionResult>

	/**
	 * Stop a specific running IMAP sync.
	 */
	stopSync(accountSyncId: IdTuple): Promise<void>
}
