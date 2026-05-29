/* generated file, don't edit. */

import { CommonSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { CommonSystemFacadeReceiveDispatcher } from "./CommonSystemFacadeReceiveDispatcher.js"
import { DesktopSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { DesktopSystemFacadeReceiveDispatcher } from "./DesktopSystemFacadeReceiveDispatcher.js"
import { ExportFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ExportFacadeReceiveDispatcher } from "./ExportFacadeReceiveDispatcher.js"
import { ExternalCalendarFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ExternalCalendarFacadeReceiveDispatcher } from "./ExternalCalendarFacadeReceiveDispatcher.js"
import { FileFacade } from "@tutao/native-bridge/generatedIpc/types"
import { FileFacadeReceiveDispatcher } from "./FileFacadeReceiveDispatcher.js"
import { ImapSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ImapSyncSystemFacadeReceiveDispatcher } from "./ImapSyncSystemFacadeReceiveDispatcher.js"
import { InterWindowEventFacade } from "@tutao/native-bridge/generatedIpc/types"
import { InterWindowEventFacadeReceiveDispatcher } from "./InterWindowEventFacadeReceiveDispatcher.js"
import { NativeCredentialsFacade } from "@tutao/native-bridge/generatedIpc/types"
import { NativeCredentialsFacadeReceiveDispatcher } from "./NativeCredentialsFacadeReceiveDispatcher.js"
import { NativeCryptoFacade } from "@tutao/native-bridge/generatedIpc/types"
import { NativeCryptoFacadeReceiveDispatcher } from "./NativeCryptoFacadeReceiveDispatcher.js"
import { NativeMailImportFacade } from "@tutao/native-bridge/generatedIpc/types"
import { NativeMailImportFacadeReceiveDispatcher } from "./NativeMailImportFacadeReceiveDispatcher.js"
import { NativePushFacade } from "@tutao/native-bridge/generatedIpc/types"
import { NativePushFacadeReceiveDispatcher } from "./NativePushFacadeReceiveDispatcher.js"
import { OauthFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OauthFacadeReceiveDispatcher } from "./OauthFacadeReceiveDispatcher.js"
import { SearchTextInAppFacade } from "@tutao/native-bridge/generatedIpc/types"
import { SearchTextInAppFacadeReceiveDispatcher } from "./SearchTextInAppFacadeReceiveDispatcher.js"
import { SettingsFacade } from "@tutao/native-bridge/generatedIpc/types"
import { SettingsFacadeReceiveDispatcher } from "./SettingsFacadeReceiveDispatcher.js"
import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { SqlCipherFacadeReceiveDispatcher } from "./SqlCipherFacadeReceiveDispatcher.js"
import { ThemeFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ThemeFacadeReceiveDispatcher } from "./ThemeFacadeReceiveDispatcher.js"
import { WebAuthnFacade } from "@tutao/native-bridge/generatedIpc/types"
import { WebAuthnFacadeReceiveDispatcher } from "./WebAuthnFacadeReceiveDispatcher.js"

export class DesktopGlobalDispatcher {
	private readonly commonSystemFacade: CommonSystemFacadeReceiveDispatcher
	private readonly desktopSystemFacade: DesktopSystemFacadeReceiveDispatcher
	private readonly exportFacade: ExportFacadeReceiveDispatcher
	private readonly externalCalendarFacade: ExternalCalendarFacadeReceiveDispatcher
	private readonly fileFacade: FileFacadeReceiveDispatcher
	private readonly imapSyncSystemFacade: ImapSyncSystemFacadeReceiveDispatcher
	private readonly interWindowEventFacade: InterWindowEventFacadeReceiveDispatcher
	private readonly nativeCredentialsFacade: NativeCredentialsFacadeReceiveDispatcher
	private readonly nativeCryptoFacade: NativeCryptoFacadeReceiveDispatcher
	private readonly nativeMailImportFacade: NativeMailImportFacadeReceiveDispatcher
	private readonly nativePushFacade: NativePushFacadeReceiveDispatcher
	private readonly oauthFacade: OauthFacadeReceiveDispatcher
	private readonly searchTextInAppFacade: SearchTextInAppFacadeReceiveDispatcher
	private readonly settingsFacade: SettingsFacadeReceiveDispatcher
	private readonly sqlCipherFacade: SqlCipherFacadeReceiveDispatcher
	private readonly themeFacade: ThemeFacadeReceiveDispatcher
	private readonly webAuthnFacade: WebAuthnFacadeReceiveDispatcher
	constructor(
		commonSystemFacade: CommonSystemFacade,
		desktopSystemFacade: DesktopSystemFacade,
		exportFacade: ExportFacade,
		externalCalendarFacade: ExternalCalendarFacade,
		fileFacade: FileFacade,
		imapSyncSystemFacade: ImapSyncSystemFacade,
		interWindowEventFacade: InterWindowEventFacade,
		nativeCredentialsFacade: NativeCredentialsFacade,
		nativeCryptoFacade: NativeCryptoFacade,
		nativeMailImportFacade: NativeMailImportFacade,
		nativePushFacade: NativePushFacade,
		oauthFacade: OauthFacade,
		searchTextInAppFacade: SearchTextInAppFacade,
		settingsFacade: SettingsFacade,
		sqlCipherFacade: SqlCipherFacade,
		themeFacade: ThemeFacade,
		webAuthnFacade: WebAuthnFacade,
	) {
		this.commonSystemFacade = new CommonSystemFacadeReceiveDispatcher(commonSystemFacade)
		this.desktopSystemFacade = new DesktopSystemFacadeReceiveDispatcher(desktopSystemFacade)
		this.exportFacade = new ExportFacadeReceiveDispatcher(exportFacade)
		this.externalCalendarFacade = new ExternalCalendarFacadeReceiveDispatcher(externalCalendarFacade)
		this.fileFacade = new FileFacadeReceiveDispatcher(fileFacade)
		this.imapSyncSystemFacade = new ImapSyncSystemFacadeReceiveDispatcher(imapSyncSystemFacade)
		this.interWindowEventFacade = new InterWindowEventFacadeReceiveDispatcher(interWindowEventFacade)
		this.nativeCredentialsFacade = new NativeCredentialsFacadeReceiveDispatcher(nativeCredentialsFacade)
		this.nativeCryptoFacade = new NativeCryptoFacadeReceiveDispatcher(nativeCryptoFacade)
		this.nativeMailImportFacade = new NativeMailImportFacadeReceiveDispatcher(nativeMailImportFacade)
		this.nativePushFacade = new NativePushFacadeReceiveDispatcher(nativePushFacade)
		this.oauthFacade = new OauthFacadeReceiveDispatcher(oauthFacade)
		this.searchTextInAppFacade = new SearchTextInAppFacadeReceiveDispatcher(searchTextInAppFacade)
		this.settingsFacade = new SettingsFacadeReceiveDispatcher(settingsFacade)
		this.sqlCipherFacade = new SqlCipherFacadeReceiveDispatcher(sqlCipherFacade)
		this.themeFacade = new ThemeFacadeReceiveDispatcher(themeFacade)
		this.webAuthnFacade = new WebAuthnFacadeReceiveDispatcher(webAuthnFacade)
	}

	async dispatch(facadeName: string, methodName: string, args: Array<any>) {
		switch (facadeName) {
			case "CommonSystemFacade":
				return this.commonSystemFacade.dispatch(methodName, args)
			case "DesktopSystemFacade":
				return this.desktopSystemFacade.dispatch(methodName, args)
			case "ExportFacade":
				return this.exportFacade.dispatch(methodName, args)
			case "ExternalCalendarFacade":
				return this.externalCalendarFacade.dispatch(methodName, args)
			case "FileFacade":
				return this.fileFacade.dispatch(methodName, args)
			case "ImapSyncSystemFacade":
				return this.imapSyncSystemFacade.dispatch(methodName, args)
			case "InterWindowEventFacade":
				return this.interWindowEventFacade.dispatch(methodName, args)
			case "NativeCredentialsFacade":
				return this.nativeCredentialsFacade.dispatch(methodName, args)
			case "NativeCryptoFacade":
				return this.nativeCryptoFacade.dispatch(methodName, args)
			case "NativeMailImportFacade":
				return this.nativeMailImportFacade.dispatch(methodName, args)
			case "NativePushFacade":
				return this.nativePushFacade.dispatch(methodName, args)
			case "OauthFacade":
				return this.oauthFacade.dispatch(methodName, args)
			case "SearchTextInAppFacade":
				return this.searchTextInAppFacade.dispatch(methodName, args)
			case "SettingsFacade":
				return this.settingsFacade.dispatch(methodName, args)
			case "SqlCipherFacade":
				return this.sqlCipherFacade.dispatch(methodName, args)
			case "ThemeFacade":
				return this.themeFacade.dispatch(methodName, args)
			case "WebAuthnFacade":
				return this.webAuthnFacade.dispatch(methodName, args)
			default:
				throw new Error("licc messed up! " + facadeName)
		}
	}
}
