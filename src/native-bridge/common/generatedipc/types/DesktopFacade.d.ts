/* generated file, don't edit. */

import { ElectronResult } from "@tutao/native-bridge/generatedIpc/types"
import { ErrorInfo } from "@tutao/native-bridge/generatedIpc/types"
import { NativeShortcut } from "@tutao/native-bridge/generatedIpc/types"
export interface DesktopFacade {
	print(): Promise<void>

	showSpellcheckDropdown(): Promise<void>

	/**
	 * open the in-page search bar
	 */
	openFindInPage(): Promise<void>

	/**
	 * set the search result to be displayed in the search bar
	 */
	applySearchResultToOverlay(result: ElectronResult | null): Promise<void>

	/**
	 * report an error that was stored from the previous run of the app
	 */
	reportError(errorInfo: ErrorInfo): Promise<void>

	/**
	 * Updates the link-reveal on hover when the main thread detects that he hovered url changed. Will _not_ update if hovering a in link app (starts with 2nd argument)
	 */
	updateTargetUrl(url: string, appPath: string): Promise<void>

	/**
	 * Implemented for the admin client.
	 */
	openCustomer(mailAddress: string | null): Promise<void>

	addShortcuts(shortcuts: ReadonlyArray<NativeShortcut>): Promise<void>

	appUpdateDownloaded(): Promise<void>
}
