/* generated file, don't edit. */

import {ElectronResult} from "./ElectronResult.js"
import {ErrorInfo} from "./ErrorInfo.js"
import {NativeShortcut} from "./NativeShortcut.js"
export interface DesktopFacade {

	print(
	): Promise<void>
	
	showSpellcheckDropdown(
	): Promise<void>
	
	openFindInPage(
	): Promise<void>
	
	applySearchResultToOverlay(
		result: ElectronResult | null,
	): Promise<void>
	
	reportError(
		errorInfo: ErrorInfo,
	): Promise<void>
	
	updateTargetUrl(
		url: string,
		appPath: string,
	): Promise<void>
	
	openCustomer(
		mailAddress: string | null,
	): Promise<void>
	
	addShortcuts(
		shortcuts: ReadonlyArray<NativeShortcut>,
	): Promise<void>
	
	appUpdateDownloaded(
	): Promise<void>
	
}
