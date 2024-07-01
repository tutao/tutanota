/* generated file, don't edit. */

import { CommonSystemFacade } from "./CommonSystemFacade.js"

export class CommonSystemFacadeReceiveDispatcher {
	constructor(private readonly facade: CommonSystemFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "initializeRemoteBridge": {
				return this.facade.initializeRemoteBridge()
			}
			case "reload": {
				const query: Record<string, string> = arg[0]
				return this.facade.reload(query)
			}
			case "getLog": {
				return this.facade.getLog()
			}
		}
	}
}
