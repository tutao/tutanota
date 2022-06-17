/* generated file, don't edit. */


import {CommonSystemFacade} from "./CommonSystemFacade.js"
import {CommonSystemFacadeReceiveDispatcher} from "./CommonSystemFacadeReceiveDispatcher.js"
import {DesktopSystemFacade} from "./DesktopSystemFacade.js"
import {DesktopSystemFacadeReceiveDispatcher} from "./DesktopSystemFacadeReceiveDispatcher.js"
import {ExportFacade} from "./ExportFacade.js"
import {ExportFacadeReceiveDispatcher} from "./ExportFacadeReceiveDispatcher.js"
import {FileFacade} from "./FileFacade.js"
import {FileFacadeReceiveDispatcher} from "./FileFacadeReceiveDispatcher.js"
import {NativeCredentialsFacade} from "./NativeCredentialsFacade.js"
import {NativeCredentialsFacadeReceiveDispatcher} from "./NativeCredentialsFacadeReceiveDispatcher.js"
import {NativeCryptoFacade} from "./NativeCryptoFacade.js"
import {NativeCryptoFacadeReceiveDispatcher} from "./NativeCryptoFacadeReceiveDispatcher.js"
import {NativePushFacade} from "./NativePushFacade.js"
import {NativePushFacadeReceiveDispatcher} from "./NativePushFacadeReceiveDispatcher.js"
import {SearchTextInAppFacade} from "./SearchTextInAppFacade.js"
import {SearchTextInAppFacadeReceiveDispatcher} from "./SearchTextInAppFacadeReceiveDispatcher.js"
import {SettingsFacade} from "./SettingsFacade.js"
import {SettingsFacadeReceiveDispatcher} from "./SettingsFacadeReceiveDispatcher.js"
import {ThemeFacade} from "./ThemeFacade.js"
import {ThemeFacadeReceiveDispatcher} from "./ThemeFacadeReceiveDispatcher.js"

export class DesktopGlobalDispatcher {
	private readonly commonSystemFacade : CommonSystemFacadeReceiveDispatcher
	private readonly desktopSystemFacade : DesktopSystemFacadeReceiveDispatcher
	private readonly exportFacade : ExportFacadeReceiveDispatcher
	private readonly fileFacade : FileFacadeReceiveDispatcher
	private readonly nativeCredentialsFacade : NativeCredentialsFacadeReceiveDispatcher
	private readonly nativeCryptoFacade : NativeCryptoFacadeReceiveDispatcher
	private readonly nativePushFacade : NativePushFacadeReceiveDispatcher
	private readonly searchTextInAppFacade : SearchTextInAppFacadeReceiveDispatcher
	private readonly settingsFacade : SettingsFacadeReceiveDispatcher
	private readonly themeFacade : ThemeFacadeReceiveDispatcher
	constructor(
		commonSystemFacade : CommonSystemFacade,
		desktopSystemFacade : DesktopSystemFacade,
		exportFacade : ExportFacade,
		fileFacade : FileFacade,
		nativeCredentialsFacade : NativeCredentialsFacade,
		nativeCryptoFacade : NativeCryptoFacade,
		nativePushFacade : NativePushFacade,
		searchTextInAppFacade : SearchTextInAppFacade,
		settingsFacade : SettingsFacade,
		themeFacade : ThemeFacade,
	) {
		this.commonSystemFacade = new CommonSystemFacadeReceiveDispatcher(commonSystemFacade)
		this.desktopSystemFacade = new DesktopSystemFacadeReceiveDispatcher(desktopSystemFacade)
		this.exportFacade = new ExportFacadeReceiveDispatcher(exportFacade)
		this.fileFacade = new FileFacadeReceiveDispatcher(fileFacade)
		this.nativeCredentialsFacade = new NativeCredentialsFacadeReceiveDispatcher(nativeCredentialsFacade)
		this.nativeCryptoFacade = new NativeCryptoFacadeReceiveDispatcher(nativeCryptoFacade)
		this.nativePushFacade = new NativePushFacadeReceiveDispatcher(nativePushFacade)
		this.searchTextInAppFacade = new SearchTextInAppFacadeReceiveDispatcher(searchTextInAppFacade)
		this.settingsFacade = new SettingsFacadeReceiveDispatcher(settingsFacade)
		this.themeFacade = new ThemeFacadeReceiveDispatcher(themeFacade)
	}
	
	async dispatch(facadeName: string, methodName: string, args: Array<any>) {
		switch (facadeName) {
			case "CommonSystemFacade":
				return this.commonSystemFacade.dispatch(methodName, args)
			case "DesktopSystemFacade":
				return this.desktopSystemFacade.dispatch(methodName, args)
			case "ExportFacade":
				return this.exportFacade.dispatch(methodName, args)
			case "FileFacade":
				return this.fileFacade.dispatch(methodName, args)
			case "NativeCredentialsFacade":
				return this.nativeCredentialsFacade.dispatch(methodName, args)
			case "NativeCryptoFacade":
				return this.nativeCryptoFacade.dispatch(methodName, args)
			case "NativePushFacade":
				return this.nativePushFacade.dispatch(methodName, args)
			case "SearchTextInAppFacade":
				return this.searchTextInAppFacade.dispatch(methodName, args)
			case "SettingsFacade":
				return this.settingsFacade.dispatch(methodName, args)
			case "ThemeFacade":
				return this.themeFacade.dispatch(methodName, args)
			default:
				throw new Error("licc messed up! " + facadeName)
		}
	}
}
