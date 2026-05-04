/**
 * This file is used for *monkey-patching* existing declarations. Don't use it to declare global variables.
 */

export { NativeApp } from "../types/globals"

type Tutao = {
	currentView: TopLevelView | null
	m: typeof Mithril
	lang: LanguageViewModel
	client: ClientDetector
	root: RootView
	locator: CommonLocator | null
	nativeApp? // Will either be IosNativeTransport or null
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

	interface WorkerGlobalScope {
		locator: WorkerLocatorType
	}
}
