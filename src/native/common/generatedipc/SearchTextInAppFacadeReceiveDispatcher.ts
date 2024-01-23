/* generated file, don't edit. */

import { SearchTextInAppFacade } from "./SearchTextInAppFacade.js"

export class SearchTextInAppFacadeReceiveDispatcher {
	constructor(private readonly facade: SearchTextInAppFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "findInPage": {
				const searchTerm: string = arg[0]
				const forward: boolean = arg[1]
				const matchCase: boolean = arg[2]
				const findNext: boolean = arg[3]
				return this.facade.findInPage(searchTerm, forward, matchCase, findNext)
			}
			case "stopFindInPage": {
				return this.facade.stopFindInPage()
			}
			case "setSearchOverlayState": {
				const isFocused: boolean = arg[0]
				const force: boolean = arg[1]
				return this.facade.setSearchOverlayState(isFocused, force)
			}
		}
	}
}
