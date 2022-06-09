/* generated file, don't edit. */


import {ThemeFacade} from "./ThemeFacade.js"
import {ThemeFacadeReceiveDispatcher} from "./ThemeFacadeReceiveDispatcher.js"

export class DesktopGlobalDispatcher {
	private readonly themeFacade : ThemeFacadeReceiveDispatcher
	constructor(
		themeFacade : ThemeFacade,
	) {
		this.themeFacade = new ThemeFacadeReceiveDispatcher(themeFacade)
	}
	
	async dispatch(facadeName: string, methodName: string, args: Array<any>) {
		switch (facadeName) {
			case "ThemeFacade":
				return this.themeFacade.dispatch(methodName, args)
			default:
				throw new Error("licc messed up! " + facadeName)
		}
	}
}
