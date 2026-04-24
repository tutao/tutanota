import { NativeInterfaceMain } from "./NativeInterfaceMain.js"
import { NativePushServiceApp } from "./NativePushServiceApp.js"
import { NativeFileApp } from "../common/FileApp.js"
import { isBrowser, isDesktop, Mode, ProgrammingError } from "@tutao/app-env"
import {
	CommonNativeFacade,
	CommonSystemFacade,
	CommonSystemFacadeSendDispatcher,
	DesktopFacade,
	DesktopSystemFacade,
	DesktopSystemFacadeSendDispatcher,
	ExportFacade,
	ExportFacadeSendDispatcher,
	ExternalCalendarFacade,
	ExternalCalendarFacadeSendDispatcher,
	FileFacadeSendDispatcher,
	InterWindowEventFacade,
	InterWindowEventFacadeSendDispatcher,
	MobileContactsFacade,
	MobileContactsFacadeSendDispatcher,
	MobilePaymentsFacade,
	MobilePaymentsFacadeSendDispatcher,
	MobileSystemFacade,
	MobileSystemFacadeSendDispatcher,
	NativeCredentialsFacade,
	NativeCredentialsFacadeSendDispatcher,
	NativeMailImportFacade,
	NativeMailImportFacadeSendDispatcher,
	NativePushFacadeSendDispatcher,
	SearchTextInAppFacade,
	SearchTextInAppFacadeSendDispatcher,
	SettingsFacadeSendDispatcher,
	ThemeFacade,
	ThemeFacadeSendDispatcher,
	WebGlobalDispatcher,
} from "@tutao/native-bridge"
import { CryptoFacade } from "../../api/worker/crypto/CryptoFacade.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { CalendarFacade } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { LoginController } from "../../api/main/LoginController.js"
import { WebMobileFacade } from "./WebMobileFacade.js"

import { AppType } from "../../misc/ClientConstants.js"

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
	nativeMailImportFacade: NativeMailImportFacade
	interWindowEventSender: InterWindowEventFacadeSendDispatcher
	exportFacade: ExportFacade
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
	if (!(isDesktop() || env.mode === Mode.Admin)) {
		throw new ProgrammingError("tried to create desktop interfaces in non-electron client")
	}
	return {
		searchTextFacade: new SearchTextInAppFacadeSendDispatcher(native),
		desktopSettingsFacade: new SettingsFacadeSendDispatcher(native),
		desktopSystemFacade: new DesktopSystemFacadeSendDispatcher(native),
		nativeMailImportFacade: new NativeMailImportFacadeSendDispatcher(native),
		interWindowEventSender: new InterWindowEventFacadeSendDispatcher(native),
		exportFacade: new ExportFacadeSendDispatcher(native),
	}
}
