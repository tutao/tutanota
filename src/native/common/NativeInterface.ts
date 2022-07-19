import type {OfflineDbFacade} from "../../desktop/db/OfflineDbFacade"
import {IWebauthn} from "../../misc/2fa/webauthn/IWebauthn.js"
import {IPostLoginAction} from "../../api/main/LoginController"

export interface NativeInterface {
	invokeNative(requestType: NativeRequestType, args: ReadonlyArray<unknown>): Promise<any>
}

/** What native interfaces can be accessed by the web part. */
export interface ExposedNativeInterface {
	webauthn: IWebauthn
	offlineDbFacade: OfflineDbFacade
	postLoginActions: IPostLoginAction
}