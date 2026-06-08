import { ProgrammingError } from "./ProgrammingError"

// keep in sync with LaunchHtml.js meta tag title
export const LOGIN_TITLE = "Mail. Done. Right. Tuta Mail Login & Sign up for an Ad-free Mailbox"

export type DomainConfigMap = Record<string, DomainConfig>
export type EnvType = {
	staticUrl: string | null // if null the url from the browser is used
	mode: Mode
	platformId: PlatformId | null
	dist: boolean
	versionNumber: string
	timeout: number
	domainConfigs: DomainConfigMap
	networkDebugging: boolean
	clientName: string | null
}
export const enum PlatformId {
	Ios = "ios",
	Android = "android",
	Darwin = "darwin",
	Linux = "linux",
	Win32 = "win32",
}

/**
 * Different parameters based on the domain the app is running on.
 */
export type DomainConfig = {
	/** Whether it is a well-known domain provided by us. */
	firstPartyDomain: boolean
	/** the other domain in the domain migration for the current staging level */
	partneredDomainTransitionUrl: string
	/**
	 *  What URL should be used for REST requests.
	 * Important! You probably do not want to use it directly but rather through the accessor function
	 */
	apiUrl: string
	/**
	 * Which URL should be opened for Webauthn flow on desktop for keys associated with our current domain (tuta.com).
	 */
	webauthnUrl: string
	/**
	 * Which URL should b opened for Webauthn flow on desktop for keys associated with our legacy domain (tutanota.com)
	 */
	legacyWebauthnUrl: string
	/** Same as {@link webauthnUrl} but for mobile apps. */
	webauthnMobileUrl: string
	/** Same as {@link legacyWebauthnUrl} but for mobile apps. */
	legacyWebauthnMobileUrl: string
	/** Which URL should be opened for the credit card payment flow. */
	paymentUrl: string
	/** Our current Relying Party ID to register the keys for. Superdomain of our domains. */
	webauthnRpId: string
	/** URL for the legacy U2F API. */
	u2fAppId: string
	/** Which URL to use to build the gift card sharing URL. */
	giftCardBaseUrl: string
	/** Which URL to use to build the referral URL. */
	referralBaseUrl: string
	/** Base URL for requesting any information from de website */
	websiteBaseUrl: string
}

export const enum Mode {
	Browser = "Browser",
	App = "App",
	Test = "Test",
	Playground = "Playground",
	Desktop = "Desktop",
	Admin = "Admin",
}

/**
 * A hackaround. Set by bundler.
 * Rolldown doesn't inline const enums at the moment, so we can't assert the loading order.
 * If not set defaults to true
 */
const assertionsEnabled = false
export class EnvProvider {
	private readonly worker: boolean
	private readonly node: boolean
	private boot: boolean
	constructor(private readonly env: EnvType) {
		this.worker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope
		this.node = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node !== "undefined"
		const isDesktopMainThread = this.node && typeof this.env !== "undefined" && (this.isDesktop() || this.isAdminClient())
		this.boot = !isDesktopMainThread && !this.worker
	}

	isIOSApp(): boolean {
		if (this.isApp() && this.env.platformId == null) {
			throw new ProgrammingError("PlatformId is not set!")
		}
		return this.isApp() && this.env.platformId === PlatformId.Ios
	}

	/**
	 * Return true if an Apple device; used for checking if CTRL or CMD/Meta should be used as the primary modifier
	 */
	isAppleDevice(): boolean {
		return this.env.platformId === PlatformId.Darwin || this.isIOSApp()
	}

	isAndroidApp(): boolean {
		if (this.isApp() && this.env.platformId == null) {
			throw new ProgrammingError("PlatformId is not set!")
		}

		return this.isApp() && this.env.platformId === PlatformId.Android
	}

	isApp(): boolean {
		return this.env.mode === Mode.App
	}

	isDesktop(): boolean {
		return this.env.mode === Mode.Desktop
	}

	isBrowser(): boolean {
		return this.env.mode === Mode.Browser
	}

	isWebClient() {
		return this.env.mode === Mode.Browser
	}

	isAdminClient(): boolean {
		return this.env.mode === Mode.Admin
	}

	isElectronClient(): boolean {
		return this.isDesktop() || this.isAdminClient()
	}

	isMainOrNode(): boolean {
		return !this.worker || this.node || this.isTest()
	}

	isWorkerOrNode(): boolean {
		return this.worker || this.node || this.isTest()
	}

	isWorker(): boolean {
		return this.worker
	}

	isMain(): boolean {
		return !this.worker && !this.node
	}

	isTest(): boolean {
		return this.env.mode === Mode.Test
	}

	/**
	 * Whether or not we will be using an offline cache (doesn't take into account if credentials are stored)
	 */
	isOfflineStorageAvailable(): boolean {
		return !this.isBrowser() && !this.isAdminClient()
	}
	bootFinished() {
		this.boot = false
	}

	isBootFinished() {
		return this.boot
	}

	getWebsocketBaseUrl(domainConfig: DomainConfig): string {
		// replaces http: with ws: and https: with wss:
		return domainConfig.apiUrl.replace(/^http/, "ws")
	}

	/** Returns the origin which should be used for API requests. */
	getApiBaseUrl(domainConfig: DomainConfig): string {
		if (this.isIOSApp()) {
			// http:// -> api:// and https:// -> apis://
			return domainConfig.apiUrl.replace(/^http/, "api")
		} else {
			return domainConfig.apiUrl
		}
	}

	assertMainOrNode() {
		if (!assertionsEnabled) return

		if (!envProvider.isMainOrNode()) {
			throw new Error("this code must not run in the worker thread")
		}

		if (envProvider.isBootFinished()) {
			throw new Error("this main code must not be loaded at boot time")
		}
	}

	assertMainOrNodeBoot() {
		if (!assertionsEnabled) return

		if (!envProvider.isMainOrNode()) {
			throw new Error("this code must not run in the worker thread")
		}
	}

	assertWorkerOrNode() {
		if (!assertionsEnabled) return

		if (!envProvider.isWorkerOrNode()) {
			throw new Error("this code must not run in the gui thread")
		}
	}
}
export const envProvider = new EnvProvider(env)

// ========================================================
// TODO: Inline these (CTRL+ALT+N), it will just change all files that import it
export function assertMainOrNode() {
	return envProvider.assertMainOrNode()
}
export function assertMainOrNodeBoot() {
	return envProvider.assertMainOrNodeBoot()
}
export function assertWorkerOrNode() {
	return envProvider.assertWorkerOrNode()
}
export function isIOSApp() {
	return envProvider.isIOSApp()
}
export function isAppleDevice() {
	return envProvider.isAppleDevice()
}
export function isAndroidApp() {
	return envProvider.isAndroidApp()
}
export function isApp() {
	return envProvider.isApp()
}
export function isDesktop() {
	return envProvider.isDesktop()
}
export function isBrowser() {
	return envProvider.isBrowser()
}
export function isWebClient() {
	return envProvider.isWebClient()
}
export function isAdminClient() {
	return envProvider.isAdminClient()
}
export function isElectronClient() {
	return envProvider.isElectronClient()
}
export function isMainOrNode() {
	return envProvider.isMainOrNode()
}
export function isWorkerOrNode() {
	return envProvider.isWorkerOrNode()
}
export function isWorker() {
	return envProvider.isWorker()
}
export function isMain() {
	return envProvider.isMain()
}
export const isTest = () => {
	return envProvider.isTest()
}
export const isOfflineStorageAvailable = () => {
	return envProvider.isOfflineStorageAvailable()
}
export const getApiBaseUrl = (dc: DomainConfig) => {
	return envProvider.getApiBaseUrl(dc)
}
export const getWebsocketBaseUrl: typeof envProvider.getWebsocketBaseUrl = (dc: DomainConfig) => {
	return envProvider.getWebsocketBaseUrl(dc)
}

export const bootFinished = () => {
	envProvider.bootFinished()
}
