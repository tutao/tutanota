import type {NativeInterface} from "./NativeInterface"
import type {NativeFileApp} from "./FileApp"

export class NativeSystemApp {
	constructor(
		private readonly native: NativeInterface,
		private readonly fileApp: NativeFileApp
	) {
	}

	reloadNative(queryParams: Record<string, string>): Promise<void> {
		return this.native.invokeNative("reload", [queryParams])
	}

	getDesktopLogs(): Promise<Array<string>> {
		return this.native.invokeNative("getLog", [])
	}
}