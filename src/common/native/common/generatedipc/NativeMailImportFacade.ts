/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
/**
 * Facade implemented by the native desktop client enabling mail imports, both from files, and via IMAP.
 */
export interface NativeMailImportFacade {
	/**
	 * Stop a running import.
	 */
	stopImport(importStateId: string): Promise<void>

	/**
	 * Import multiple mails from .eml or .mbox files.
	 */
	importFromFiles(
		apiUrl: string,
		unencryptedTutaCredentials: UnencryptedCredentials,
		targetOwnerGroup: string,
		targetFolder: ReadonlyArray<string>,
		filePaths: ReadonlyArray<string>,
	): Promise<void>
}
