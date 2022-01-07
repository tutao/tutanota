//@flow
import {Request} from "../../api/common/MessageDispatcher"
import {isDesktop} from "../../api/common/Env"
import type {DesktopConfigEncKeyEnum, DesktopConfigKeyEnum} from "../../desktop/config/ConfigKeys"
import type {LanguageCode} from "../../misc/LanguageViewModel"
import type {NativeInterface} from "../common/NativeInterface"
import type {NativeFileApp} from "../common/FileApp"

export type IntegrationInfo = {isMailtoHandler: boolean, isAutoLaunchEnabled: boolean, isIntegrated: boolean, isUpdateAvailable: boolean}

export class NativeSystemApp {

	_native: NativeInterface
	_fileApp: NativeFileApp

	constructor(native: NativeInterface, fileApp: NativeFileApp) {
		this._native = native
		this._fileApp = fileApp
	}

	/**
	 * Open the link
	 * @param uri The uri
	 */
	openLinkNative(uri: string): Promise<boolean> {
		return this._native.invokeNative(new Request("openLink", [uri]))
	}

	shareTextNative(text: string, title: string): Promise<boolean> {
		return this._native.invokeNative(new Request("shareText", [text, title]))
	}

	reloadNative(queryParams: {[string]: string}): Promise<void> {
		return this._native.invokeNative(new Request('reload', [queryParams]))
	}

	async changeSystemLanguage(language: {code: LanguageCode, languageTag: string}): Promise<void> {
		if (isDesktop()) {
			return this._native.invokeNative(new Request('changeLanguage', [language]))
		}
	}

	/**
	 * Get device logs. Returns URI of the file
	 */
	async getDeviceLogs(): Promise<FileReference> {
		const log = await this._native.invokeNative(new Request("getDeviceLog", []))
		return this._fileApp.uriToFileRef(log)
	}

	getDesktopLogs(): Promise<Array<string>> {
		return this._native.invokeNative(new Request("getLog", []))
	}

	getConfigValue(key: DesktopConfigKeyEnum | DesktopConfigEncKeyEnum): Promise<any> {
		return this._native.invokeNative(new Request("getConfigValue", [key]))
	}


	getIntegrationInfo(): Promise<IntegrationInfo> {
		return this._native.invokeNative(new Request("getIntegrationInfo", []))
	}

	setConfigValue(key: DesktopConfigKeyEnum | DesktopConfigEncKeyEnum, value: any): Promise<any> {
		return this._native.invokeNative(new Request("setConfigValue", [key, value]))
	}

	getSpellcheckLanguages(): Promise<Array<string>> {
		return this._native.invokeNative(new Request("getSpellcheckLanguages", []))
	}
}
