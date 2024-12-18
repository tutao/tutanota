/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
/**
 * Facade implemented by the native desktop client enabling mail imports, both from files, and via IMAP.
 */
export interface NativeMailImportFacade {
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

	/**
	 * Stop a running import.
	 */
	stopImport(importStateId: string): Promise<void>

	/**
	 * @returns the mail import state id of the import that might be resumed
	 */
	getResumableImportStateId(): Promise<IdTuple>
}
