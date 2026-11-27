import { isNotNull, Nullable, ProgrammingError, RuntimeInfo, TsJson, TsRecord, TsString } from "@tutao/lang-api"
import { ClientType } from "./TutanotaConstants"

// keep in sync with LaunchHtml.js meta tag title
export const LOGIN_TITLE: TsString = "Mail. Done. Right. Tuta Mail Login & Sign up for an Ad-free Mailbox"

export const NEXTCLOUD_PREFIX: TsString = "/index.php/apps/tutamail"
export const IntegrationPlatform: Record<IntegrationPlatformName, IntegrationPlatformName> = Object.freeze({
	Nextcloud: "Nextcloud",
})

export type DomainConfigMap = TsRecord<TsString, DomainConfig>
export type EnvType = {
	staticUrl: Nullable<TsString> // if null the url from the browser is used
	mode: Mode
	paymentSetup: PaymentSetup
	dist: boolean
	versionNumber: TsString
	timeout: number
	domainConfigs: DomainConfigMap
	networkDebugging: boolean
	clientName: TsString | null
	integrationPlatform: Nullable<IntegrationPlatformName>
	shadowDomAppRoot: string | null
}

export const enum PaymentSetup {
	// customers can only pay via app store
	Appstore = "appstore",
	// customers can only pay via google play store
	Playstore = "playstore",
	/// credit cards, paypal, invoice etc. this includes fdroid
	Default = "default",
	// this can happen if payment is permanently or temporarily unavailable (mostly when play store billing
	// or StoreKit error out)
	None = "none",
}

/**
 * Different parameters based on the domain the app is running on.
 */
export type DomainConfig = {
	/** Whether it is a well-known domain provided by us. */
	firstPartyDomain: boolean
	/** the other domain in the domain migration for the current staging level */
	partneredDomainTransitionUrl: TsString
	/**
	 *  What URL should be used for REST requests.
	 * Important! You probably do not want to use it directly but rather through the accessor function
	 */
	apiUrl: TsString
	websocketUrl: string
	/**
	 * Which URL should be opened for Webauthn flow on desktop for keys associated with our current domain (tuta.com).
	 */
	webauthnUrl: TsString
	/**
	 * Which URL should b opened for Webauthn flow on desktop for keys associated with our legacy domain (tutanota.com)
	 */
	legacyWebauthnUrl: TsString
	/** Same as {@link webauthnUrl} but for mobile apps. */
	webauthnMobileUrl: TsString
	/** Same as {@link legacyWebauthnUrl} but for mobile apps. */
	legacyWebauthnMobileUrl: TsString
	/** Which URL should be opened for the credit card payment flow. */
	paymentUrl: TsString
	/** Our current Relying Party ID to register the keys for. Superdomain of our domains. */
	webauthnRpId: TsString
	/** URL for the legacy U2F API. */
	u2fAppId: TsString
	/** Which URL to use to build the gift card sharing URL. */
	giftCardBaseUrl: TsString
	/** Which URL to use to build the referral URL. */
	referralBaseUrl: TsString
	/** Base URL for requesting any information from de website */
	websiteBaseUrl: TsString
}

export enum Mode {
	Browser = "Browser",
	Android = "Android",
	Ios = "Ios",
	Test = "Test",
	Linux = "Linux",
	Win32 = "Win32",
	Darwin = "Darwin",
	Admin = "Admin",
}

/**
 * A hackaround. Set by bundler.
 * Rolldown doesn't inline const enums at the moment, so we can't assert the loading order.
 * If not set defaults to true
 */
const assertionsEnabled: boolean = false

export class EnvProvider {
	private static boot: boolean =
		RuntimeInfo._isNode && !RuntimeInfo._isWorker && (EnvProvider.isDesktop(globalThis.env) || EnvProvider.isAdminClient(globalThis.env))

	public constructor(private readonly env: EnvType) {}

	public getStringifiedEnv(): TsString {
		return TsJson.stringify(this.env)
	}

	public getVersionNumber(): TsString {
		return this.env.versionNumber
	}

	public getTimeOutValue(): number {
		return this.env.timeout
	}

	public networkDebuggingEnabled(): boolean {
		return this.env.networkDebugging
	}

	public getClientName(): TsString | null {
		return this.env.clientName
	}

	public isIOSApp(): boolean {
		return this.env.mode === Mode.Ios
	}
	public isAndroidApp(): boolean {
		return this.env.mode === Mode.Android
	}

	public isNextCloudPlugin(): boolean {
		return env.integrationPlatform === IntegrationPlatform.Nextcloud
	}

	public getPathPrefix(): string {
		return isNotNull(this.env.shadowDomAppRoot) ? this.env.shadowDomAppRoot : ""
	}

	public getClientType(): ClientType {
		if (this.isApp()) {
			return ClientType.App
		} else if (this.isDesktop() || this.isAdminClient()) {
			return ClientType.Desktop
		} else {
			return ClientType.Browser
		}
	}

	public setPathPrefix(pathPrefix: TsString): void {
		this.env.shadowDomAppRoot = pathPrefix
	}

	/**
	 * Return true if an Apple device; used for checking if CTRL or CMD/Meta should be used as the primary modifier
	 */
	public isAppleDevice(): boolean {
		return this.env.mode === Mode.Ios || this.env.mode === Mode.Darwin
	}

	public getPaymentSetup(): PaymentSetup {
		return this.env.paymentSetup
	}

	public isApp(): boolean {
		return this.env.mode === Mode.Ios || this.env.mode === Mode.Android
	}

	public isDesktopOrApp(): boolean {
		return this.isDesktop() || this.isApp()
	}

	public isDesktop(): boolean {
		return EnvProvider.isDesktop(this.env)
	}
	private static isDesktop(env: EnvType): boolean {
		return env.mode === Mode.Darwin || env.mode === Mode.Win32 || env.mode === Mode.Linux
	}

	public isBrowser(): boolean {
		return this.env.mode === Mode.Browser
	}

	public isWebClient(): boolean {
		return this.env.mode === Mode.Browser
	}

	public isAdminClient(): boolean {
		return EnvProvider.isAdminClient(this.env)
	}

	private static isAdminClient(env: EnvType): boolean {
		return env.mode === Mode.Admin
	}

	public getMode(): Mode {
		return this.env.mode
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

	public isTest(): boolean {
		return this.env.mode === Mode.Test
	}

	/**
	 * Whether or not we will be using an offline cache (doesn't take into account if credentials are stored)
	 */
	public isOfflineStorageAvailable(): boolean {
		return !this.isBrowser() && !this.isAdminClient()
	}

	public isFullArchiveSearchAvailable(): boolean {
		return this.isOfflineStorageAvailable() && this.isDesktop()
	}

	/** @TTranspileIgnore This method is only called from entryPoint of app which is not used from transpiled code */
	public static bootFinished(): void {
		this.boot = false
	}

	/** @TTranspileIgnore This method is only called from entryPoint of app which is not used from transpiled code */
	public static isBootFinished(): boolean {
		return EnvProvider.boot
	}

	public getWebsocketBaseUrl(domainConfig: DomainConfig): TsString {
		// replaces http: with ws: and https: with wss:
		return domainConfig.apiUrl.replace(/^http/, "ws")
	}

	/** @TTranspileIgnore by the time we make use of transpiled code, this function would not exists */
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

	/** @TTranspileIgnore by the time we make use of transpiled code, this function would not exists */
	public static assertMainOrNodeBoot(): void {
		if (!assertionsEnabled) {
			return
		}

		if (!EnvProvider.isMainOrNode()) {
			throw new ProgrammingError("this code must not run in the worker thread")
		}
	}

	/** @TTranspileIgnore by the time we make use of transpiled code, this function would not exists */
	public static assertWorkerOrNode(): void {
		if (!assertionsEnabled) {
			return
		}

		if (!EnvProvider.isWorkerOrNode()) {
			throw new ProgrammingError("this code must not run in the gui thread")
		}
	}

	public static isTest(): boolean {
		return globalThis.env.mode === Mode.Test
	}
}
