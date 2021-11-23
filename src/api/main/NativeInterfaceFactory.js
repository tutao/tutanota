// @flow

import type {NativeInterfaceMain} from "../../native/main/NativeInterfaceMain"
import type {NativePushServiceApp} from "../../native/main/NativePushServiceApp"
import type {NativeSystemApp} from "../../native/main/NativeSystemApp"
import type {NativeFileApp} from "../../native/common/FileApp"
import {downcast} from "@tutao/tutanota-utils"
import {isBrowser} from "../common/Env"
import {ProgrammingError} from "../common/error/ProgrammingError"

/**
 * A factory function to create interfaces for native communication
 * When running in browser, these interfaces will be stubs that throw if you try to use them
 */
export async function createNativeInterfaces(): Promise<{
	native: NativeInterfaceMain,
	fileApp: NativeFileApp,
	pushService: NativePushServiceApp,
	systemApp: NativeSystemApp
}> {

	let native
	let fileApp
	let pushService
	let systemApp

	if (!isBrowser()) {
		const {NativeInterfaceMain} = await import("../../native/main/NativeInterfaceMain")
		const {NativeFileApp} = await import ("../../native/common/FileApp")
		const {NativePushServiceApp} = await import("../../native/main/NativePushServiceApp")
		const {NativeSystemApp} = await import("../../native/main/NativeSystemApp")

		native = new NativeInterfaceMain()
		fileApp = new NativeFileApp(native)
		pushService = new NativePushServiceApp(native)
		systemApp = new NativeSystemApp(native, fileApp)
	} else {
		/** Trying to access native interfaces from the browser is an error */
		// TODO Can we circumvrent this entirely when in browser and just not call this factory?
		//      However, it would be annoying for the native interfaces on locator to be nullable

		native = downcast<NativeInterfaceMain>(new Proxy({}, {
			get: (target: {}, property: string) => {
				throw new ProgrammingError(`Tried to call NativeInterfaceMain.${property} in browser`,)
			}
		}))

		fileApp = downcast<NativeFileApp>(new Proxy({}, {
			get: (target: {}, property: string) => {
				throw new ProgrammingError(`Tried to call NativeFileApp.${property} in browser`,)
			}
		}))

		pushService = downcast<NativePushServiceApp>(new Proxy({}, {
			get: (target: {}, property: string) => {
				throw new ProgrammingError(`Tried to call NativePushServiceApp.${property} in browser`,)
			}
		}))

		systemApp = downcast<NativeSystemApp>(new Proxy({}, {
			get: (target: {}, property: string) => {
				throw new ProgrammingError(`Tried to call NativeSystemApp.${property} in browser`,)
			}
		}))
	}

	return {
		native,
		fileApp,
		pushService,
		systemApp
	}
}



