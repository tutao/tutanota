import type {LoginController} from "./api/main/LoginController";
import type {LanguageViewModel} from "./misc/LanguageViewModel";
import type {IMainLocator} from "./api/main/MainLocator";


interface NativeApp {
	invoke(message: string)

	attach(handler: (JsMessage) => unknown),

	startWebMessageChannel() // Available in android
}


/**
 * Hot Module Reloading
 *
 * TODO where does hot come from and can we get TS declarations for it?
 */

declare type Hot = {
	exports: any,
	require(id: string): any,
	id: string,
	filename: string,
	loaded: boolean,
	parent: any,
	children: Array<any>,
	builtinModules: Array<string>,
	hot: null | {
		data: {[string]: unknown} | null,
		dispose(fn: (data: {[string]: unknown}) => unknown),
		accept(fn: () => unknown),
	}
}

declare global {

	declare type EnvMode = "Browser" | "App" | "Test" | "Playground" | "Desktop" | "Admin"

	declare var env: {
		staticUrl: ?string, // if null the url from the browser is used
		mode: EnvMode,
		platformId: ?"ios" | ?"android" | ?"darwin" | ?"linux" | ?"win32",
		dist: boolean,
		versionNumber: string,
		timeout: number,
		systemConfig: any,
	}

	interface Window {
		tutao: {
			currentView,
			m: Mithril,
			lang: LanguageViewModel,
			client: ClientDetector,
			root: RootView,
			logins: LoginController,
			Const: typeof Const,
			locator: IMainLocator,
			nativeApp?, // Will either be IosNativeTransport or null
			appState,
		},
		nativeApp: NativeApp
	}


// override flowlib to include "hot"
	declare var module = {
		hot: Hot
	}

	declare module '@hot' { // hmr, access to previously loaded module
		declare export var module: any;
	}

}