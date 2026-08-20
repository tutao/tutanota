import { ProgrammingError } from "./ProgrammingError"
import { _isNode, _isWorker } from "./TsPlatformConstants"
import { TypeChecks } from "./TsTypeChecks"

// keep in sync with LaunchHtml.js meta tag title
export const LOGIN_TITLE = "Mail. Done. Right. Tuta Mail Login & Sign up for an Ad-free Mailbox"

export type DomainConfigMap = Record<string, DomainConfig>
export type EnvType = {
	staticUrl: string | null // if null the url from the browser is used
	mode: Mode
	platformId: PlatformId | null
	paymentSetup: PaymentSetup
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

export const enum PaymentSetup {
	// customers can only pay via app store
	Appstore = "appstore",
	// customers can only pay via google play store
	Playstore = "playstore",
	/// credit cards, paypal, invoice etc. this includes fdroid
	Default = "default",
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
	private static boot: boolean =
		_isNode && !_isWorker && EnvProvider.tryInitWithGlobalEnv() != null && (EnvProvider.get().isDesktop() || EnvProvider.get().isAdminClient())

	private static singleton: EnvProvider | null = null

	public static get(): EnvProvider {
		EnvProvider.tryInitWithGlobalEnv()
		if (EnvProvider.singleton == null) {
			throw new Error("global var env is not defined yet")
		}
		return EnvProvider.singleton
	}

	public isMainOrNode(): boolean {
		return EnvProvider.isMainOrNode()
	}

	private static tryInitWithGlobalEnv(): EnvProvider | null {
		if (EnvProvider.singleton == null && TypeChecks.hasProperty("env")) {
			EnvProvider.singleton = new EnvProvider(env)
		}
		return EnvProvider.singleton
	}

	public getVersionNumber(): string {
		return this.env.versionNumber
	}

	public getTimeOutValue(): number {
		return this.env.timeout
	}

	constructor(public readonly env: EnvType) {}

	public getPlatformId(): PlatformId | null {
		return this.env.platformId
	}

	public networkDebuggingEnabled(): boolean {
		return this.env.networkDebugging
	}

	public getClientName(): string | null {
		return this.env.clientName
	}

	public isIOSApp(): boolean {
		if (this.isApp() && this.env.platformId == null) {
			throw new ProgrammingError("PlatformId is not set!")
		}
		return this.isApp() && this.env.platformId === PlatformId.Ios
	}

	/**
	 * Return true if an Apple device; used for checking if CTRL or CMD/Meta should be used as the primary modifier
	 */
	public isAppleDevice(): boolean {
		return this.env.platformId === PlatformId.Darwin || this.isIOSApp()
	}

	public isAndroidApp(): boolean {
		if (this.isApp() && this.env.platformId == null) {
			throw new ProgrammingError("PlatformId is not set!")
		}

		return this.isApp() && this.env.platformId === PlatformId.Android
	}

	public getPaymentSetup(): PaymentSetup {
		return this.env.paymentSetup
	}

	public isApp(): boolean {
		return this.env.mode === Mode.App
	}

	public isDesktop(): boolean {
		return this.env.mode === Mode.Desktop
	}

	public isBrowser(): boolean {
		return this.env.mode === Mode.Browser
	}

	public isWebClient(): boolean {
		return this.env.mode === Mode.Browser
	}

	public isAdminClient(): boolean {
		return this.env.mode === Mode.Admin
	}

	isElectronClient(): boolean {
		return this.isDesktop() || this.isAdminClient()
	}

	public static isMainOrNode(): boolean {
		return !_isWorker || _isNode || EnvProvider.isTest()
	}

	public static isWorkerOrNode(): boolean {
		return _isWorker || _isNode || EnvProvider.isTest()
	}

	public static isWorker(): boolean {
		return _isWorker
	}

	public static isMain(): boolean {
		return !_isWorker && !_isNode
	}

	public static isTest(): boolean {
		EnvProvider.tryInitWithGlobalEnv()
		return EnvProvider.singleton?.env.mode === Mode.Test
	}

	/**
	 * Whether or not we will be using an offline cache (doesn't take into account if credentials are stored)
	 */
	public isOfflineStorageAvailable(): boolean {
		return !this.isBrowser() && !this.isAdminClient()
	}

	public static bootFinished(): void {
		this.boot = false
	}

	public static isBootFinished(): boolean {
		return this.boot
	}

	public getWebsocketBaseUrl(domainConfig: DomainConfig): string {
		// replaces http: with ws: and https: with wss:
		return domainConfig.apiUrl.replace(/^http/, "ws")
	}

	/** Returns the origin which should be used for API requests. */
	public getApiBaseUrl(domainConfig: DomainConfig): string {
		if (this.isIOSApp()) {
			// http:// -> api:// and https:// -> apis://
			return domainConfig.apiUrl.replace(/^http/, "api")
		} else {
			return domainConfig.apiUrl
		}
	}

	static assertMainOrNode(): void {
		if (!assertionsEnabled) return

		if (!EnvProvider.isMainOrNode()) {
			throw new Error("this code must not run in the worker thread")
		}

		if (EnvProvider.isBootFinished()) {
			throw new Error("this main code must not be loaded at boot time")
		}
	}

	public static assertMainOrNodeBoot(): void {
		if (!assertionsEnabled) return

		if (!EnvProvider.isMainOrNode()) {
			throw new Error("this code must not run in the worker thread")
		}
	}

	public static assertWorkerOrNode(): void {
		if (!assertionsEnabled) return

		if (!EnvProvider.isWorkerOrNode()) {
			throw new Error("this code must not run in the gui thread")
		}
	}

	public static overrideEnv(env: EnvType): void {
		;(EnvProvider.get().env satisfies EnvType) = env
	}
}
