/**
 * This file is used for *monkey-patching* existing declarations. Don't use it to declare global variables.
 */

import { Logger } from "./api/common/Logger"
import Mithril from "mithril"
import { LanguageViewModel } from "./misc/LanguageViewModel"
import { ClientDetector } from "./misc/ClientDetector"
import { RootView } from "./RootView"
import { ICommonLocator } from "./api/main/CommonLocator"
import { WhitelabelCustomizations } from "./misc/WhitelabelCustomizations"
import { WorkerLocatorType } from "./api/worker/WorkerLocator"
import { TopLevelView } from "./TopLevelView.js"

interface NativeApp {
	// In desktop we can pass whole objects
	// In app, we can only pass strings
	invoke(message: any)

	attach(handler: (JsMessage) => unknown)

	startWebMessageChannel() // Available in android
}

type Tutao = {
	currentView: TopLevelView | null
	m: typeof Mithril
	lang: LanguageViewModel
	client: ClientDetector
	root: RootView
	locator: ICommonLocator | null
	nativeApp? // Will either be IosNativeTransport or null
	appState?
}

// Monkey-patch Window.
// see https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-modifying-module-d-ts.html
declare global {
	interface Window {
		tutao: Tutao
		logger: Logger
		/** Set by the server for whitelabel domains. */
		whitelabelCustomizations: WhitelabelCustomizations | undefined
		/** The NativeApp for use in the main client */
		nativeApp: NativeApp
		/**
		 * The NativeApp for use in web dialogs.
		 * It's existence can be used to determine whether or not we are inside a web dialog
		 * */
		nativeAppWebDialog: NativeApp | undefined
	}

	declare var CompressionStream: any // remove after switching to typescript 5.3.3

	interface WorkerGlobalScope {
		locator: WorkerLocatorType
	}
}
