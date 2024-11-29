/* generated file, don't edit. */

import { MailBundle } from "./MailBundle.js"
import { DataFile } from "./DataFile.js"
import { MailboxExportState } from "./MailboxExportState.js"
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

	endMailboxExport(userId: string): Promise<void>

	/**
	 * Pick a directory for storing the export data and persist the export state
	 */
	startMailboxExport(userId: string, mailboxId: string, mailBagId: string, mailId: string): Promise<void>

	/**
	 * Save current state of the export and write export data to the export directory
	 */
	saveMailboxExport(bundle: MailBundle, userId: string, mailBagId: string, mailId: string): Promise<void>

	clearExportState(userId: string): Promise<void>

	openExportDirectory(userId: string): Promise<void>
}
