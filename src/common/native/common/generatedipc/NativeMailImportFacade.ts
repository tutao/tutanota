/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"

/**
 * Facade implemented by the native desktop client enabling mail imports, both from files, and via IMAP.
 */
export interface NativeMailImportFacade {
	/**
	 * Initializing an IMAP import.
	 */
	setupImapImport(apiUrl: string, unencryptedTutaCredentials: UnencryptedCredentials): Promise<void>

	/**
	 * Start an IMAP import.
	 */
	startImapImport(): Promise<void>

	/**
	 * Stop a running IMAP import.
	 */
	stopImapImport(): Promise<void>

	/**
	 * Import multiple mails from .eml or .mbox files.
	 */
	importFromFiles(
		apiUrl: string,
		unencryptedTutaCredentials: UnencryptedCredentials,
		targetOwnerGroup: string,
		targetFolder: ReadonlyArray<string>,
		filePaths: ReadonlyArray<string>,
	): Promise<string>
}
