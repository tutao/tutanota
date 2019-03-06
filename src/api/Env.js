// @flow

// keep in sync with LaunchHtml.js meta tag title
export const LOGIN_TITLE = "Mail. Done. Right. Tutanota Login & Sign up"

export const Mode = {
	Browser: "Browser",
	App: "App",
	Test: "Test",
	Desktop: "Desktop"
}

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

export function isTutanotaDomain(): boolean {
	// *.tutanota.com or without dots (e.g. localhost). otherwise it is a custom domain
	return location.hostname.endsWith("tutanota.com") || location.hostname.indexOf(".") === -1
}

export function isIOSApp(): boolean {
	return env.mode === Mode.App && env.platformId === "ios"
}

export function isAndroidApp(): boolean {
	return env.mode === Mode.App && env.platformId === "android"
}

export function isApp(): boolean {
	return env.mode === Mode.App
}

export function isDesktop(): boolean {
	return env.mode === Mode.Desktop
}

export function ifDesktop<T>(obj: T | null): T | null {
	return isDesktop()
		? obj
		: null
}

let worker = (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
let node = (typeof process === 'object' && typeof process.versions === 'object'
	&& typeof process.versions.node !== 'undefined')

export function isMain(): boolean {
	return !worker && !node
}

export function isAdminClient(): boolean {
	return env.adminTypes.length > 0
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

let boot = !isWorker()

export function assertMainOrNode() {
	if (!isMainOrNode()) {
		throw new Error("this code must not run in the worker thread")
	}
	if (boot) {
		throw new Error("this main code must not be loaded at boot time")
	}
}

export function assertMainOrNodeBoot() {
	if (!isMainOrNode()) {
		throw new Error("this code must not run in the worker thread")
	}
}

export function assertWorkerOrNode() {
	if (!isWorkerOrNode()) {
		throw new Error("this code must not run in the gui thread")
	}
}

export function bootFinished() {
	boot = false
}