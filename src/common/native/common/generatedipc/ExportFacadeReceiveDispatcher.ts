/* generated file, don't edit. */

import { MailBundle } from "./MailBundle.js"
import { DataFile } from "./DataFile.js"
import { ExportFacade } from "./ExportFacade.js"

export class ExportFacadeReceiveDispatcher {
	constructor(private readonly facade: ExportFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "mailToMsg": {
				const bundle: MailBundle = arg[0]
				const fileName: string = arg[1]
				return this.facade.mailToMsg(bundle, fileName)
			}
			case "saveToExportDir": {
				const file: DataFile = arg[0]
				return this.facade.saveToExportDir(file)
			}
			case "startNativeDrag": {
				const fileNames: ReadonlyArray<string> = arg[0]
				return this.facade.startNativeDrag(fileNames)
			}
			case "checkFileExistsInExportDir": {
				const fileName: string = arg[0]
				return this.facade.checkFileExistsInExportDir(fileName)
			}
		}
	}
}
