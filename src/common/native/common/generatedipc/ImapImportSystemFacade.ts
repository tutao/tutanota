/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
import { ImapCredentials } from "./ImapCredentials.js"
/**
 * Facade implemented by the native desktop client starting and stopping an IMAP import.
 */
export interface ImapImportSystemFacade {
	/**
	 * Initializing the IMAP import.
	 */
	setup(apiUrl: string, unencryptedTutaCredentials: UnencryptedCredentials, imapCredentials: ImapCredentials): Promise<void>

	/**
	 * Start the IMAP import.
	 */
	startImport(): Promise<void>

	/**
	 * Stop a running IMAP import.
	 */
	stopImport(): Promise<void>
}
