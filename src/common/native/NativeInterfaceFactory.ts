import { NativeInterfaceMain } from "./NativeInterfaceMain.js"
import { NativePushServiceApp } from "./NativePushServiceApp.js"
import { CommonNativeFacade } from "@tutao/native-bridge/generatedIpc/types"
import { CommonSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { CommonSystemFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { DesktopFacade } from "@tutao/native-bridge/generatedIpc/types"
import { DesktopSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { DesktopSystemFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { ExportFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ExportFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { ExternalCalendarFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ExternalCalendarFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { FileFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { InterWindowEventFacade } from "@tutao/native-bridge/generatedIpc/types"
import { InterWindowEventFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { MobileContactsFacade } from "@tutao/native-bridge/generatedIpc/types"
import { MobileContactsFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { MobilePaymentsFacade } from "@tutao/native-bridge/generatedIpc/types"
import { MobilePaymentsFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { MobileSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { MobileSystemFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { NativeCredentialsFacade } from "@tutao/native-bridge/generatedIpc/types"
import { NativeCredentialsFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { NativeFileApp } from "../../native-bridge/common/FileApp.js"
import { NativeMailImportFacade } from "@tutao/native-bridge/generatedIpc/types"
import { NativeMailImportFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { NativePushFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { SearchTextInAppFacade } from "@tutao/native-bridge/generatedIpc/types"
import { SearchTextInAppFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { SettingsFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { ThemeFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ThemeFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { WebGlobalDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { isAdminClient, isBrowser, isDesktop, ProgrammingError } from "@tutao/app-env"
import { deviceConfig } from "../misc/DeviceConfig.js"
import { CalendarFacade } from "../api/worker/facades/lazy/CalendarFacade.js"
import { LoginController } from "../api/main/LoginController.js"
import { WebMobileFacade } from "./WebMobileFacade.js"
import { AppType } from "@tutao/app-env"
import { CryptoFacade } from "../../base/crypto/CryptoFacade"
import { EntityClient } from "../../network/EntityClient"
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
