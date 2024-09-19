import { client } from "../common/misc/ClientDetector.js"
import m from "mithril"
import Mithril, { Children, ClassComponent, Component, RouteDefs, RouteResolver, Vnode, VnodeDOM } from "mithril"
import { lang, languageCodeToTag, languages } from "../common/misc/LanguageViewModel.js"
import { root } from "../RootView.js"
import { disableErrorHandlingDuringLogout, handleUncaughtError } from "../common/misc/ErrorHandler.js"
import { assertMainOrNodeBoot, bootFinished, isApp, isDesktop, isOfflineStorageAvailable } from "../common/api/common/Env.js"
import { assertNotNull, neverNull } from "@tutao/tutanota-utils"
import { windowFacade } from "../common/misc/WindowFacade.js"
import { styles } from "../common/gui/styles.js"
import { deviceConfig } from "../common/misc/DeviceConfig.js"
import { Logger, replaceNativeLogger } from "../common/api/common/Logger.js"
import { applicationPaths } from "./calendar-applicationPaths.js"
import { ProgrammingError } from "../common/api/common/error/ProgrammingError.js"
import type { LoginView, LoginViewAttrs } from "../common/login/LoginView.js"
import type { LoginViewModel } from "../common/login/LoginViewModel.js"
import { TerminationView, TerminationViewAttrs } from "../common/termination/TerminationView.js"
import { TerminationViewModel } from "../common/termination/TerminationViewModel.js"
import { MobileWebauthnAttrs, MobileWebauthnView } from "../common/login/MobileWebauthnView.js"
import { BrowserWebauthn } from "../common/misc/2fa/webauthn/BrowserWebauthn.js"
import { CalendarView, CalendarViewAttrs } from "./calendar/view/CalendarView.js"
import { DrawerMenuAttrs } from "../common/gui/nav/DrawerMenu.js"
import { TopLevelAttrs, TopLevelView } from "../TopLevelView.js"
import { AppHeaderAttrs } from "../common/gui/Header.js"
import { CalendarViewModel } from "./calendar/view/CalendarViewModel.js"
import { LoginController } from "../common/api/main/LoginController.js"
import { CalendarSettingsViewAttrs } from "../common/settings/Interfaces.js"
import { CalendarSearchView, CalendarSearchViewAttrs } from "./calendar/search/view/CalendarSearchView.js"
import { CalendarSettingsView } from "./calendar/settings/CalendarSettingsView.js"
import { CalendarSearchViewModel } from "./calendar/search/view/CalendarSearchViewModel.js"
import { AppType } from "../common/misc/ClientConstants.js"

assertMainOrNodeBoot()
bootFinished()

const urlQueryParams = m.parseQueryString(location.search)

assignEnvPlatformId(urlQueryParams)
replaceNativeLogger(window, new Logger())

let currentView: Component<unknown> | null = null
window.tutao = {
	client,
	m,
	lang,
	root,
	currentView,
	locator: null,
}

client.init(navigator.userAgent, navigator.platform, AppType.Calendar)

if (!client.isSupported()) {
	throw new Error("Unsupported")
}

// Setup exception handling after checking for client support, because in android the Error is caught by the unhandled rejection handler
// and then the "Update WebView" message will never be show
// we still want to do this ASAP so we can handle other errors
setupExceptionHandling()

// If the webapp is served under some folder e.g. /build we want to consider this our root
const urlPrefixes = extractPathPrefixes()
// Write it here for the WorkerClient so that it can load relative worker easily. Should do it here so that it doesn't break after HMR.
window.tutao.appState = urlPrefixes

const startRoute = getStartUrl(urlQueryParams)
history.replaceState(null, "", urlPrefixes.prefix + startRoute)

import("../mail-app/translations/en.js")
	.then((en) => lang.init(en.default))
	.then(async () => {
		await import("../common/gui/main-styles.js")

		// do this after lang initialized
		const { initCommonLocator } = await import("../common/api/main/CommonLocator.js")
		const { calendarLocator } = await import("./calendarLocator.js")
		await calendarLocator.init()

		initCommonLocator(calendarLocator)

		const { setupNavShortcuts } = await import("../common/misc/NavShortcuts.js")
		setupNavShortcuts()

		// this needs to stay after client.init
		windowFacade.init(calendarLocator.logins, calendarLocator.connectivityModel, null)
		if (isDesktop()) {
			import("../common/native/main/UpdatePrompt.js").then(({ registerForUpdates }) => registerForUpdates(calendarLocator.desktopSettingsFacade))
		}

		const userLanguage = deviceConfig.getLanguage() && languages.find((l) => l.code === deviceConfig.getLanguage())

		if (userLanguage) {
			const language = {
				code: userLanguage.code,
				languageTag: languageCodeToTag(userLanguage.code),
			}
			lang.setLanguage(language).catch((e) => {
				console.error("Failed to fetch translation: " + userLanguage.code, e)
			})

			// if (isDesktop()) {
			// 	calendarLocator.desktopSettingsFacade.changeLanguage(language.code, language.languageTag)
			// }
		}

		calendarLocator.logins.addPostLoginAction(() => calendarLocator.postLoginActions())
		calendarLocator.logins.addPostLoginAction(async () => {
			return {
				async onPartialLoginSuccess() {
					if (isApp()) {
						calendarLocator.fileApp.clearFileData().catch((e) => console.log("Failed to clean file data", e))
					}
				},
				async onFullLoginSuccess() {},
			}
		})

		if (isOfflineStorageAvailable()) {
			const { CachePostLoginAction } = await import("../common/offline/CachePostLoginAction.js")
			calendarLocator.logins.addPostLoginAction(
				async () =>
					new CachePostLoginAction(
						await calendarLocator.calendarModel(),
						calendarLocator.entityClient,
						calendarLocator.progressTracker,
						calendarLocator.cacheStorage,
						calendarLocator.logins,
					),
			)
		}

		styles.init(calendarLocator.themeController)
		const paths = applicationPaths({
			login: makeViewResolver<LoginViewAttrs, LoginView, { makeViewModel: () => LoginViewModel }>(
				{
					prepareRoute: async () => {
						const migrator = await calendarLocator.credentialFormatMigrator()
						await migrator.migrate()

						const { LoginView } = await import("../common/login/LoginView.js")
						const makeViewModel = await calendarLocator.loginViewModelFactory()
						return {
							component: LoginView,
							cache: {
								makeViewModel,
							},
						}
					},
					prepareAttrs: ({ makeViewModel }) => ({ targetPath: "/calendar", makeViewModel }),
					requireLogin: false,
				},
				calendarLocator.logins,
			),
			termination: makeViewResolver<TerminationViewAttrs, TerminationView, { makeViewModel: () => TerminationViewModel; header: AppHeaderAttrs }>(
				{
					prepareRoute: async () => {
						const { TerminationViewModel } = await import("../common/termination/TerminationViewModel.js")
						const { TerminationView } = await import("../common/termination/TerminationView.js")
						return {
							component: TerminationView,
							cache: {
								makeViewModel: () =>
									new TerminationViewModel(
										calendarLocator.logins,
										calendarLocator.secondFactorHandler,
										calendarLocator.serviceExecutor,
										calendarLocator.entityClient,
									),
								header: await calendarLocator.appHeaderAttrs(),
							},
						}
					},
					prepareAttrs: ({ makeViewModel, header }) => ({ makeViewModel, header }),
					requireLogin: false,
				},
				calendarLocator.logins,
			),
			settings: makeViewResolver<CalendarSettingsViewAttrs, CalendarSettingsView, { header: AppHeaderAttrs }>(
				{
					prepareRoute: async () => {
						const { CalendarSettingsView } = await import("./calendar/settings/CalendarSettingsView.js")
						return {
							component: CalendarSettingsView,
							cache: { header: await calendarLocator.appHeaderAttrs() },
						}
					},
					prepareAttrs: (cache) => ({ header: cache.header, logins: calendarLocator.logins }),
				},
				calendarLocator.logins,
			),
			search: makeViewResolver<
				CalendarSearchViewAttrs,
				CalendarSearchView,
				{
					header: AppHeaderAttrs
					searchViewModelFactory: () => CalendarSearchViewModel
				}
			>(
				{
					prepareRoute: async () => {
						const { CalendarSearchView } = await import("./calendar/search/view/CalendarSearchView.js")
						return {
							component: CalendarSearchView,
							cache: {
								header: await calendarLocator.appHeaderAttrs(),
								searchViewModelFactory: await calendarLocator.searchViewModelFactory(),
							},
						}
					},
					prepareAttrs: (cache) => ({ header: cache.header, makeViewModel: cache.searchViewModelFactory }),
				},
				calendarLocator.logins,
			),
			calendar: makeViewResolver<
				CalendarViewAttrs,
				CalendarView,
				{
					drawerAttrsFactory: () => DrawerMenuAttrs
					header: AppHeaderAttrs
					calendarViewModel: CalendarViewModel
					lazySearchBar: () => Children
				}
			>(
				{
					prepareRoute: async (cache) => {
						const { CalendarView } = await import("./calendar/view/CalendarView.js")
						const { lazyCalendarSearchBar } = await import("./LazyCalendarSearchBar.js")
						const drawerAttrsFactory = await calendarLocator.drawerAttrsFactory()
						return {
							component: CalendarView,
							cache: cache ?? {
								drawerAttrsFactory,
								header: await calendarLocator.appHeaderAttrs(),
								calendarViewModel: await calendarLocator.calendarViewModel(),
								lazySearchBar: () => {
									return m(lazyCalendarSearchBar, {
										placeholder: lang.get("searchCalendar_placeholder"),
									})
								},
							},
						}
					},
					prepareAttrs: ({ header, calendarViewModel, drawerAttrsFactory, lazySearchBar }) => ({
						drawerAttrs: drawerAttrsFactory(),
						header,
						calendarViewModel,
						lazySearchBar,
					}),
				},
				calendarLocator.logins,
			),

			/**
			 * The following resolvers are programmed by hand instead of using createViewResolver() in order to be able to properly redirect
			 * to the login page without having to deal with a ton of conditional logic in the LoginViewModel and to avoid some of the default
			 * behaviour of resolvers created with createViewResolver(), e.g. caching.
			 */
			signup: {
				async onmatch() {
					const { showSignupDialog } = await import("../common/misc/LoginUtils.js")
					const { isLegacyDomain } = await import("../common/login/LoginViewModel.js")
					if (isLegacyDomain()) {
						const domainConfigProvider = calendarLocator.domainConfigProvider()
						const target = new URL(
							domainConfigProvider.getDomainConfigForHostname(location.hostname, location.protocol, location.port).partneredDomainTransitionUrl,
						)
						target.pathname = "signup"
						target.search = location.search
						target.hash = location.hash
						console.log("redirect to", target.toString())
						window.open(target, "_self")
						return null
					} else {
						// We have to manually parse it because mithril does not put hash into args of onmatch
						const urlParams = m.parseQueryString(location.search.substring(1) + "&" + location.hash.substring(1))
						showSignupDialog(urlParams)
					}
					// when the user presses the browser back button, we would get a /login route without arguments
					// in the popstate event, logging us out and reloading the page before we have a chance to (asynchronously) ask for confirmation
					// onmatch of the login view is called after the popstate handler, but before any asynchronous operations went ahead.
					// duplicating the history entry allows us to keep the arguments for a single back button press and run our own code to handle it
					m.route.set("/login", {
						noAutoLogin: true,
						keepSession: true,
					})
					m.route.set("/login", {
						noAutoLogin: true,
						keepSession: true,
					})
					return null
				},
			},
			giftcard: {
				async onmatch() {
					const { showGiftCardDialog } = await import("../common/misc/LoginUtils.js")
					showGiftCardDialog(location.hash)
					m.route.set("/login", {
						noAutoLogin: true,
						keepSession: true,
					})
					return null
				},
			},
			recover: {
				async onmatch(args: any) {
					const { showRecoverDialog } = await import("../common/misc/LoginUtils.js")
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
					const { BrowserWebauthn } = await import("../common/misc/2fa/webauthn/BrowserWebauthn.js")
					const { NativeWebauthnView } = await import("../common/login/NativeWebauthnView.js")
					const { WebauthnNativeBridge } = await import("../common/native/main/WebauthnNativeBridge.js")
					// getCurrentDomainConfig() takes env.staticUrl into account but we actually don't care about it in this case.
					// Scenario when it can differ: local desktop client which opens webauthn window and that window is also built with the static URL because
					// it is the same client build.
					const domainConfig = calendarLocator.domainConfigProvider().getDomainConfigForHostname(location.hostname, location.protocol, location.port)
					const creds = navigator.credentials
					return new NativeWebauthnView(new BrowserWebauthn(creds, domainConfig), new WebauthnNativeBridge())
				},
				{
					requireLogin: false,
					cacheView: false,
				},
				calendarLocator.logins,
			),
			webauthnmobile: makeViewResolver<MobileWebauthnAttrs, MobileWebauthnView, { browserWebauthn: BrowserWebauthn }>(
				{
					prepareRoute: async () => {
						const { MobileWebauthnView } = await import("../common/login/MobileWebauthnView.js")
						const { BrowserWebauthn } = await import("../common/misc/2fa/webauthn/BrowserWebauthn.js")
						// see /webauthn view resolver for the explanation
						const domainConfig = calendarLocator
							.domainConfigProvider()
							.getDomainConfigForHostname(location.hostname, location.protocol, location.port)
						return {
							component: MobileWebauthnView,
							cache: {
								browserWebauthn: new BrowserWebauthn(navigator.credentials, domainConfig),
							},
						}
					},
					prepareAttrs: (cache) => cache,
					requireLogin: false,
				},
				calendarLocator.logins,
			),
		})

		// In some cases our prefix can have non-ascii characters, depending on the path the webapp is served from
		// see https://github.com/MithrilJS/mithril.js/issues/2659
		m.route.prefix = neverNull(urlPrefixes.prefix).replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)

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
		resolvers["/:path..."] = {
			onmatch: async () => {
				const { NotFoundPage } = await import("../common/gui/base/NotFoundPage.js")
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
			await calendarLocator.native.init()
		}
		// if (isDesktop()) {
		// 	const { exposeNativeInterface } = await import("../common/api/common/ExposeNativeInterface.js")
		// 	calendarLocator.logins.addPostLoginAction(async () => exposeNativeInterface(calendarLocator.native).postLoginActions)
		// }
		// after we set up prefixWithoutFile
		const domainConfig = calendarLocator.domainConfigProvider().getCurrentDomainConfig()
		const serviceworker = await import("../common/serviceworker/ServiceWorkerClient.js")
		serviceworker.init(domainConfig)

		printJobsMessage(domainConfig)
	})

function forceLogin(args: Record<string, Dict>, requestedPath: string) {
	if (requestedPath.startsWith("/#")) {
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
 * @param logins logincontroller to ask about login state
 */
function makeViewResolver<FullAttrs extends TopLevelAttrs = never, ComponentType extends TopLevelView<FullAttrs> = never, RouteCache = undefined>(
	{
		prepareRoute,
		prepareAttrs,
		requireLogin,
	}: {
		prepareRoute: (cache: RouteCache | null) => Promise<{ component: Class<ComponentType>; cache: RouteCache }>
		prepareAttrs: (cache: RouteCache) => Omit<FullAttrs, keyof TopLevelAttrs>
		requireLogin?: boolean
	},
	logins: LoginController,
): RouteResolver {
	requireLogin = requireLogin ?? true
	let cache: RouteCache | null

	// a bit of context for why we do things the way we do. Constraints:
	//  - view must be imported async in onmatch
	//  - view shall not be created manually, we do not want to hold on to the instance
	//  - we want to pass additional parameters to the view
	//  - view should not be created twice and neither its dependencies
	//  - we either need to call updateUrl or pass requestedPath and args as attributes
	return {
		// onmatch() is called for every URL change
		async onmatch(args: Record<string, Dict>, requestedPath: string): Promise<Class<ComponentType> | null> {
			// enforce valid login state first.
			// we have views with requireLogin: true and views with requireLogin: false, each of which enforce being logged in or being logged out respectively.
			// in the logout case (where requireLogin: false) this will force a reload.
			// the login view is special in that it has requirelogin: false, but can be logged in after account creation during signup.
			// to handle back button presses where the user decides to stay on the page after all (we show a confirmation)
			// we need to prevent the logout/reload. this is the purpose of the keepSession argument.
			// the signup wizard that sets it handles the session itself.
			if (requireLogin && !logins.isUserLoggedIn()) {
				forceLogin(args, requestedPath)
				return null
			} else if (!requireLogin && logins.isUserLoggedIn() && !args.keepSession) {
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
			const attrs = { requestedPath, args, ...prepareAttrs(assertNotNull(cache)) } as FullAttrs
			return m(
				root,
				m(c, {
					...attrs,
					oncreate({ state }: VnodeDOM<FullAttrs, ComponentType>) {
						window.tutao.currentView = state
					},
				}),
			)
		},
	}
}

// This is only used for non-mobile webauthn, so this may need to be removed if we do not have a separate calendar web/desktop app
function makeOldViewResolver(
	makeView: (args: {}, requestedPath: string) => Promise<TopLevelView>,
	{ requireLogin, cacheView }: { requireLogin?: boolean; cacheView?: boolean } = {},
	logins: LoginController,
): RouteResolver {
	requireLogin = requireLogin ?? true
	cacheView = cacheView ?? true

	const viewCache: { view: TopLevelView | null } = { view: null }
	return {
		onmatch: async (args, requestedPath) => {
			if (requireLogin && !logins.isUserLoggedIn()) {
				forceLogin(args, requestedPath)
			} else if (!requireLogin && logins.isUserLoggedIn()) {
				await disableErrorHandlingDuringLogout()
				await logins.logout(false)
				windowFacade.reload(args)
			} else {
				let promise: Promise<TopLevelView>

				if (viewCache.view == null) {
					promise = makeView(args, requestedPath).then((view) => {
						if (cacheView) {
							viewCache.view = view
						}

						return view
					})
				} else {
					promise = Promise.resolve(viewCache.view)
				}

				Promise.all([promise]).then(([view]) => {
					view.updateUrl?.(args, requestedPath)
					window.tutao.currentView = view
				})
				return promise
			}
		},
		render: (vnode) => {
			return m(root, vnode)
		},
	}
}

// PlatformId is passed by the native part in the URL
function assignEnvPlatformId(urlQueryParams: Mithril.Params) {
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
}

function extractPathPrefixes(): Readonly<{ prefix: string; prefixWithoutFile: string }> {
	const prefix = location.pathname.endsWith("/") ? location.pathname.substring(0, location.pathname.length - 1) : location.pathname
	const prefixWithoutFile = prefix.includes(".") ? prefix.substring(0, prefix.lastIndexOf("/")) : prefix
	return Object.freeze({ prefix, prefixWithoutFile })
}

function getStartUrl(urlQueryParams: Mithril.Params): string {
	// Redirection triggered by the server or service worker (e.g. the user reloads /mail/id by pressing
	// F5 and we want to open /login?r=mail/id).

	// We want to build a new URL based on the redirect parameter and our current path and hash.

	// take redirect parameter from the query params
	// remove it from the query params (so that we don't loop)
	let redirectTo = urlQueryParams["r"]
	if (redirectTo) {
		delete urlQueryParams["r"]

		if (typeof redirectTo !== "string") {
			redirectTo = ""
		}
	} else {
		redirectTo = ""
	}

	// build new query, this time without redirect
	let newQueryString = m.buildQueryString(urlQueryParams)

	if (newQueryString.length > 0) {
		newQueryString = "?" + newQueryString
	}

	let target = redirectTo + newQueryString

	if (target === "" || target[0] !== "/") target = "/" + target

	// Only append current hash if there's no hash in the redirect already.
	// Most browsers will keep the hash around even after the redirect unless there's another one provided.
	// In our case the hash is encoded as part of the query and is not deduplicated like described above so we have to manually do it, otherwise we end
	// up with double hashes.
	if (!new URL(urlPrefixes.prefix + target, window.location.href).hash) {
		target += location.hash
	}
	return target
}

function printJobsMessage(domainConfig: DomainConfig) {
	env.dist &&
		domainConfig.firstPartyDomain &&
		console.log(`

........................................
........................................
........................................
........@@@@@@@@@@@@@@@@@@@@@@@.........
.....@....@@@@@@@@@@@@@@@@@@@@@@@.......
.....@@@....@@@@@@@@@@@@@@@@@@@@@@@.....
.....@@@@@..............................    Do you care about privacy?
.....@@@@@...@@@@@@@@@@@@@@@@@@@@@@.....
.....@@@@...@@@@@@@@@@@@@@@@@@@@@@@.....    Work at Tuta! Fight for our rights!
.....@@@@...@@@@@@@@@@@@@@@@@@@@@@......
.....@@@...@@@@@@@@@@@@@@@@@@@@@@.......    https://tuta.com/jobs
.....@@@...@@@@@@@@@@@@@@@@@@@@@@.......
.....@@...@@@@@@@@@@@@@@@@@@@@@@........
.....@@...@@@@@@@@@@@@@@@@@@@@@@........
.....@...@@@@@@@@@@@@@@@@@@@@@@.........
.....@...@@@@@@@@@@@@@@@@@@@@@@.........
........@@@@@@@@@@@@@@@@@@@@@@..........
.......@@@@@@@@@@@@@@@@@@@@@@...........
.......@@@@@@@@@@@@@@@@@@@@@@...........
........................................
........................................
........................................

`)
}
