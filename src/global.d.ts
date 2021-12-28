import type {LoginController} from "./api/main/LoginController";
import type {LanguageViewModel} from "./misc/LanguageViewModel";
import type {IMainLocator} from "./api/main/MainLocator";
import Mithril from "mithril";
import {ClientDetector} from "./misc/ClientDetector";
import {RootView} from "./RootView";
import type {Const} from "./api/common/TutanotaConstants";
import {WhitelabelCustomizations} from "./misc/WhitelabelCustomizations";

interface NativeApp {
	// In desktop we can pass whole objects
	// In app, we can only pass strings
	invoke(message: any)

	attach(handler: (JsMessage) => unknown),

	startWebMessageChannel() // Available in android
}


/**
 * Hot Module Reloading
 *
 * TODO where does hot come from and can we get TS declarations for it?
 */
// declare type Hot = {
// 	exports: any,
// 	require(id: string): any,
// 	id: string,
// 	filename: string,
// 	loaded: boolean,
// 	parent: any,
// 	children: Array<any>,
// 	builtinModules: Array<string>,
// 	hot: null | {
// 		data: Record<string, unknown> | null,
// 		dispose(fn: (data: Record<string, unknown>) => unknown),
// 		accept(fn: () => unknown),
// 	}
// }

declare type Tutao = {
	currentView,
	m: typeof Mithril,
	lang: LanguageViewModel,
	client: ClientDetector,
	root: RootView,
	logins: LoginController,
	Const: typeof Const,
	locator: IMainLocator,
	nativeApp?, // Will either be IosNativeTransport or null
	appState?,
}

declare global {

	type EnvMode = "Browser" | "App" | "Test" | "Playground" | "Desktop" | "Admin"
	type PlatformId = "ios" | "android" | "darwin" | "linux" | "win32"
	var env: {
		staticUrl?: string, // if null the url from the browser is used
		mode: EnvMode,
		platformId: PlatformId | null,
		dist: boolean,
		versionNumber: string,
		timeout: number,
		systemConfig: any,
	}

	interface Window {
		tutao: Tutao,
		nativeApp: NativeApp,
		logger,
		whitelabelCustomizations: WhitelabelCustomizations | null
	}

	// interface WorkerGlobalScope {
	// 	locator: WorkerLocatorType
	// }

	var tutao: Tutao


// override flowlib to include "hot"
// 	var module: {
// 		hot: Hot
// 	}
//
// 	module '@hot' { // hmr, access to previously loaded module
// 		export var module: any;
// 	}

}