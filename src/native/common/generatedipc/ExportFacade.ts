/* generated file, don't edit. */

import {MailBundle} from "./MailBundle.js"
import {DataFile} from "./DataFile.js"
export interface ExportFacade {

	mailToMsg(
		bundle: MailBundle,
		fileName: string,
	): Promise<DataFile>
	
	saveToExportDir(
		file: DataFile,
	): Promise<void>
	
	startNativeDrag(
		fileNames: ReadonlyArray<string>,
	): Promise<void>
	
	checkFileExistsInExportDir(
		fileName: string,
	): Promise<boolean>
	
}
