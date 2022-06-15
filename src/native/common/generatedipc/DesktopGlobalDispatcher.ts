/* generated file, don't edit. */


import {FileFacade} from "./FileFacade.js"
import {FileFacadeReceiveDispatcher} from "./FileFacadeReceiveDispatcher.js"
import {NativeCredentialsFacade} from "./NativeCredentialsFacade.js"
import {NativeCredentialsFacadeReceiveDispatcher} from "./NativeCredentialsFacadeReceiveDispatcher.js"
import {NativeCryptoFacade} from "./NativeCryptoFacade.js"
import {NativeCryptoFacadeReceiveDispatcher} from "./NativeCryptoFacadeReceiveDispatcher.js"
import {NativePushFacade} from "./NativePushFacade.js"
import {NativePushFacadeReceiveDispatcher} from "./NativePushFacadeReceiveDispatcher.js"
import {ThemeFacade} from "./ThemeFacade.js"
import {ThemeFacadeReceiveDispatcher} from "./ThemeFacadeReceiveDispatcher.js"

export class DesktopGlobalDispatcher {
	private readonly fileFacade : FileFacadeReceiveDispatcher
	private readonly nativeCredentialsFacade : NativeCredentialsFacadeReceiveDispatcher
	private readonly nativeCryptoFacade : NativeCryptoFacadeReceiveDispatcher
	private readonly nativePushFacade : NativePushFacadeReceiveDispatcher
	private readonly themeFacade : ThemeFacadeReceiveDispatcher
	constructor(
		fileFacade : FileFacade,
		nativeCredentialsFacade : NativeCredentialsFacade,
		nativeCryptoFacade : NativeCryptoFacade,
		nativePushFacade : NativePushFacade,
		themeFacade : ThemeFacade,
	) {
		this.fileFacade = new FileFacadeReceiveDispatcher(fileFacade)
		this.nativeCredentialsFacade = new NativeCredentialsFacadeReceiveDispatcher(nativeCredentialsFacade)
		this.nativeCryptoFacade = new NativeCryptoFacadeReceiveDispatcher(nativeCryptoFacade)
		this.nativePushFacade = new NativePushFacadeReceiveDispatcher(nativePushFacade)
		this.themeFacade = new ThemeFacadeReceiveDispatcher(themeFacade)
	}
	
	async dispatch(facadeName: string, methodName: string, args: Array<any>) {
		switch (facadeName) {
			case "FileFacade":
				return this.fileFacade.dispatch(methodName, args)
			case "NativeCredentialsFacade":
				return this.nativeCredentialsFacade.dispatch(methodName, args)
			case "NativeCryptoFacade":
				return this.nativeCryptoFacade.dispatch(methodName, args)
			case "NativePushFacade":
				return this.nativePushFacade.dispatch(methodName, args)
			case "ThemeFacade":
				return this.themeFacade.dispatch(methodName, args)
			default:
				throw new Error("licc messed up! " + facadeName)
		}
	}
}
