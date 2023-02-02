/* generated file, don't edit. */

import { ImapSyncState } from "./ImapSyncState.js"
/**
 * Facade implemented by the native desktop client starting and stopping an IMAP import.
 */
export interface ImapImportSystemFacade {
	/**
	 * Start the IMAP import.
	 */
	startImport(imapSyncState: ImapSyncState): Promise<void>

	/**
	 * Stop a running IMAP import.
	 */
	stopImport(): Promise<void>
}
