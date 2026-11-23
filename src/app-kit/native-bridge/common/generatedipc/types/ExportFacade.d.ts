/* generated file, don't edit. */

import { MailBundle } from "../types/MailBundle"
import { DataFile } from "../types/DataFile"
import { MailboxExportState } from "../types/MailboxExportState"
export interface ExportFacade {
	/**
	 * Convert mail to .msg format.
	 */
	mailToMsg(bundle: MailBundle, fileName: string): Promise<DataFile>

	saveToExportDir(file: DataFile): Promise<void>

	/**
	 * Sets specified fileNames as the current 'drag' items.
	 */
	startNativeDrag(fileNames: ReadonlyArray<string>): Promise<void>

	checkFileExistsInExportDir(fileName: string): Promise<boolean>

	getMailboxExportState(userId: string): Promise<MailboxExportState | null>

	endMailboxExport(userId: string): Promise<MailboxExportState | null>

	/**
	 * Pick a directory for storing the export data and persist the export state. exportFolderStructure is persisted with the export state. Folders are created lazily when individual mails are saved.
	 */
	startMailboxExport(userId: string, mailboxId: string, mailBagId: string, mailId: string, exportFolderStructure: boolean): Promise<void>

	/**
	 * Save current state of the export and write export data to the export directory
	 */
	saveMailboxExport(bundle: MailBundle, userId: string, mailBagId: string, mailId: string, folderPath: ReadonlyArray<string>): Promise<void>

	/**
	 * Save a current mail as a failed export
	 */
	saveMailboxExportFailure(userId: string, mailBagId: string, mailId: ReadonlyArray<IdTuple>): Promise<void>

	clearExportState(userId: string): Promise<void>

	openExportDirectory(userId: string): Promise<void>
}
