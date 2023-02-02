import { NativeInterfaceMain } from "./NativeInterfaceMain.js"
import { NativePushServiceApp } from "./NativePushServiceApp.js"
import { NativeFileApp } from "../common/FileApp.js"
import { isBrowser, isElectronClient } from "../../api/common/Env.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { DesktopFacade } from "../common/generatedipc/DesktopFacade.js"
import { MobileFacade } from "../common/generatedipc/MobileFacade.js"
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
import { SqlCipherFacade } from "../common/generatedipc/SqlCipherFacade.js"
import { SqlCipherFacadeSendDispatcher } from "../common/generatedipc/SqlCipherFacadeSendDispatcher.js"
import { LoginController } from "../../api/main/LoginController.js"
import { ImapImportFacade } from "../common/generatedipc/ImapImportFacade.js"

export type NativeInterfaces = {
	native: NativeInterfaceMain
	fileApp: NativeFileApp
	pushService: NativePushServiceApp
	mobileSystemFacade: MobileSystemFacade
	commonSystemFacade: CommonSystemFacade
	themeFacade: ThemeFacade
	sqlCipherFacade: SqlCipherFacade
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
	mobileFacade: MobileFacade,
	desktopFacade: DesktopFacade,
	imapImportFacade: ImapImportFacade,
	interWindowEventFacade: InterWindowEventFacade,
	commonNativeFacade: CommonNativeFacade,
	cryptoFacade: CryptoFacade,
	calendarFacade: CalendarFacade,
	entityClient: EntityClient,
	logins: LoginController,
): NativeInterfaces {
	if (isBrowser()) {
		throw new ProgrammingError("Tried to make native interfaces in non-native")
	}

	const dispatcher = new WebGlobalDispatcher(commonNativeFacade, desktopFacade, imapImportFacade, interWindowEventFacade, mobileFacade)
	const native = new NativeInterfaceMain(dispatcher)
	const nativePushFacadeSendDispatcher = new NativePushFacadeSendDispatcher(native)
	const pushService = new NativePushServiceApp(nativePushFacadeSendDispatcher, logins, cryptoFacade, entityClient, deviceConfig, calendarFacade)
	const fileApp = new NativeFileApp(new FileFacadeSendDispatcher(native), new ExportFacadeSendDispatcher(native))
	const commonSystemFacade = new CommonSystemFacadeSendDispatcher(native)
	const mobileSystemFacade = new MobileSystemFacadeSendDispatcher(native)
	const themeFacade = new ThemeFacadeSendDispatcher(native)
	const sqlCipherFacade = new SqlCipherFacadeSendDispatcher(native)
	return {
		native,
		fileApp,
		pushService,
		mobileSystemFacade: mobileSystemFacade,
		commonSystemFacade,
		themeFacade,
		sqlCipherFacade,
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
