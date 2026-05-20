import { NativeInterfaceMain } from "./NativeInterfaceMain.js"
import { NativePushServiceApp } from "./NativePushServiceApp.js"
import {
	CommonNativeFacade,
	CommonSystemFacade,
	DesktopFacade,
	DesktopSystemFacade,
	ExportFacade,
	ExternalCalendarFacade,
	InterWindowEventFacade,
	MobileContactsFacade,
	MobilePaymentsFacade,
	MobileSystemFacade,
	NativeCredentialsFacade,
	NativeMailImportFacade,
	SearchTextInAppFacade,
	ThemeFacade,
} from "@tutao/native-bridge/generatedIpc/types"
import {
	CommonSystemFacadeSendDispatcher,
	DesktopSystemFacadeSendDispatcher,
	ExportFacadeSendDispatcher,
	ExternalCalendarFacadeSendDispatcher,
	FileFacadeSendDispatcher,
	InterWindowEventFacadeSendDispatcher,
	MobileContactsFacadeSendDispatcher,
	MobilePaymentsFacadeSendDispatcher,
	MobileSystemFacadeSendDispatcher,
	NativeCredentialsFacadeSendDispatcher,
	NativeMailImportFacadeSendDispatcher,
	NativePushFacadeSendDispatcher,
	SearchTextInAppFacadeSendDispatcher,
	SettingsFacadeSendDispatcher,
	ThemeFacadeSendDispatcher,
	WebGlobalDispatcher,
} from "@tutao/native-bridge/generatedIpc/dispatchers"
import { NativeFileApp } from "../../../app-kit/native-bridge/common/FileApp.js"
import { AppType, isAdminClient, isBrowser, isDesktop, ProgrammingError } from "@tutao/app-env"
import { deviceConfig } from "../misc/DeviceConfig.js"
import { CalendarFacade } from "../api/worker/facades/lazy/CalendarFacade.js"
import { LoginController } from "../api/main/LoginController.js"
import { WebMobileFacade } from "./WebMobileFacade.js"
import { CryptoFacade } from "../../../platform-kit/base/crypto/CryptoFacade"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { AlarmFacade } from "../api/worker/facades/lazy/AlarmFacade"

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
	alarmFacade: AlarmFacade,
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
	const pushService = new NativePushServiceApp(
		nativePushFacadeSendDispatcher,
		logins,
		cryptoFacade,
		entityClient,
		deviceConfig,
		calendarFacade,
		alarmFacade,
		app,
	)
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
	if (!(isDesktop() || isAdminClient())) {
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
