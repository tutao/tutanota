/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
import { ResumableImport } from "./ResumableImport.js"
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
	): Promise<IdTuple>

	/**
	 * Sets action for next import iteration
	 */
	setAction(mailboxId: string, progressAction: number): Promise<void>

	/**
	 * @returns the mail import state id of the import that might be resumed
	 */
	getResumeableImport(mailboxId: string): Promise<ResumableImport>

	/**
	 * resumes the import for a previously paused import
	 */
	resumeFileImport(mailboxId: string, apiUrl: string, unencryptedTutaCredentials: UnencryptedCredentials, importStateId: IdTuple): Promise<void>

	/**
	 * Waits until the current import is finished. Will throw an error if the import fails.
	 */
	waitForRunningImport(mailboxId: string): Promise<void>

	deinitLogger(): Promise<void>
}
