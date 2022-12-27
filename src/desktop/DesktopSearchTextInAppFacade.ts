import { SearchTextInAppFacade } from "../native/common/generatedipc/SearchTextInAppFacade.js"
import { ApplicationWindow } from "./ApplicationWindow.js"
import { Result } from "../native/common/generatedipc/Result.js"

export class DesktopSearchTextInAppFacade implements SearchTextInAppFacade {
	constructor(private readonly window: ApplicationWindow) {}

	findInPage(searchTerm: string, forward: boolean, matchCase: boolean, findNext: boolean): Promise<Result | null> {
		return this.window.findInPage(searchTerm, forward, matchCase, findNext)
	}

	async setSearchOverlayState(isFocused: boolean, force: boolean): Promise<void> {
		return this.window.setSearchOverlayState(isFocused, force)
	}

	async stopFindInPage(): Promise<void> {
		return this.window.stopFindInPage()
	}
}
