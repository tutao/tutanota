/* generated file, don't edit. */

import { ElectronResult } from "./ElectronResult.js"
import { ErrorInfo } from "./ErrorInfo.js"
import { NativeShortcut } from "./NativeShortcut.js"
import { DesktopFacade } from "./DesktopFacade.js"

export class DesktopFacadeReceiveDispatcher {
	constructor(private readonly facade: DesktopFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "print": {
				return this.facade.print()
			}
			case "showSpellcheckDropdown": {
				return this.facade.showSpellcheckDropdown()
			}
			case "openFindInPage": {
				return this.facade.openFindInPage()
			}
			case "applySearchResultToOverlay": {
				const result: ElectronResult | null = arg[0]
				return this.facade.applySearchResultToOverlay(result)
			}
			case "reportError": {
				const errorInfo: ErrorInfo = arg[0]
				return this.facade.reportError(errorInfo)
			}
			case "updateTargetUrl": {
				const url: string = arg[0]
				const appPath: string = arg[1]
				return this.facade.updateTargetUrl(url, appPath)
			}
			case "openCustomer": {
				const mailAddress: string | null = arg[0]
				return this.facade.openCustomer(mailAddress)
			}
			case "addShortcuts": {
				const shortcuts: ReadonlyArray<NativeShortcut> = arg[0]
				return this.facade.addShortcuts(shortcuts)
			}
			case "appUpdateDownloaded": {
				return this.facade.appUpdateDownloaded()
			}
		}
	}
}
