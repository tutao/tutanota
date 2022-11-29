import {client} from "./misc/ClientDetector"
import m, {Children, ClassComponent, Component, RouteDefs, RouteResolver, Vnode, VnodeDOM} from "mithril"
import {lang, languageCodeToTag, languages} from "./misc/LanguageViewModel"
import {root} from "./RootView"
import {disableErrorHandlingDuringLogout, handleUncaughtError} from "./misc/ErrorHandler"
import "./gui/main-styles"
import {assertMainOrNodeBoot, bootFinished, isApp, isDesktop, isOfflineStorageAvailable, isTutanotaDomain} from "./api/common/Env"
import {logins} from "./api/main/LoginController"
import {assertNotNull, neverNull} from "@tutao/tutanota-utils"
import {windowFacade} from "./misc/WindowFacade"
import {styles} from "./gui/styles"
import {deviceConfig} from "./misc/DeviceConfig"
import {Logger, replaceNativeLogger} from "./api/common/Logger"
import {init as initSW} from "./serviceworker/ServiceWorkerClient"
import {applicationPaths} from "./ApplicationPaths"
import {ProgrammingError} from "./api/common/error/ProgrammingError"
import {CurrentView, TopLevelAttrs} from "./gui/Header.js"
import {NativeWebauthnView} from "./login/NativeWebauthnView"
import {WebauthnNativeBridge} from "./native/main/WebauthnNativeBridge"
import {PostLoginActions} from "./login/PostLoginActions"
import type {LoginView, LoginViewAttrs} from "./login/LoginView.js"
import type {LoginViewModel} from "./login/LoginViewModel.js"
import {TerminationView, TerminationViewAttrs} from "./termination/TerminationView.js"
import {TerminationViewModel} from "./termination/TerminationViewModel.js"
import {MobileWebauthnAttrs, MobileWebauthnView} from "./login/MobileWebauthnView.js"
import {BrowserWebauthn} from "./misc/2fa/webauthn/BrowserWebauthn.js"

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
let currentView: Component<unknown> | null = null
window.tutao = {
	client,
	m,
	lang,
	root,
	logins,
	currentView,
	locator: null,
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
const prefix = location.pathname[location.pathname.length - 1] !== "/"
	? location.pathname
	: location.pathname.substring(0, location.pathname.length - 1)
const prefixWithoutFile = prefix.includes(".")
	? prefix.substring(0, prefix.lastIndexOf("/"))
	: prefix

export const state: {prefix: string, prefixWithoutFile: string} = {prefix, prefixWithoutFile}
let startRoute = "/"
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
history.replaceState(null, "", assertNotNull(state.prefix) + target)
startRoute = target

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

		if (isDesktop()) {
			import("./native/main/UpdatePrompt.js").then(({registerForUpdates}) => registerForUpdates(locator.desktopSettingsFacade))
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

			if (isDesktop()) {
				locator.desktopSettingsFacade.changeLanguage(language.code, language.languageTag)
			}
		}

		const {PostLoginActions} = await import("./login/PostLoginActions")
		const {CachePostLoginAction} = await import("./offline/CachePostLoginAction")
		logins.addPostLoginAction(new PostLoginActions(locator.credentialsProvider, locator.secondFactorHandler))
		if (isOfflineStorageAvailable()) {
			logins.addPostLoginAction(new CachePostLoginAction(
				locator.calendarModel, locator.entityClient, locator.progressTracker, logins,
			))
		}

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
				const {NativeCredentialsFacadeSendDispatcher} = await import("./native/common/generatedipc/NativeCredentialsFacadeSendDispatcher.js")
				await locator.native.init()
				const nativeCredentials = new NativeCredentialsFacadeSendDispatcher(locator.native)
				const migration = new migrationModule.CredentialsMigration(deviceConfig, locator.deviceEncryptionFacade, nativeCredentials)
				await migration.migrateCredentials()
				// Reload the app just to make sure we are in the right state and don't init nativeApp twice
				windowFacade.reload({})
				return
			}
		}

		const paths = applicationPaths({
			login: makeViewResolver<LoginViewAttrs, LoginView, {makeViewModel: () => LoginViewModel}>(
				{
					prepareRoute: async () => {
						const {LoginViewModel} = await import("./login/LoginViewModel.js")
						const {DatabaseKeyFactory} = await import("./misc/credentials/DatabaseKeyFactory.js")
						const {LoginView} = await import("./login/LoginView.js")
						return {
							component: LoginView,
							cache: {
								makeViewModel: () => new LoginViewModel(
									logins,
									locator.credentialsProvider,
									locator.secondFactorHandler,
									new DatabaseKeyFactory(locator.deviceEncryptionFacade),
									deviceConfig
								)
							}
						}
					},
					prepareAttrs: (cache) => ({targetPath: "/mail", makeViewModel: cache.makeViewModel}),
					requireLogin: false,
				}),
			termination: makeViewResolver<TerminationViewAttrs, TerminationView, {makeViewModel: () => TerminationViewModel}>(
				{
					prepareRoute: async () => {
						const {TerminationViewModel} = await import("./termination/TerminationViewModel.js")
						const {locator} = await import("./api/main/MainLocator")
						const {TerminationView} = await import("./termination/TerminationView.js")
						return {
							component: TerminationView,
							cache: {
								makeViewModel: () => new TerminationViewModel(logins, locator.secondFactorHandler, locator.serviceExecutor, locator.entityClient)
							}
						}
					},
					prepareAttrs: (cache) => ({makeViewModel: cache.makeViewModel}),
					requireLogin: false,
				}),
			contact: makeOldViewResolver(() => import("./contacts/view/ContactView.js").then(module => new module.ContactView())),
			externalLogin: makeOldViewResolver(() => import("./login/ExternalLoginView.js").then(module => new module.ExternalLoginView()), {
				requireLogin: false,
			}),
			mail: makeOldViewResolver(() => import("./mail/view/MailView.js").then(module => new module.MailView())),
			settings: makeOldViewResolver(() => import("./settings/SettingsView.js").then(module => new module.SettingsView())),
			search: makeOldViewResolver(() => import("./search/view/SearchView.js").then(module => new module.SearchView())),
			contactForm: makeOldViewResolver(() => import("./login/contactform/ContactFormView.js").then(module => module.contactFormView), {
				requireLogin: false,
			}),
			calendar: makeOldViewResolver(() => import("./calendar/view/CalendarView.js").then(module => new module.CalendarView())),

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
			webauthn: makeOldViewResolver(
				async () => {
					const {BrowserWebauthn} = await import("./misc/2fa/webauthn/BrowserWebauthn.js")
					const {NativeWebauthnView} = await import("./login/NativeWebauthnView.js")
					const {WebauthnNativeBridge} = await import("./native/main/WebauthnNativeBridge.js")
					const creds = navigator.credentials
					return new NativeWebauthnView(new BrowserWebauthn(creds, window.location.hostname), new WebauthnNativeBridge())
				},
				{
					requireLogin: false,
					cacheView: false,
				},
			),
			webauthnmobile: makeViewResolver<MobileWebauthnAttrs, MobileWebauthnView, {browserWebauthn: BrowserWebauthn}>({
				prepareRoute: async () => {
					const {MobileWebauthnView} = await import("./login/MobileWebauthnView.js")
					const {BrowserWebauthn} = await import("./misc/2fa/webauthn/BrowserWebauthn.js")
					return {
						component: MobileWebauthnView,
						cache: {
							browserWebauthn: new BrowserWebauthn(navigator.credentials, window.location.hostname)
						},
					}
				},
				prepareAttrs: (cache) => cache,
				requireLogin: false,
			}),
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
			onmatch: async () => {
				const {NotFoundPage} = await import("./gui/base/NotFoundPage.js")
				return {
					view: () => m(root, m(NotFoundPage)),
				}
			},
		}
		// keep in sync with RewriteAppResourceUrlHandler.java
		m.route(document.body, startRoute, resolvers)

		// We need to initialize native once we start the mithril routing, specifically for the case of mailto handling in android
		// If native starts telling the web side to navigate too early, mithril won't be ready and the requests will be lost
		if (isApp() || isDesktop()) {
			await locator.native.init()
		}
		if (isDesktop()) {
			const {exposeNativeInterface} = await import("./api/common/ExposeNativeInterface")
			logins.addPostLoginAction(exposeNativeInterface(locator.native).postLoginActions)
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
		/**
		 * evt.error is not always set, e.g. not for "content.js:1963 Uncaught DOMException: Failed to read
		 * the 'selectionStart' property from 'HTMLInputElement': The input element's type ('email')
		 * does not support selection."
		 *
		 * checking for defaultPrevented is necessary to prevent devTools eval errors to be thrown in here until
		 * https://chromium-review.googlesource.com/c/v8/v8/+/3660253
		 * is in the chromium version used by our electron client.
		 * see https://stackoverflow.com/questions/72396527/evalerror-possible-side-effect-in-debug-evaluate-in-google-chrome
		 * */
		if (evt.error && !evt.defaultPrevented) {
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

/**
 * Wrap top-level component with necessary logic.
 * Note: I can't make type inference work with attributes and components because of how broken mithril typedefs are so they are "never" by default and you
 * have to specify generic types manually.
 * @template FullAttrs type of the attributes that the component takes
 * @template ComponentType type of the component
 * @template RouteCache info that is prepared async on route change and can be used later to create attributes on every render. Is also persisted between
 * the route changes.
 * @param param
 * @param param.prepareRoute called once per route change. Use it for everything async that should happen before the route change. The result is preserved for
 * as long as RouteResolver lives if you need to persist things between routes. It receives the route cache from the previous call if there was one.
 * @param param.prepareAttrs called once per redraw. The result of it will be added to TopLevelAttrs to make full attributes.
 * @param param.requireLogin enforce login policy to either redirect to the login page or reload
 */
function makeViewResolver<FullAttrs extends TopLevelAttrs = never,
	ComponentType extends CurrentView<FullAttrs> = never,
	RouteCache = undefined>(
	{
		prepareRoute,
		prepareAttrs,
		requireLogin
	}: {
		prepareRoute: (cache: RouteCache | null) => Promise<{component: Class<ComponentType>, cache: RouteCache}>,
		prepareAttrs: (cache: RouteCache) => (Omit<FullAttrs, keyof TopLevelAttrs>),
		requireLogin?: boolean,
	},
): RouteResolver {
	requireLogin = requireLogin ?? true
	let cache: RouteCache | null

	// a bit of context for why we do things the way we do. Constraints:
	//  - view must be imported async in onmatch
	//  - view shall not be created manually, we do not want to hold on to the instance
	//  - we want to pass additional parameters to the view
	//  - view should not be created twice and neither its dependencies
	//  - we either need to call updateUrl or pass requestedPath and args as attrbiutes
	return {
		// onmatch() is called for every URL change
		async onmatch(args: {}, requestedPath: string, route: string): Promise<Class<ComponentType> | null> {
			// enforce valid login state first
			if (requireLogin && !logins.isUserLoggedIn()) {
				forceLogin(args, requestedPath)
				return null
			} else if (!requireLogin && logins.isUserLoggedIn()) {
				await disableErrorHandlingDuringLogout()
				await logins.logout(false)
				windowFacade.reload(args)
				return null
			} else {
				const prepared = await prepareRoute(cache)
				cache = prepared.cache
				return prepared.component
			}
		},
		// render() is called on every render
		render(vnode: Vnode<ComponentType>): Children {
			const args = m.route.param()
			const requestedPath = m.route.get()
			// result of onmatch() is passed into m() by mthril and then given to us here
			// It is not what we want as we want to pass few things to it but it's harmless because
			// it just creates a vnode but doesn't render it.
			// What we do is grab the class from that vnode. We could have done it differently but this
			// way we don't do any more caching than Mithril would do anyway.

			// TS can't prove that it's the right component and the mithril typings are generally slightly broken
			const c = vnode.tag as unknown as Class<ClassComponent<FullAttrs>>

			// downcast because we ts can't really prove or enforce that additional attrs have compatible requestedPath and args
			const attrs = {requestedPath, args, ...prepareAttrs(assertNotNull(cache))} as FullAttrs
			return m(root, m(c, {
					...attrs,
					oncreate({state}: VnodeDOM<FullAttrs, ComponentType>) {
						window.tutao.currentView = state

						import("./gui/Header.js").then(({header}) => {
							header.updateCurrentView(state)
							m.redraw()
						})
					}
				}
			))
		},
	}
}

function makeOldViewResolver(
	makeView: (args: {}, requestedPath: string) => Promise<CurrentView>,
	{requireLogin, cacheView}: {requireLogin?: boolean, cacheView?: boolean} = {},
): RouteResolver {
	requireLogin = requireLogin ?? true
	cacheView = cacheView ?? true

	const viewCache: {view: CurrentView | null} = {view: null}
	return {
		onmatch: async (args, requestedPath) => {
			if (requireLogin && !logins.isUserLoggedIn()) {
				forceLogin(args, requestedPath)
			} else if (!requireLogin && logins.isUserLoggedIn()) {
				await disableErrorHandlingDuringLogout()
				await logins.logout(false)
				windowFacade.reload(args)
			} else {
				let promise: Promise<CurrentView>

				if (viewCache.view == null) {
					promise = makeView(args, requestedPath).then(view => {
						if (cacheView) {
							viewCache.view = view
						}

						return view
					})
				} else {
					promise = Promise.resolve(viewCache.view)
				}

				Promise.all([promise, import("./gui/Header.js")]).then(([view, {header}]) => {
					view.updateUrl?.(args, requestedPath)
					const currentPath = m.route.get()
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