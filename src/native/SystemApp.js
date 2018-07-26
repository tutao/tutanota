//@flow
import {nativeApp} from "./NativeWrapper"
import {Request} from "../api/common/WorkerProtocol"

/**
 * Open the link
 * @param uri The uri
 */

export function openLinkNative(uri: string): Promise<boolean> {
	return nativeApp.invokeNative(new Request("openLink", [uri]))
}


export function reloadNative(queryParameters: string): Promise<void> {
	return nativeApp.invokeNative(new Request('reload', [queryParameters]))
}

export function changeColorTheme(theme: string): Promise<void> {
	return nativeApp.invokeNative(new Request('changeTheme', [theme]))
}