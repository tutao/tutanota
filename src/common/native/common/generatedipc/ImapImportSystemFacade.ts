/* generated file, don't edit. */

import { ImapSyncState } from "./ImapSyncState.js"
import { ImapError } from "./ImapError.js"
/**
 * Facade implemented by the native desktop client starting and stopping an IMAP import.
 */
export interface ImapImportSystemFacade {
	/**
	 * Start the IMAP import.
	 */
	startImport(imapSyncState: ImapSyncState): Promise<ImapError | null>

	/**
	 * Stop a running IMAP import.
	 */
	stopImport(): Promise<void>
}
