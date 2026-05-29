/* generated file, don't edit. */

import { CommonNativeFacade } from "@tutao/native-bridge/generatedIpc/types"
import { CommonNativeFacadeReceiveDispatcher } from "./CommonNativeFacadeReceiveDispatcher.js"
import { DesktopFacade } from "@tutao/native-bridge/generatedIpc/types"
import { DesktopFacadeReceiveDispatcher } from "./DesktopFacadeReceiveDispatcher.js"
import { ImapSyncFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ImapSyncFacadeReceiveDispatcher } from "./ImapSyncFacadeReceiveDispatcher.js"
import { InterWindowEventFacade } from "@tutao/native-bridge/generatedIpc/types"
import { InterWindowEventFacadeReceiveDispatcher } from "./InterWindowEventFacadeReceiveDispatcher.js"
import { MobileFacade } from "@tutao/native-bridge/generatedIpc/types"
import { MobileFacadeReceiveDispatcher } from "./MobileFacadeReceiveDispatcher.js"

export class WebGlobalDispatcher {
	private readonly commonNativeFacade: CommonNativeFacadeReceiveDispatcher
	private readonly desktopFacade: DesktopFacadeReceiveDispatcher
	private readonly imapSyncFacade: ImapSyncFacadeReceiveDispatcher
	private readonly interWindowEventFacade: InterWindowEventFacadeReceiveDispatcher
	private readonly mobileFacade: MobileFacadeReceiveDispatcher
	constructor(
		commonNativeFacade: CommonNativeFacade,
		desktopFacade: DesktopFacade,
		imapSyncFacade: ImapSyncFacade,
		interWindowEventFacade: InterWindowEventFacade,
		mobileFacade: MobileFacade,
	) {
		this.commonNativeFacade = new CommonNativeFacadeReceiveDispatcher(commonNativeFacade)
		this.desktopFacade = new DesktopFacadeReceiveDispatcher(desktopFacade)
		this.imapSyncFacade = new ImapSyncFacadeReceiveDispatcher(imapSyncFacade)
		this.interWindowEventFacade = new InterWindowEventFacadeReceiveDispatcher(interWindowEventFacade)
		this.mobileFacade = new MobileFacadeReceiveDispatcher(mobileFacade)
	}

	async dispatch(facadeName: string, methodName: string, args: Array<any>) {
		switch (facadeName) {
			case "CommonNativeFacade":
				return this.commonNativeFacade.dispatch(methodName, args)
			case "DesktopFacade":
				return this.desktopFacade.dispatch(methodName, args)
			case "ImapSyncFacade":
				return this.imapSyncFacade.dispatch(methodName, args)
			case "InterWindowEventFacade":
				return this.interWindowEventFacade.dispatch(methodName, args)
			case "MobileFacade":
				return this.mobileFacade.dispatch(methodName, args)
			default:
				throw new Error("licc messed up! " + facadeName)
		}
	}
}
