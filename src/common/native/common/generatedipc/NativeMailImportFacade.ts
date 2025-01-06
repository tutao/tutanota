/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
import { ResumableImport } from "./ResumableImport.js"
import { LocalImportMailState } from "./LocalImportMailState.js"

/**
 * Facade implemented by the native desktop client enabling mail imports, both from files, and via IMAP.
 */
export interface NativeMailImportFacade {
	/**
	 * Import multiple mails from .eml or .mbox files.
	 */
	startFileImport(
		mailboxId: string,
		apiUrl: string,
		unencryptedTutaCredentials: UnencryptedCredentials,
		targetOwnerGroup: string,
		targetFolder: ReadonlyArray<string>,
		filePaths: ReadonlyArray<string>,
	): Promise<void>

	/**
	 * Sets progress action to continue for next callback
	 */
	setContinueProgressAction(mailboxId: string): Promise<void>

	/**
	 * Sets progress action to stop for next callback
	 */
	setStopProgressAction(mailboxId: string): Promise<void>

	/**
	 * Sets progress action to pause for next callback
	 */
	setPausedProgressAction(mailboxId: string): Promise<void>

	/**
	 * @returns the mail import state id of the import that might be resumed
	 */
	getResumeableImport(mailboxId: string): Promise<ResumableImport>

	/**
	 * resumes the import for a previously paused import
	 */
	resumeFileImport(mailboxId: string, apiUrl: string, unencryptedTutaCredentials: UnencryptedCredentials, importStateId: IdTuple): Promise<void>

	/**
	 * Gets LocalImportState from Importer
	 */
	getImportState(mailboxId: string): Promise<LocalImportMailState | null>

	deinitLogger(): Promise<void>
}
