/* generated file, don't edit. */

import { InterWindowEventFacade } from "./InterWindowEventFacade.js"

export class InterWindowEventFacadeReceiveDispatcher {
	constructor(private readonly facade: InterWindowEventFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "localUserDataInvalidated": {
				const userId: string = arg[0]
				return this.facade.localUserDataInvalidated(userId)
			}
			case "reloadDeviceConfig": {
				return this.facade.reloadDeviceConfig()
			}
		}
	}
}
