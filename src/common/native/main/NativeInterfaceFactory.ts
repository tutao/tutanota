import { NativeInterfaceMain } from "./NativeInterfaceMain.js"
import { NativePushServiceApp } from "./NativePushServiceApp.js"
import { NativeFileApp } from "../common/FileApp.js"
import { isBrowser, isElectronClient } from "../../api/common/Env.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { DesktopFacade } from "../common/generatedipc/DesktopFacade.js"
import { CommonNativeFacade } from "../common/generatedipc/CommonNativeFacade.js"
import { CryptoFacade } from "../../api/worker/crypto/CryptoFacade.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { CalendarFacade } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { MobileSystemFacade } from "../common/generatedipc/MobileSystemFacade.js"
import { CommonSystemFacade } from "../common/generatedipc/CommonSystemFacade.js"
import { ThemeFacade } from "../common/generatedipc/ThemeFacade.js"
import { WebGlobalDispatcher } from "../common/generatedipc/WebGlobalDispatcher.js"
import { NativePushFacadeSendDispatcher } from "../common/generatedipc/NativePushFacadeSendDispatcher.js"
import { FileFacadeSendDispatcher } from "../common/generatedipc/FileFacadeSendDispatcher.js"
import { ExportFacadeSendDispatcher } from "../common/generatedipc/ExportFacadeSendDispatcher.js"
import { CommonSystemFacadeSendDispatcher } from "../common/generatedipc/CommonSystemFacadeSendDispatcher.js"
import { MobileSystemFacadeSendDispatcher } from "../common/generatedipc/MobileSystemFacadeSendDispatcher.js"
import { ThemeFacadeSendDispatcher } from "../common/generatedipc/ThemeFacadeSendDispatcher.js"
import { SearchTextInAppFacadeSendDispatcher } from "../common/generatedipc/SearchTextInAppFacadeSendDispatcher.js"
import { SettingsFacadeSendDispatcher } from "../common/generatedipc/SettingsFacadeSendDispatcher.js"
import { DesktopSystemFacadeSendDispatcher } from "../common/generatedipc/DesktopSystemFacadeSendDispatcher.js"
import { SearchTextInAppFacade } from "../common/generatedipc/SearchTextInAppFacade.js"
import { DesktopSystemFacade } from "../common/generatedipc/DesktopSystemFacade.js"
import { InterWindowEventFacade } from "../common/generatedipc/InterWindowEventFacade.js"
import { InterWindowEventFacadeSendDispatcher } from "../common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { LoginController } from "../../api/main/LoginController.js"
import { MobileContactsFacade } from "../common/generatedipc/MobileContactsFacade.js"
import { MobileContactsFacadeSendDispatcher } from "../common/generatedipc/MobileContactsFacadeSendDispatcher.js"
import { WebMobileFacade } from "./WebMobileFacade.js"
import { NativeCredentialsFacade } from "../common/generatedipc/NativeCredentialsFacade.js"
import { NativeCredentialsFacadeSendDispatcher } from "../common/generatedipc/NativeCredentialsFacadeSendDispatcher.js"
import { MobilePaymentsFacade } from "../common/generatedipc/MobilePaymentsFacade.js"
import { MobilePaymentsFacadeSendDispatcher } from "../common/generatedipc/MobilePaymentsFacadeSendDispatcher.js"

import { AppType } from "../../misc/ClientConstants.js"
import { ExternalCalendarFacade } from "../common/generatedipc/ExternalCalendarFacade.js"
import { ExternalCalendarFacadeSendDispatcher } from "../common/generatedipc/ExternalCalendarFacadeSendDispatcher.js"

export type NativeInterfaces = {
	native: NativeInterfaceMain
	fileApp: NativeFileApp
	pushService: NativePushServiceApp
	mobileSystemFacade: MobileSystemFacade
	commonSystemFacade: CommonSystemFacade
	themeFacade: ThemeFacade
	mobileContactsFacade: MobileContactsFacade
	nativeCredentialsFacade: NativeCredentialsFacade
	mobilePaymentsFacade: MobilePaymentsFacade
	externalCalendarFacade: ExternalCalendarFacade
}

export type DesktopInterfaces = {
	searchTextFacade: SearchTextInAppFacade
	desktopSettingsFacade: SettingsFacadeSendDispatcher
	desktopSystemFacade: DesktopSystemFacade
	interWindowEventSender: InterWindowEventFacadeSendDispatcher
}

/**
 * @returns NativeInterfaces
 * @throws ProgrammingError when you try to call this in the web browser
 */
export function createNativeInterfaces(
	mobileFacade: WebMobileFacade,
	desktopFacade: DesktopFacade,
	interWindowEventFacade: InterWindowEventFacade,
	commonNativeFacade: CommonNativeFacade,
	cryptoFacade: CryptoFacade,
	calendarFacade: CalendarFacade,
	entityClient: EntityClient,
	logins: LoginController,
	app: AppType,
): NativeInterfaces {
	if (isBrowser()) {
		throw new ProgrammingError("Tried to make native interfaces in non-native")
	}

	const dispatcher = new WebGlobalDispatcher(commonNativeFacade, desktopFacade, interWindowEventFacade, mobileFacade)
	const native = new NativeInterfaceMain(dispatcher)
	const nativePushFacadeSendDispatcher = new NativePushFacadeSendDispatcher(native)
	const pushService = new NativePushServiceApp(nativePushFacadeSendDispatcher, logins, cryptoFacade, entityClient, deviceConfig, calendarFacade, app)
	const fileApp = new NativeFileApp(new FileFacadeSendDispatcher(native), new ExportFacadeSendDispatcher(native))
	const commonSystemFacade = new CommonSystemFacadeSendDispatcher(native)
	const mobileSystemFacade = new MobileSystemFacadeSendDispatcher(native)
	const themeFacade = new ThemeFacadeSendDispatcher(native)
	const mobileContactsFacade = new MobileContactsFacadeSendDispatcher(native)
	const nativeCredentialsFacade = new NativeCredentialsFacadeSendDispatcher(native)
	const mobilePaymentsFacade = new MobilePaymentsFacadeSendDispatcher(native)
	const externalCalendarFacade = new ExternalCalendarFacadeSendDispatcher(native)

	return {
		native,
		fileApp,
		pushService,
		mobileSystemFacade,
		commonSystemFacade,
		themeFacade,
		mobileContactsFacade,
		nativeCredentialsFacade,
		mobilePaymentsFacade,
		externalCalendarFacade,
	}
}

export function createDesktopInterfaces(native: NativeInterfaceMain): DesktopInterfaces {
	if (!isElectronClient()) {
		throw new ProgrammingError("tried to create desktop interfaces in non-electron client")
	}
	return {
		searchTextFacade: new SearchTextInAppFacadeSendDispatcher(native),
		desktopSettingsFacade: new SettingsFacadeSendDispatcher(native),
		desktopSystemFacade: new DesktopSystemFacadeSendDispatcher(native),
		interWindowEventSender: new InterWindowEventFacadeSendDispatcher(native),
	}
}
