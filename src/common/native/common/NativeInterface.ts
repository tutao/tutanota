import { PostLoginAction } from "../../api/main/LoginController"

export interface NativeInterface {
	invokeNative(requestType: NativeRequestType, args: ReadonlyArray<unknown>): Promise<any>
}

/** What native interfaces can be accessed by the web part. */
export interface ExposedNativeInterface {
	postLoginActions: PostLoginAction
}
