/* generated file, don't edit. */

import { MailBundle } from "./MailBundle.js"
import { DataFile } from "./DataFile.js"
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
}
