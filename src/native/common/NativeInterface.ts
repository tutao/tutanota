import type {Request} from "../../api/common/MessageDispatcher"
import type {OfflineDbFacade} from "../../desktop/db/OfflineDbFacade"
import {IWebauthn} from "../../misc/2fa/webauthn/IWebauthn.js"
import {InterWindowEventHandler, InterWindowEventSender} from "./InterWindowEventBus.js";
import {InterWindowEventTypes} from "./InterWindowEventTypes"

export interface NativeInterface {
	invokeNative(msg: Request<NativeRequestType>): Promise<any>
}

/** What native interfaces can be accessed by the web part. */
export interface ExposedNativeInterface {
	webauthn: IWebauthn,
	offlineDbFacade: OfflineDbFacade,
	interWindowEventSender: InterWindowEventSender<InterWindowEventTypes>,
}

/** What web interfaces can be accessed by the native part. */
export interface ExposedWebInterface {
	interWindowEventHandler: InterWindowEventHandler<InterWindowEventTypes>,
}