/* generated file, don't edit. */

import { CommonNativeFacade } from "./CommonNativeFacade.js"
import { CommonNativeFacadeReceiveDispatcher } from "./CommonNativeFacadeReceiveDispatcher.js"
import { DesktopFacade } from "./DesktopFacade.js"
import { DesktopFacadeReceiveDispatcher } from "./DesktopFacadeReceiveDispatcher.js"
import { InterWindowEventFacade } from "./InterWindowEventFacade.js"
import { InterWindowEventFacadeReceiveDispatcher } from "./InterWindowEventFacadeReceiveDispatcher.js"
import { MobileFacade } from "./MobileFacade.js"
import { MobileFacadeReceiveDispatcher } from "./MobileFacadeReceiveDispatcher.js"

export class WebGlobalDispatcher {
	private readonly commonNativeFacade: CommonNativeFacadeReceiveDispatcher
	private readonly desktopFacade: DesktopFacadeReceiveDispatcher
	private readonly interWindowEventFacade: InterWindowEventFacadeReceiveDispatcher
	private readonly mobileFacade: MobileFacadeReceiveDispatcher
	constructor(
		commonNativeFacade: CommonNativeFacade,
		desktopFacade: DesktopFacade,
		interWindowEventFacade: InterWindowEventFacade,
		mobileFacade: MobileFacade,
	) {
		this.commonNativeFacade = new CommonNativeFacadeReceiveDispatcher(commonNativeFacade)
		this.desktopFacade = new DesktopFacadeReceiveDispatcher(desktopFacade)
		this.interWindowEventFacade = new InterWindowEventFacadeReceiveDispatcher(interWindowEventFacade)
		this.mobileFacade = new MobileFacadeReceiveDispatcher(mobileFacade)
	}

	async dispatch(facadeName: string, methodName: string, args: Array<any>) {
		switch (facadeName) {
			case "CommonNativeFacade":
				return this.commonNativeFacade.dispatch(methodName, args)
			case "DesktopFacade":
				return this.desktopFacade.dispatch(methodName, args)
			case "InterWindowEventFacade":
				return this.interWindowEventFacade.dispatch(methodName, args)
			case "MobileFacade":
				return this.mobileFacade.dispatch(methodName, args)
			default:
				throw new Error("licc messed up! " + facadeName)
		}
	}
}
