/* generated file, don't edit. */


import {FileFacade} from "./FileFacade.js"
import {FileFacadeReceiveDispatcher} from "./FileFacadeReceiveDispatcher.js"
import {NativePushFacade} from "./NativePushFacade.js"
import {NativePushFacadeReceiveDispatcher} from "./NativePushFacadeReceiveDispatcher.js"
import {ThemeFacade} from "./ThemeFacade.js"
import {ThemeFacadeReceiveDispatcher} from "./ThemeFacadeReceiveDispatcher.js"

export class DesktopGlobalDispatcher {
	private readonly fileFacade : FileFacadeReceiveDispatcher
	private readonly nativePushFacade : NativePushFacadeReceiveDispatcher
	private readonly themeFacade : ThemeFacadeReceiveDispatcher
	constructor(
		fileFacade : FileFacade,
		nativePushFacade : NativePushFacade,
		themeFacade : ThemeFacade,
	) {
		this.fileFacade = new FileFacadeReceiveDispatcher(fileFacade)
		this.nativePushFacade = new NativePushFacadeReceiveDispatcher(nativePushFacade)
		this.themeFacade = new ThemeFacadeReceiveDispatcher(themeFacade)
	}
	
	async dispatch(facadeName: string, methodName: string, args: Array<any>) {
		switch (facadeName) {
			case "FileFacade":
				return this.fileFacade.dispatch(methodName, args)
			case "NativePushFacade":
				return this.nativePushFacade.dispatch(methodName, args)
			case "ThemeFacade":
				return this.themeFacade.dispatch(methodName, args)
			default:
				throw new Error("licc messed up! " + facadeName)
		}
	}
}
