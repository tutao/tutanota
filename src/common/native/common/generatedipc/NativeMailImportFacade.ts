/* generated file, don't edit. */

import { UnencryptedCredentials } from "./UnencryptedCredentials.js"
/**
 * Facade implemented by the native desktop client enabling mail imports, both from files, and via IMAP.
 */
export interface NativeMailImportFacade {
	/**
	 * @returns the mail import state id of the import that might be resumed
	 */
	getResumableImport(mailboxId: string, targetOwnerGroup: string, unencryptedTutaCredentials: UnencryptedCredentials, apiUrl: string): Promise<IdTuple | null>

	/**
	 * set up a new import state for the given parameters and return the ID of the new state entity on the server
	 */
	prepareNewImport(
		mailboxId: string,
		targetOwnerGroup: string,
		targetMailSet: ReadonlyArray<string>,
		filePaths: ReadonlyArray<string>,
		unencryptedTutaCredentials: UnencryptedCredentials,
		apiUrl: string,
	): Promise<IdTuple>

	/**
	 * Sets progress action for next import iteration
	 */
	setProgressAction(mailboxId: string, importProgressAction: number): Promise<void>

	/**
	 * await to receive any errors and import state changes that must be handled locally
	 */
	setAsyncErrorHook(mailboxId: string): Promise<void>
}
