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
			case "getMailboxExportState": {
				const userId: string = arg[0]
				return this.facade.getMailboxExportState(userId)
			}
			case "endMailboxExport": {
				const userId: string = arg[0]
				return this.facade.endMailboxExport(userId)
			}
			case "startMailboxExport": {
				const userId: string = arg[0]
				const mailboxId: string = arg[1]
				const mailBagId: string = arg[2]
				const mailId: string = arg[3]
				return this.facade.startMailboxExport(userId, mailboxId, mailBagId, mailId)
			}
			case "saveMailboxExport": {
				const bundle: MailBundle = arg[0]
				const userId: string = arg[1]
				const mailBagId: string = arg[2]
				const mailId: string = arg[3]
				return this.facade.saveMailboxExport(bundle, userId, mailBagId, mailId)
			}
			case "clearExportState": {
				const userId: string = arg[0]
				return this.facade.clearExportState(userId)
			}
			case "openExportDirectory": {
				const userId: string = arg[0]
				return this.facade.openExportDirectory(userId)
			}
		}
	}
}
