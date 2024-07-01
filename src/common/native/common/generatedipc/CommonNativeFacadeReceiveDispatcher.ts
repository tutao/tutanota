/* generated file, don't edit. */

import { CommonNativeFacade } from "./CommonNativeFacade.js"

export class CommonNativeFacadeReceiveDispatcher {
	constructor(private readonly facade: CommonNativeFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "createMailEditor": {
				const filesUris: ReadonlyArray<string> = arg[0]
				const text: string = arg[1]
				const addresses: ReadonlyArray<string> = arg[2]
				const subject: string = arg[3]
				const mailToUrlString: string = arg[4]
				return this.facade.createMailEditor(filesUris, text, addresses, subject, mailToUrlString)
			}
			case "openMailBox": {
				const userId: string = arg[0]
				const address: string = arg[1]
				const requestedPath: string | null = arg[2]
				return this.facade.openMailBox(userId, address, requestedPath)
			}
			case "openCalendar": {
				const userId: string = arg[0]
				return this.facade.openCalendar(userId)
			}
			case "showAlertDialog": {
				const translationKey: string = arg[0]
				return this.facade.showAlertDialog(translationKey)
			}
			case "invalidateAlarms": {
				return this.facade.invalidateAlarms()
			}
			case "updateTheme": {
				return this.facade.updateTheme()
			}
			case "promptForNewPassword": {
				const title: string = arg[0]
				const oldPassword: string | null = arg[1]
				return this.facade.promptForNewPassword(title, oldPassword)
			}
			case "promptForPassword": {
				const title: string = arg[0]
				return this.facade.promptForPassword(title)
			}
			case "handleFileImport": {
				const filesUris: ReadonlyArray<string> = arg[0]
				return this.facade.handleFileImport(filesUris)
			}
		}
	}
}
