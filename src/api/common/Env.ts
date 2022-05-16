//@bundleInto:common-min

// keep in sync with LaunchHtml.js meta tag title
export const LOGIN_TITLE = "Mail. Done. Right. Tutanota Login & Sign up for an Ad-free Mailbox"
export const Mode: Record<EnvMode, EnvMode> = Object.freeze({
	Browser: "Browser",
	App: "App",
	Test: "Test",
	Playground: "Playground",
	Desktop: "Desktop",
	Admin: "Admin",
})

export function getWebsocketOrigin(): string {
	// replace "http" by "ws"
	return "ws" + getHttpOrigin().substring(4)
}

export function getHttpOrigin(): string {
	if (env.staticUrl) {
		return env.staticUrl
	} else {
		return location.protocol + "//" + location.hostname + (location.port ? ":" + location.port : "")
	}
}

export function getWebRoot(): string {
	const origin = getHttpOrigin()
	return origin + (origin.includes("localhost") || origin.includes("local.tutanota.com") ? "/client/build" : "")
}

export function getPaymentWebRoot(): string {
	if (env.staticUrl === "mail.tutanota.com") {
		return "https://pay.tutanota.com"
	} else if (env.staticUrl === "test.tutanota.com") {
		return "https://pay.test.tutanota.com"
	} else {
		return getWebRoot()
	}
}

export function isTutanotaDomain(): boolean {
	// *.tutanota.com or without dots (e.g. localhost). otherwise it is a custom domain
	return location.hostname.endsWith("tutanota.com") || location.hostname.indexOf(".") === -1
}

export function isIOSApp(): boolean {
	if (isWorker()) {
		throw new Error("isIOSApp is not available in the worker yet (platformId is not set)")
	}

	return env.mode === Mode.App && env.platformId === "ios"
}

export function isAndroidApp(): boolean {
	if (isWorker()) {
		throw new Error("isAndroidApp is not available in the worker yet (platformId is not set)")
	}

	return env.mode === Mode.App && env.platformId === "android"
}

export function isApp(): boolean {
	return env.mode === Mode.App
}

export function isDesktop(): boolean {
	return env.mode === Mode.Desktop
}

export function isBrowser(): boolean {
	return env.mode === Mode.Browser
}

export function ifDesktop<T>(obj: T | null): T | null {
	return isDesktop() ? obj : null
}

let worker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope
let node = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node !== "undefined"

export function isMain(): boolean {
	return !worker && !node
}

export function isAdminClient(): boolean {
	return env.mode === Mode.Admin
}

export function isMainOrNode(): boolean {
	return !worker || node || env.mode === Mode.Test
}

export function isWorkerOrNode(): boolean {
	return worker || node || env.mode === Mode.Test
}

export function isWorker(): boolean {
	return worker
}

export function isTest(): boolean {
	return env.mode === Mode.Test
}

export function isDesktopMainThread(): boolean {
	return node && typeof env !== "undefined" && (env.mode === Mode.Desktop || env.mode === Mode.Admin)
}

let boot = !isDesktopMainThread() && !isWorker()

/**
 * A hackaround set by esbuild.
 * We have to bundle our project with esbuild now which puts everything together which means it won't be loaded at correct time and/or some thing might get
 * included where they shouldn't so for debug builds we set this flag to not take care of this.
 */
declare var NO_THREAD_ASSERTIONS: boolean
const assertionsEnabled = typeof NO_THREAD_ASSERTIONS === "undefined" || !NO_THREAD_ASSERTIONS

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
	return isDesktop()
}

export function assertOfflineStorageAvailable() {
	if (!isOfflineStorageAvailable()) {
		throw new Error("Offline storage is not available")
	}
	return isDesktop()
}