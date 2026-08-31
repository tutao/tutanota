import {
	isNotNull,
	isNull,
	ProgrammingError,
	RuntimeInfo,
	TMutableStaticSafety,
	TMutableStaticSafetyKind,
	TsRecord,
	TsString,
	TTranspileIgnore,
} from "@tutao/lang-api"

// keep in sync with LaunchHtml.js meta tag title
export const LOGIN_TITLE = "Mail. Done. Right. Tuta Mail Login & Sign up for an Ad-free Mailbox"

export type DomainConfigMap = TsRecord<string, DomainConfig>
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
	apiUrl: TsString
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
const assertionsEnabled: boolean = false

export class EnvProvider {
	@TTranspileIgnore({
		reason: `
			This is all method that uses this field is @TranspileIgnore
		`,
	})
	private static boot: boolean =
		RuntimeInfo._isNode &&
		!RuntimeInfo._isWorker &&
		isNotNull(EnvProvider.tryInitWithGlobalEnv()) &&
		(EnvProvider.get().isDesktop() || EnvProvider.get().isAdminClient())

	@TMutableStaticSafety({ kind: TMutableStaticSafetyKind.MainThreadInitialized })
	private static singleton: EnvProvider | null = null

	@TTranspileIgnore({ reason: "This method is only used from locator" })
	public static get(): EnvProvider {
		const singleton = EnvProvider.tryInitWithGlobalEnv()
		if (isNull(singleton)) {
			throw new ProgrammingError("global var env is not defined yet")
		}
		return singleton
	}

	public constructor(private readonly env: EnvType) {}

	public isMainOrNode(): boolean {
		return EnvProvider.isMainOrNode()
	}

	@TMutableStaticSafety({ kind: TMutableStaticSafetyKind.MainThreadInitialized })
	private static tryInitWithGlobalEnv(): EnvProvider | null {
		if (isNull(EnvProvider.singleton)) {
			const env = RuntimeInfo.globallyDefinedEnv<EnvType>()
			if (isNotNull(env)) {
				EnvProvider.singleton = new EnvProvider(env)
			}
		}
		return EnvProvider.singleton
	}

	public getVersionNumber(): string {
		return this.env.versionNumber
	}

	public getTimeOutValue(): number {
		return this.env.timeout
	}

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
		if (this.isApp() && isNull(this.env.platformId)) {
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
		if (this.isApp() && isNull(this.env.platformId)) {
			throw new ProgrammingError("PlatformId is not set!")
		}

		return this.isApp() && this.env.platformId === PlatformId.Android
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
		return !RuntimeInfo._isWorker || RuntimeInfo._isNode || EnvProvider.isTest()
	}

	public static isWorkerOrNode(): boolean {
		return RuntimeInfo._isWorker || RuntimeInfo._isNode || EnvProvider.isTest()
	}

	public static isWorker(): boolean {
		return RuntimeInfo._isWorker
	}

	public static isMain(): boolean {
		return !RuntimeInfo._isWorker && !RuntimeInfo._isNode
	}

	public static isTest(): boolean {
		EnvProvider.tryInitWithGlobalEnv()
		return isNotNull(EnvProvider.singleton) && EnvProvider.singleton.env.mode === Mode.Test
	}

	/**
	 * Whether or not we will be using an offline cache (doesn't take into account if credentials are stored)
	 */
	public isOfflineStorageAvailable(): boolean {
		return !this.isBrowser() && !this.isAdminClient()
	}

	@TTranspileIgnore({
		reason: `
		This method is only called from entryPoint of app which is not
		used from transpiled code
	`,
	})
	public static bootFinished(): void {
		this.boot = false
	}

	@TTranspileIgnore({
		reason: `
		This method is only called from entryPoint of app which is not
		used from transpiled code
	`,
	})
	public static isBootFinished(): boolean {
		return EnvProvider.boot
	}

	public getWebsocketBaseUrl(domainConfig: DomainConfig): TsString {
		// replaces http: with ws: and https: with wss:
		return domainConfig.apiUrl.replace(/^http/, "ws")
	}

	/** Returns the origin which should be used for API requests. */
	public getApiBaseUrl(domainConfig: DomainConfig): TsString {
		if (this.isIOSApp()) {
			// http:// -> api:// and https:// -> apis://
			return domainConfig.apiUrl.replace(/^http/, "api")
		} else {
			return domainConfig.apiUrl
		}
	}

	@TTranspileIgnore({
		reason: "This is irrelevant to the transpiled code",
	})
	public static assertMainOrNode(): void {
		if (!assertionsEnabled) {
			return
		}

		if (!EnvProvider.isMainOrNode()) {
			throw new ProgrammingError("this code must not run in the worker thread")
		}

		if (EnvProvider.isBootFinished()) {
			throw new ProgrammingError("this main code must not be loaded at boot time")
		}
	}

	public static assertMainOrNodeBoot(): void {
		if (!assertionsEnabled) {
			return
		}

		if (!EnvProvider.isMainOrNode()) {
			throw new ProgrammingError("this code must not run in the worker thread")
		}
	}

	public static assertWorkerOrNode(): void {
		if (!assertionsEnabled) {
			return
		}

		if (!EnvProvider.isWorkerOrNode()) {
			throw new ProgrammingError("this code must not run in the gui thread")
		}
	}

	public static overrideEnv(env: EnvType): void {
		EnvProvider.singleton = new EnvProvider(env)
	}
}
