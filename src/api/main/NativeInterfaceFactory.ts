import type {NativeInterfaceMain} from "../../native/main/NativeInterfaceMain"
import type {NativePushServiceApp} from "../../native/main/NativePushServiceApp"
import type {NativeSystemApp} from "../../native/main/NativeSystemApp"
import type {NativeFileApp} from "../../native/common/FileApp"
import {isBrowser} from "../common/Env"
import {ProgrammingError} from "../common/error/ProgrammingError"
import {ExposedWebInterface} from "../../native/common/NativeInterface"

export type NativeInterfaces = {
	native: NativeInterfaceMain
	fileApp: NativeFileApp
	pushService: NativePushServiceApp
	systemApp: NativeSystemApp
}

/**
 * A factory function to create interfaces for native communication
 * @returns NativeInterfaces
 * @throws ProgrammingError when you try to call this in the web browser
 */
export async function createNativeInterfaces(webInterface: ExposedWebInterface): Promise<NativeInterfaces> {
	if (!isBrowser()) {
		const {NativeInterfaceMain} = await import("../../native/main/NativeInterfaceMain")
		const {NativeFileApp} = await import("../../native/common/FileApp")
		const {NativePushServiceApp} = await import("../../native/main/NativePushServiceApp")
		const {NativeSystemApp} = await import("../../native/main/NativeSystemApp")
		const native = new NativeInterfaceMain(webInterface)
		const fileApp = new NativeFileApp(native)
		const pushService = new NativePushServiceApp(native)
		const systemApp = new NativeSystemApp(native, fileApp)
		return {
			native,
			fileApp,
			pushService,
			systemApp,
		}
	} else {
		throw new ProgrammingError("Tried to make native interfaces in non-native")
	}
}