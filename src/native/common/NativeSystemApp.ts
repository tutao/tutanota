import type {NativeInterface} from "./NativeInterface"
import type {NativeFileApp} from "./FileApp"
import {FileReference} from "../../api/common/utils/FileUtils";

export type IntegrationInfo = {
	isMailtoHandler: boolean
	isAutoLaunchEnabled: boolean
	isIntegrated: boolean
	isUpdateAvailable: boolean
}

export class NativeSystemApp {
	constructor(
		private readonly native: NativeInterface,
		private readonly fileApp: NativeFileApp
	) {
	}

	/**
	 * Open the link
	 * @param uri The uri
	 */
	openLinkNative(uri: string): Promise<boolean> {
		return this.native.invokeNative("openLink", [uri])
	}

	shareTextNative(text: string, title: string): Promise<boolean> {
		return this.native.invokeNative("shareText", [text, title])
	}

	reloadNative(queryParams: Record<string, string>): Promise<void> {
		return this.native.invokeNative("reload", [queryParams])
	}

	/**
	 * Get device logs. Returns URI of the file
	 */
	async getDeviceLogs(): Promise<FileReference> {
		const log = await this.native.invokeNative("getDeviceLog", [])
		return this.fileApp.uriToFileRef(log)
	}

	getDesktopLogs(): Promise<Array<string>> {
		return this.native.invokeNative("getLog", [])
	}
}