import { ProgrammingError } from "./ProgrammingError"
import { isUndefined } from "./boot/TypeChecks"
import { client } from "./boot/ClientDetector"
import { _isNode, _isWorker } from "./boot/TsPlatformConstants"

// keep in sync with LaunchHtml.js meta tag title
export const LOGIN_TITLE = "Mail. Done. Right. Tuta Mail Login & Sign up for an Ad-free Mailbox"
export const enum Mode {
	Browser = "Browser",
	App = "App",
	Test = "Test",
	Playground = "Playground",
	Desktop = "Desktop",
	Admin = "Admin",
}

export function getWebsocketBaseUrl(domainConfig: DomainConfig): string {
	return (
		domainConfig.apiUrl
			// replaces http: with ws: and https: with wss:
			.replace(/^http/, "ws")
	)
}

/** Returns the origin which should be used for API requests. */
export function getApiBaseUrl(domainConfig: DomainConfig): string {
	if (isIOSApp()) {
		// http:// -> api:// and https:// -> apis://
		return domainConfig.apiUrl.replace(/^http/, "api")
	} else {
		return domainConfig.apiUrl
	}
}

export function isIOSApp(): boolean {
	if (isApp() && client.env.platformId == null) {
		throw new ProgrammingError("PlatformId is not set!")
	}
	return isApp() && client.env.platformId === "ios"
}

/**
 * Return true if an Apple device; used for checking if CTRL or CMD/Meta should be used as the primary modifier
 */
export function isAppleDevice(): boolean {
	return client.env.platformId === "darwin" || isIOSApp()
}

export function isAndroidApp(): boolean {
	if (isApp() && client.env.platformId == null) {
		throw new ProgrammingError("PlatformId is not set!")
	}

	return isApp() && client.env.platformId === "android"
}

export function isApp(): boolean {
	return client.env.mode === Mode.App
}

export function isDesktop(): boolean {
	return client.env.mode === Mode.Desktop
}

export function isBrowser(): boolean {
	return client.env.mode === Mode.Browser
}

export function ifDesktop<T>(obj: T | null): T | null {
	return isDesktop() ? obj : null
}

export function isMain(): boolean {
	return !_isWorker && !_isNode
}

export function isWebClient() {
	return client.env.mode === Mode.Browser
}

export function isAdminClient(): boolean {
	return client.env.mode === Mode.Admin
}

export function isElectronClient(): boolean {
	return isDesktop() || isAdminClient()
}

export function isMainOrNode(): boolean {
	return !_isWorker || _isNode || isTest()
}

export function isWorkerOrNode(): boolean {
	return _isWorker || _isNode || isTest()
}

export function isWorker(): boolean {
	return _isWorker
}

export function isTest(): boolean {
	return client.env.mode === Mode.Test
}

export function isDesktopMainThread(): boolean {
	return _isNode && !isUndefined(client.env) && (isDesktop() || isAdminClient())
}

let boot = !isDesktopMainThread() && !isWorker()

/**
 * A hackaround. Set by bundler.
 * Rolldown doesn't inline const enums at the moment, so we can't assert the loading order.
 * If not set defaults to true
 */
const assertionsEnabled = false

export function assertMainOrNode() {
	if (!assertionsEnabled) return

	if (!isMainOrNode()) {
		throw new Error("this code must not run in the worker thread")
	}

	if (boot) {
		throw new Error("this main code must not be loaded at boot time")
	}
}

export function assertMainOrNodeBoot() {
	if (!assertionsEnabled) return

	if (!isMainOrNode()) {
		throw new Error("this code must not run in the worker thread")
	}
}

export function assertWorkerOrNode() {
	if (!assertionsEnabled) return

	if (!isWorkerOrNode()) {
		throw new Error("this code must not run in the gui thread")
	}
}

export function bootFinished() {
	boot = false
}

/**
 * Whether or not we will be using an offline cache (doesn't take into account if credentials are stored)
 */
export function isOfflineStorageAvailable(): boolean {
	return !isBrowser() && !isAdminClient()
}
