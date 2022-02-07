import {client} from "./misc/ClientDetector"
import m, {Component, RouteDefs, RouteResolver} from "mithril"
import {lang, languageCodeToTag, languages} from "./misc/LanguageViewModel"
import {root} from "./RootView"
import {disableErrorHandlingDuringLogout, handleUncaughtError} from "./misc/ErrorHandler"
import "./gui/main-styles"
import {assertMainOrNodeBoot, bootFinished, isApp, isDesktop, isTutanotaDomain} from "./api/common/Env"
import {logins} from "./api/main/LoginController"
import type {lazy} from "@tutao/tutanota-utils"
import {downcast, neverNull} from "@tutao/tutanota-utils"
import {routeChange} from "./misc/RouteChange"
import {windowFacade} from "./misc/WindowFacade"
import {styles} from "./gui/styles"
import {deviceConfig} from "./misc/DeviceConfig"
import {Logger, replaceNativeLogger} from "./api/common/Logger"
import {init as initSW} from "./serviceworker/ServiceWorkerClient"
import {applicationPaths} from "./ApplicationPaths"
import {ProgrammingError} from "./api/common/error/ProgrammingError"
import {CurrentView} from "./gui/base/Header"
import {NativeWebauthnView} from "./login/NativeWebauthnView"
import {WebauthnNativeBridge} from "./native/main/WebauthnNativeBridge"

assertMainOrNodeBoot()
bootFinished()
const urlQueryParams = m.parseQueryString(location.search)
const platformId = urlQueryParams["platformId"]

if (isApp() || isDesktop()) {
	if (
		(isApp() && (platformId === "android" || platformId === "ios")) ||
		(isDesktop() && (platformId === "linux" || platformId === "win32" || platformId === "darwin"))
	) {
		env.platformId = platformId
	} else {
		throw new ProgrammingError(`Invalid platform id: ${String(platformId)}`)
	}
}

replaceNativeLogger(window, new Logger())
type View = Record<string, any>
let currentView: Component<unknown> | null = null
window.tutao = {
	client,
	m,
	lang,
	root,
	logins,
	currentView,
	locator: window.tutao?.locator, // locator is not restored on hot reload otherwise
}
client.init(navigator.userAgent, navigator.platform)

if (!client.isSupported()) {
	throw new Error("Unsupported")
}

// Setup exception handling after checking for client support, because in android the Error is caught by the unhandled rejection handler
// and then the "Update WebView" message will never be show
// we still want to do this ASAP so we can handle other errors
setupExceptionHandling()
// this needs to stay after client.init
windowFacade.init()
export const state: {
	prefix: string | null
	prefixWithoutFile: string | null
} =
	// @ts-ignore
	typeof module != "undefined" && module.hot && module.hot.data
		// @ts-ignore
		? downcast(module.hot.data.state)
		: {
			prefix: null,
			prefixWithoutFile: null,
		}
let startRoute = "/"

if (state.prefix == null) {
	const prefix = (state.prefix =
		location.pathname[location.pathname.length - 1] !== "/" ? location.pathname : location.pathname.substring(0, location.pathname.length - 1))
	state.prefixWithoutFile = prefix.includes(".") ? prefix.substring(0, prefix.lastIndexOf("/")) : prefix
	let redirectTo = urlQueryParams["r"] // redirection triggered by the server (e.g. the user reloads /mail/id by pressing F5)

	if (redirectTo) {
		delete urlQueryParams["r"]

		if (typeof redirectTo !== "string") {
			redirectTo = ""
		}
	} else {
		redirectTo = ""
	}

	let newQueryString = m.buildQueryString(urlQueryParams)

	if (newQueryString.length > 0) {
		newQueryString = "?" + newQueryString
	}

	let target = redirectTo + newQueryString + location.hash
	if (target === "" || target[0] !== "/") target = "/" + target
	history.replaceState(null, "", neverNull(state.prefix) + target)
	startRoute = target
}

// Write it here for the WorkerClient so that it can load relative worker easily. Should do it here so that it doesn't break after HMR.
window.tutao.appState = state
let origin = location.origin

if (location.origin.indexOf("localhost") !== -1) {
	origin += "/client/build/index"
}

if (!isDesktop() && typeof navigator.registerProtocolHandler === "function") {
	try {
		// @ts-ignore third argument removed from spec, but use is still recommended
		navigator.registerProtocolHandler("mailto", origin + "/mailto#url=%s", "Tutanota")
	} catch (e) {
		// Catch SecurityError's and some other cases when we are not allowed to register a handler
		console.log("Failed to register a mailto: protocol handler ", e)
	}
}

import("./translations/en")
	.then(en => lang.init(en.default))
	.then(async () => {
		// do this after lang initialized
		const {locator} = await import("./api/main/MainLocator")
		await locator.init()

		if (client.isIE()) {
			import("./gui/base/NotificationOverlay.js").then(module =>
				module.show(
					{
						view: () => m("", lang.get("unsupportedBrowserOverlay_msg")),
					},
					{
						label: "close_alt",
					},
					[],
				),
			)
		} else if (isDesktop()) {
			import("./native/main/UpdatePrompt.js").then(({registerForUpdates}) => registerForUpdates(locator.native))
		}

		const userLanguage = deviceConfig.getLanguage() && languages.find(l => l.code === deviceConfig.getLanguage())

		if (userLanguage) {
			const language = {
				code: userLanguage.code,
				languageTag: languageCodeToTag(userLanguage.code),
			}
			lang.setLanguage(language).catch(e => {
				console.error("Failed to fetch translation: " + userLanguage.code, e)
			})

			if (isApp() || isDesktop()) {
				locator.systemApp.changeSystemLanguage(language)
			}
		}

		function createViewResolver(getView: lazy<Promise<CurrentView>>, requireLogin: boolean = true, doNotCache: boolean = false): RouteResolver {
			let cache: {view: CurrentView | null} = {view: null}
			return {
				onmatch: async (args, requestedPath) => {
					if (requireLogin && !logins.isUserLoggedIn()) {
						forceLogin(args, requestedPath)
					} else if (!requireLogin && logins.isUserLoggedIn()) {
						await disableErrorHandlingDuringLogout()
						return logins.logout(false).then(() => {
							windowFacade.reload(args)
						})
					} else {
						let promise: Promise<CurrentView>

						if (cache.view == null) {
							promise = getView().then(view => {
								if (!doNotCache) {
									cache.view = view
								}

								return view
							})
						} else {
							promise = Promise.resolve(cache.view)
						}

						Promise.all([promise, import("./gui/base/Header")]).then(([view, {header}]) => {
							view.updateUrl(args, requestedPath)
							const currentPath = m.route.get()
							routeChange({
								args,
								requestedPath,
								currentPath,
							})
							header.updateCurrentView(view)
							window.tutao.currentView = view
						})
						return promise
					}
				},
				render: vnode => {
					return m(root, vnode)
				},
			}
		}

		const loginListener = await import("./login/LoginListener")
		await loginListener.registerLoginListener(locator.credentialsProvider, locator.secondFactorHandler)
		styles.init()
		const {usingKeychainAuthentication} = await import("./misc/credentials/CredentialsProviderFactory")

		/**
		 * Migrate credentials on supported devices to be encrypted using an intermediate key secured by the device keychain (biometrics).
		 * This code can (and will) be removed once all users have migrated.
		 */
		if (usingKeychainAuthentication()) {
			// We can only determine platform after we establish native bridge
			const hasAlreadyMigrated = deviceConfig.getCredentialsEncryptionKey() != null
			const hasCredentials = deviceConfig.loadAll().length > 0

			if (!hasAlreadyMigrated && hasCredentials) {
				const migrationModule = await import("./misc/credentials/CredentialsMigration")
				await locator.native.init()
				const migration = new migrationModule.CredentialsMigration(deviceConfig, locator.deviceEncryptionFacade, locator.native)
				await migration.migrateCredentials()
				// Reload the app just to make sure we are in the right state and don't init nativeApp twice
				windowFacade.reload({})
				return
			}
		}

		const paths = applicationPaths({
			login: createViewResolver(
				async () => {
					const {LoginView} = await import("./login/LoginView.js")
					const {LoginViewModel} = await import("./login/LoginViewModel.js")
					const {locator} = await import("./api/main/MainLocator")
					const loginViewModel = new LoginViewModel(logins, locator.credentialsProvider, locator.secondFactorHandler)
					await loginViewModel.init()
					return new LoginView(loginViewModel, "/mail")
				},
				false,
				true,
			),
			contact: createViewResolver(() => import("./contacts/view/ContactView.js").then(module => new module.ContactView())),
			externalLogin: createViewResolver(() => import("./login/ExternalLoginView.js").then(module => new module.ExternalLoginView()), false),
			mail: createViewResolver(() => import("./mail/view/MailView.js").then(module => new module.MailView())),
			settings: createViewResolver(() => import("./settings/SettingsView.js").then(module => new module.SettingsView())),
			search: createViewResolver(() => import("./search/view/SearchView.js").then(module => new module.SearchView())),
			contactForm: createViewResolver(() => import("./login/contactform/ContactFormView.js").then(module => module.contactFormView), false),
			calendar: createViewResolver(() => import("./calendar/view/CalendarView.js").then(module => new module.CalendarView()), true),

			/**
			 * The following resolvers are programmed by hand instead of using createViewResolver() in order to be able to properly redirect
			 * to the login page without having to deal with a ton of conditional logic in the LoginViewModel and to avoid some of the default
			 * behaviour of resolvers created with createViewResolver(), e.g. caching.
			 */
			signup: {
				async onmatch() {
					const {showSignupDialog} = await import("./misc/LoginUtils")
					// We have to manually parse it because mithril does not put hash into args of onmatch
					const hashParams = m.parseQueryString(location.hash.substring(1))
					showSignupDialog(hashParams)
					m.route.set("/login", {
						noAutoLogin: true,
					})
					return null
				},
			},
			giftcard: {
				async onmatch() {
					const {showGiftCardDialog} = await import("./misc/LoginUtils")
					showGiftCardDialog(location.hash)
					m.route.set("/login", {
						noAutoLogin: true,
					})
					return null
				},
			},
			recover: {
				async onmatch(args: any) {
					const {showRecoverDialog} = await import("./misc/LoginUtils")
					const resetAction = args.resetAction === "password" || args.resetAction === "secondFactor" ? args.resetAction : "password"
					const mailAddress = typeof args.mailAddress === "string" ? args.mailAddress : ""
					showRecoverDialog(mailAddress, resetAction)
					m.route.set("/login", {
						noAutoLogin: true,
					})
					return null
				},
			},
			webauthn: createViewResolver(
				async () => {
					const {BrowserWebauthn} = await import("./misc/2fa/webauthn/BrowserWebauthn.js")
					const {NativeWebauthnView} = await import("./login/NativeWebauthnView.js")
					const {WebauthnNativeBridge} = await import("./native/main/WebauthnNativeBridge.js")
					const creds = navigator.credentials
					return new NativeWebauthnView(new BrowserWebauthn(creds, window.location.hostname), new WebauthnNativeBridge())
				},
				false,
				false
			)
		})
		// see https://github.com/MithrilJS/mithril.js/issues/2659
		m.route.prefix = neverNull(state.prefix).replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
		// keep in sync with RewriteAppResourceUrlHandler.java
		const resolvers: RouteDefs = {
			"/": {
				onmatch: (args, requestedPath) => forceLogin(args, requestedPath),
			},
		}

		for (let path in paths) {
			resolvers[path] = paths[path]
		}

		// append catch all at the end because mithril will stop at the first match
		resolvers["/:path"] = {
			onmatch: (): Promise<Component> => {
				return Promise.all([import("./gui/base/InfoView"), import("./gui/base/ButtonN")]).then(([{InfoView}, {
					ButtonType,
					ButtonN
				}]) => {
					return {
						view() {
							return m(
								root,
								m(
									new InfoView(
										() => "404",
										() => [
											m("p", lang.get("notFound404_msg")),
											m(ButtonN, {
												label: "back_action",
												click: () => window.history.back(),
												type: ButtonType.Primary,
											}),
										],
									),
								),
							)
						},
					}
				})
			},
		}
		// keep in sync with RewriteAppResourceUrlHandler.java
		m.route(document.body, startRoute, resolvers)

		// We need to initialize native once we start the mithril routing, specifically for the case of mailto handling in android
		// If native starts telling the web side to navigate too early, mithril won't be ready and the requests will be lost
		if (isApp() || isDesktop()) {
			await locator.native.init()
		}

		import("./gui/InfoMessageHandler.js").then(module => module.registerInfoMessageHandler())
		// after we set up prefixWithoutFile
		initSW()
	})

function forceLogin(args: Record<string, Dict>, requestedPath: string) {
	if (requestedPath.indexOf("#mail") !== -1) {
		m.route.set(`/ext${location.hash}`)
	} else if (requestedPath.startsWith("/#")) {
		// we do not allow any other hashes except "#mail". this prevents login loops.
		m.route.set("/login")
	} else {
		let pathWithoutParameter = requestedPath.indexOf("?") > 0 ? requestedPath.substring(0, requestedPath.indexOf("?")) : requestedPath

		if (pathWithoutParameter.trim() === "/") {
			let newQueryString = m.buildQueryString(args)
			m.route.set(`/login` + (newQueryString.length > 0 ? "?" + newQueryString : ""))
		} else {
			m.route.set(`/login?requestedPath=${encodeURIComponent(requestedPath)}`)
		}
	}
}

function setupExceptionHandling() {
	window.addEventListener("error", function (evt) {
		// evt.error is not always set, e.g. not for "content.js:1963 Uncaught DOMException: Failed to read the 'selectionStart' property from 'HTMLInputElement': The input element's type ('email') does not support selection."
		if (evt.error) {
			handleUncaughtError(evt.error)
			evt.preventDefault()
		}
	})
	// Handle unhandled native JS Promise rejections
	window.addEventListener("unhandledrejection", function (evt) {
		handleUncaughtError(evt.reason)
		evt.preventDefault()
	})
}

env.dist &&
isTutanotaDomain() &&
setTimeout(() => {
	console.log(`

''''''''''''''''''''''''''''''''''''''''
''''''''''''''''''''''''''''''''''''''''
''''''''''''''''''''''''''''''''''''''''
''''''''''''''''''''''''''''''''''''''''
''''''''''''''''''''''''''''''''''''''''
''''''''''''''''''''''''''''''''''''''''
''''''''''''''''''''''''',:,''''''''''''
''''''''''''';:llllcccccccc,''''''''''''    Do you care about privacy?
'''''''''''':kXWXkoc::;,,'''''''''''''''
'''''''''''',cdk0KKK00kxdolc;,''''''''''    Work at Tutanota! Fight for our rights!
'''''''''''''''';coxOKNMMWWNK0kdl:,'''''
'''''''''''''''''''',;oKMMMMMMMMWX0dc,''    https://tutanota.com/jobs
'''''''''''''''''''''';kWMMMMMMMMMMWXk:'
'''''''''''''''''''',:xXMMMMMMMMMMMMMWKl
''''''''''''''''';lk0KWMMMMMMMMMMMMMMMWK
''''''''''''';cdOKWMMMMMMMMMMMMMMMMMMMMM
'''''''',:ldOKNWMMMMMMMMMMMMMMMMMMMMMMMM
''',:ldk0XWMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
ldk0XWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
WWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM

`)
}, 5000)
// @ts-ignore see above
const hot = typeof module !== "undefined" && module.hot

if (hot) {
	// Save the state (mostly prefix) before the reload
	hot.dispose((data: any) => {
		data.state = state
	})
	// Import ourselves again to actually replace ourselves and all the dependencies
	hot.accept(() => {
		console.log("Requiring new app.js")

		require(module.id)
	})
}