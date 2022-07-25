import type {OfflineDbFacade} from "../../desktop/db/OfflineDbFacade.js"
import {IPostLoginAction} from "../../api/main/LoginController.js"

export interface NativeInterface {
	invokeNative(requestType: NativeRequestType, args: ReadonlyArray<unknown>): Promise<any>
}

/** What native interfaces can be accessed by the web part. */
export interface ExposedNativeInterface {
	offlineDbFacade: OfflineDbFacade
	postLoginActions: IPostLoginAction
}