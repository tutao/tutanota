import type {NativeInterfaceMain} from "../../native/main/NativeInterfaceMain"
import type {NativePushServiceApp} from "../../native/main/NativePushServiceApp"
import type {NativeSystemApp} from "../../native/common/NativeSystemApp"
import type {NativeFileApp} from "../../native/common/FileApp"
import {isBrowser} from "../common/Env"
import {ProgrammingError} from "../common/error/ProgrammingError"
import {ExposedWebInterface} from "../../native/common/NativeInterface"
import {DesktopFacade} from "../../native/common/generatedipc/DesktopFacade"
import {MobileFacade} from "../../native/common/generatedipc/MobileFacade.js"
import {CommonNativeFacade} from "../../native/common/generatedipc/CommonNativeFacade.js"
import {logins} from "./LoginController.js"
import {CryptoFacade} from "../worker/crypto/CryptoFacade.js"
import {EntityClient} from "../common/EntityClient.js"
import {deviceConfig} from "../../misc/DeviceConfig.js"
import {CalendarFacade} from "../worker/facades/CalendarFacade.js"
import {SystemFacade} from "../../native/common/generatedipc/SystemFacade.js"
import {SystemFacadeSendDispatcher} from "../../native/common/generatedipc/SystemFacadeSendDispatcher.js"

export type NativeInterfaces = {
	native: NativeInterfaceMain
	fileApp: NativeFileApp
	pushService: NativePushServiceApp
	systemApp: NativeSystemApp
	systemFacade: SystemFacade
}

/**
 * @deprecated Native interfaces exposed using this method should be refactored to be part of ExposedNativeInterface
 * A factory function to create interfaces for native communication
 * @returns NativeInterfaces
 * @throws ProgrammingError when you try to call this in the web browser
 */
export async function createNativeInterfaces(
	webInterface: ExposedWebInterface,
	mobileFacade: MobileFacade,
	desktopFacade: DesktopFacade,
	commonNativeFacade: CommonNativeFacade,
	cryptoFacade: CryptoFacade,
	calendarFacade: CalendarFacade,
	entityClient: EntityClient,
): Promise<NativeInterfaces> {
	if (!isBrowser()) {
		const {NativeInterfaceMain} = await import("../../native/main/NativeInterfaceMain")
		const {NativeFileApp} = await import("../../native/common/FileApp")
		const {NativePushServiceApp} = await import("../../native/main/NativePushServiceApp")
		const {NativeSystemApp} = await import("../../native/common/NativeSystemApp")
		const {WebGlobalDispatcher} = await import("../../native/common/generatedipc/WebGlobalDispatcher")
		const {FileFacadeSendDispatcher} = await import("../../native/common/generatedipc/FileFacadeSendDispatcher.js")
		const {NativePushFacadeSendDispatcher} = await import("../../native/common/generatedipc/NativePushFacadeSendDispatcher.js")
		const dispatcher = new WebGlobalDispatcher(
			commonNativeFacade,
			desktopFacade,
			mobileFacade,
		)
		const native = new NativeInterfaceMain(webInterface, dispatcher)
		const nativePushFacadeSendDispatcher = new NativePushFacadeSendDispatcher(native)
		const pushService = new NativePushServiceApp(nativePushFacadeSendDispatcher, logins, cryptoFacade, entityClient, deviceConfig, calendarFacade)
		const fileApp = new NativeFileApp(native, new FileFacadeSendDispatcher(native))
		const systemApp = new NativeSystemApp(native, fileApp)
		const systemFacade = new SystemFacadeSendDispatcher(native)
		return {
			native,
			fileApp,
			pushService,
			systemApp,
			systemFacade
		}
	} else {
		throw new ProgrammingError("Tried to make native interfaces in non-native")
	}
}