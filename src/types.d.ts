/**
 * File for global declarations which are used *in the app* (not in packages).
 *
 * Hey you! Don't import anything in this file, or all these declarations will cease to be global!
 */

declare type NumberString = string
declare type Dict = { [key: string]: string }

/** Requests from main web thread to worker */
declare type WorkerRequestType = "setup" | "reset" | "testEcho" | "testError" | "restRequest" | "facade"

/** Requests from worker web thread to main web thread */
declare type MainRequestType = "facade" | "execNative" | "error"

/** Requests from web to native */
declare type NativeRequestType = "ipc" | "facade"

/** Requests from native to web */
declare type JsRequestType = "ipc"

declare type EnvMode = "Browser" | "App" | "Test" | "Playground" | "Desktop" | "Admin"
declare type PlatformId = "ios" | "android" | "darwin" | "linux" | "win32"

/**
 * Different parameters based on the domain the app is running on.
 */
type DomainConfig = {
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

/** A map from hostname to parameters for that domain. */
type DomainConfigMap = Record<string, DomainConfig>

declare var env: {
	staticUrl?: string // if null the url from the browser is used
	mode: EnvMode
	platformId: PlatformId | null
	dist: boolean
	versionNumber: string
	timeout: number
	domainConfigs: DomainConfigMap
}

type EventRedraw<T extends Event> = T & { redraw?: boolean }
