/**
 * This file is used for *monkey-patching* existing declarations. Don't use it to declare global variables.
 */

import {Logger} from "./api/common/Logger";
import Mithril from "mithril";
import {LanguageViewModel} from "./misc/LanguageViewModel";
import {ClientDetector} from "./misc/ClientDetector";
import {RootView} from "./RootView";
import {LoginController} from "./api/main/LoginController";
import {IMainLocator} from "./api/main/MainLocator";
import {WhitelabelCustomizations} from "./misc/WhitelabelCustomizations";

interface NativeApp {
	// In desktop we can pass whole objects
	// In app, we can only pass strings
	invoke(message: any)

	attach(handler: (JsMessage) => unknown),

	startWebMessageChannel() // Available in android
}

type Tutao = {
	currentView,
	m: typeof Mithril,
	lang: LanguageViewModel,
	client: ClientDetector,
	root: RootView,
	logins: LoginController,
	locator: IMainLocator | null,
	nativeApp?, // Will either be IosNativeTransport or null
	appState?,
}

// Monkey-patch Window.
// see https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-modifying-module-d-ts.html
declare global {
	interface Window {
		tutao: Tutao,
		nativeApp: NativeApp,
		logger: Logger,
		whitelabelCustomizations: WhitelabelCustomizations | undefined
	}
}