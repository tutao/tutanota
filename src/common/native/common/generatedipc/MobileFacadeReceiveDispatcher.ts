/* generated file, don't edit. */

import { MobileFacade } from "./MobileFacade.js"

export class MobileFacadeReceiveDispatcher {
	constructor(private readonly facade: MobileFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "handleBackPress": {
				return this.facade.handleBackPress()
			}
			case "visibilityChange": {
				const visibility: boolean = arg[0]
				return this.facade.visibilityChange(visibility)
			}
			case "keyboardSizeChanged": {
				const newSize: number = arg[0]
				return this.facade.keyboardSizeChanged(newSize)
			}
		}
	}
}
