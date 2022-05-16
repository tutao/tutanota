import type {Request} from "../../api/common/MessageDispatcher"
import type {OfflineDbFacade} from "../../desktop/db/OfflineDbFacade"
import {IWebauthn} from "../../misc/2fa/webauthn/IWebauthn.js"
import {IInterWindowEventHandler, IInterWindowEventSender} from "../../desktop/ipc/IInterWindowEventBus"
import {exposeRemote} from "../../api/common/WorkerProxy"
import {IPostLoginAction} from "../../api/main/LoginController"

export interface NativeInterface {
	invokeNative(msg: Request<NativeRequestType>): Promise<any>
}

/** What native interfaces can be accessed by the web part. */
export interface ExposedNativeInterface {
	webauthn: IWebauthn
	offlineDbFacade: OfflineDbFacade
	interWindowEventSender: IInterWindowEventSender
	postLoginActions: IPostLoginAction
}

/** What web interfaces can be accessed by the native part. */
export interface ExposedWebInterface {
	interWindowEventHandler: IInterWindowEventHandler,
}

export function exposeNativeInterface(native: NativeInterface): ExposedNativeInterface {
	return exposeRemote((request) => native.invokeNative(request))
}