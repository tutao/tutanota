/* generated file, don't edit. */

import { DesktopSystemFacade } from "./DesktopSystemFacade.js"

export class DesktopSystemFacadeReceiveDispatcher {
	constructor(private readonly facade: DesktopSystemFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "openNewWindow": {
				return this.facade.openNewWindow()
			}
			case "focusApplicationWindow": {
				return this.facade.focusApplicationWindow()
			}
			case "sendSocketMessage": {
				const message: string = arg[0]
				return this.facade.sendSocketMessage(message)
			}
		}
	}
}
