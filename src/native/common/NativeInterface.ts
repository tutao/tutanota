import type {OfflineDbFacade} from "../../desktop/db/OfflineDbFacade"
import {IWebauthn} from "../../misc/2fa/webauthn/IWebauthn.js"
import {InterWindowEventHandler, InterWindowEventSender} from "./InterWindowEventBus.js";
import {InterWindowEventTypes} from "./InterWindowEventTypes"
import {IPostLoginAction} from "../../api/main/LoginController"

export interface NativeInterface {
	invokeNative(requestType: NativeRequestType, args: ReadonlyArray<unknown>): Promise<any>
}

/** What native interfaces can be accessed by the web part. */
export interface ExposedNativeInterface {
	webauthn: IWebauthn
	offlineDbFacade: OfflineDbFacade
	interWindowEventSender: InterWindowEventSender<InterWindowEventTypes>
	postLoginActions: IPostLoginAction
}

/** What web interfaces can be accessed by the native part. */
export interface ExposedWebInterface {
	interWindowEventHandler: InterWindowEventHandler<InterWindowEventTypes>,
}