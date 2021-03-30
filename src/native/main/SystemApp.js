//@flow
import {nativeApp} from "../common/NativeWrapper"
import {Request} from "../../api/common/WorkerProtocol"
import {uriToFileRef} from "../common/FileApp"
import {isDesktop} from "../../api/common/Env"
import type {DesktopConfigEncKeyEnum, DesktopConfigKeyEnum} from "../../desktop/config/ConfigKeys"

/**
 * Open the link
 * @param uri The uri
 */

export function openLinkNative(uri: string): Promise<boolean> {
	return nativeApp.invokeNative(new Request("openLink", [uri]))
}

export function shareTextNative(text: string, title: string): Promise<boolean> {
	return nativeApp.invokeNative(new Request("shareText", [text, title]))
}

export function reloadNative(queryParameters: string): Promise<void> {
	return nativeApp.invokeNative(new Request('reload', [queryParameters]))
}

export function changeColorTheme(theme: string): Promise<void> {
	return nativeApp.invokeNative(new Request('changeTheme', [theme]))
}

export function changeSystemLanguage(language: {code: string, languageTag: string}): Promise<void> {
	return isDesktop()
		? nativeApp.initialized().then(() => nativeApp.invokeNative(new Request('changeLanguage', [language])))
		: Promise.resolve()
}

/**
 * Get device logs. Returns URI of the file
 */
export function getDeviceLogs(): Promise<FileReference> {
	return nativeApp.invokeNative(new Request("getDeviceLog", [])).then(uriToFileRef)
}

export function getDesktopLogs(): Promise<Array<string>> {
	return nativeApp.invokeNative(new Request("getLog", []))
}

export function getConfigValue(key: DesktopConfigKeyEnum | DesktopConfigEncKeyEnum): Promise<any> {
	return nativeApp.invokeNative(new Request("getConfigValue", [key]))
}

export type IntegrationInfo = {isMailtoHandler: boolean, isAutoLaunchEnabled: boolean, isIntegrated: boolean, isUpdateAvailable: boolean}

export function getIntegrationInfo(): Promise<IntegrationInfo> {
	return nativeApp.invokeNative(new Request("getIntegrationInfo", []))
}

export function setConfigValue(key: DesktopConfigKeyEnum | DesktopConfigEncKeyEnum, value: any): Promise<any> {
	return nativeApp.invokeNative(new Request("setConfigValue", [key, value]))
}