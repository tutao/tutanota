import m from "mithril"
import Mithril, { Children, ClassComponent, Component, RouteDefs, RouteResolver, Vnode, VnodeDOM } from "mithril"
import { disableErrorHandlingDuringLogout, handleUncaughtError } from "../common/misc/ErrorHandler.js"
import { AppType, assertMainOrNodeBoot, bootFinished, isApp, isDesktop, ProgrammingError } from "@tutao/app-env"
import { assertNotNull } from "@tutao/utils"
import { windowFacade } from "../common/misc/WindowFacade.js"
import { deviceConfig } from "../common/misc/DeviceConfig.js"
import { Logger, replaceNativeLogger } from "../common/api/common/Logger.js"
import type { LoginView, LoginViewAttrs } from "../common/login/LoginView.js"
import type { LoginViewModel } from "../common/login/LoginViewModel.js"
import { LoginController } from "../common/api/main/LoginController.js"
import { applicationPaths } from "./drive-applicationPaths"
import { DriveView, DriveViewAttrs } from "./drive/view/DriveView"
import { DrawerMenuAttrs } from "../common/gui/nav/DrawerMenu"
import { DriveViewModel } from "./drive/view/DriveViewModel"
import type { DriveFilePicker } from "./drive/view/DriveFilePicker"
import { MobileSettingsView } from "../common/settings/MobileSettingsView"
import { MobileSettingsViewAttrs, SettingsViewSection } from "../common/settings/Interfaces"
import { lang, languageCodeToTag, languages } from "../ui/utils/LanguageViewModel"
import { root } from "../ui/base/RootView"
import { styles } from "../ui/styles"
import { AppHeaderAttrs } from "../ui/Header"
import { DRIVE_PREFIX } from "../ui/utils/RouteChange"
import { TopLevelAttrs, TopLevelView } from "../ui/base/TopLevelView"
import { client } from "../app-env/boot/ClientDetector"
import { initUiSingletons } from "../common/app-common"

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

client.init(navigator.userAgent, navigator.platform, AppType.Drive)

if (!client.isSupported()) {
	throw new Error("Unsupported")
}

// Setup exception handling after checking for client support, because in android the Error is caught by the unhandled rejection handler
// and then the "Update WebView" message will never be show
// we still want to do this ASAP so we can handle other errors
setupExceptionHandling()

const startRoute = getStartUrl(urlQueryParams)
history.replaceState(null, "", startRoute)

import("../ui/translations/en.js")
	.then((en) => lang.init(en.default))
	.then(async () => {
		await import("../ui/main-styles.js")

		// do this after lang initialized
		const { initCommonLocator } = await import("../common/api/main/CommonLocator.js")
		const { driveLocator } = await import("./driveLocator.js")
		await driveLocator.init()

		initCommonLocator(driveLocator)
		await initUiSingletons(windowFacade, driveLocator.themeController)

		// this needs to stay after client.init
		windowFacade.init(driveLocator.logins, driveLocator.connectivityModel)
		if (isDesktop()) {
			import("../common/native/UpdatePrompt.js").then(({ registerForUpdates }) => registerForUpdates(driveLocator.desktopSettingsFacade))
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
		}

		driveLocator.logins.addPostLoginAction(() => driveLocator.postLoginActions())
		driveLocator.logins.addPostLoginAction(async () => {
			return {
				async onPartialLoginSuccess() {
					if (isApp()) {
						driveLocator.fileApp.clearFileData().catch((e) => console.log("Failed to clean file data", e))
					}
				},
				async onFullLoginSuccess() {},
			}
		})

		styles.init(driveLocator.themeController)
		const paths = applicationPaths({
			login: makeViewResolver<LoginViewAttrs, LoginView, { makeViewModel: () => LoginViewModel }>(
				{
					prepareRoute: async () => {
						const migrator = await driveLocator.credentialFormatMigrator()
						await migrator.migrate()

						const { LoginView } = await import("../common/login/LoginView.js")
						const makeViewModel = await driveLocator.loginViewModelFactory()
						return {
							component: LoginView,
							cache: {
								makeViewModel,
							},
						}
					},
					prepareAttrs: ({ makeViewModel }) => ({ targetPath: "/drive", makeViewModel }),
					requireLogin: false,
				},
				driveLocator.logins,
			),
			/**
			 * The following resolvers are programmed by hand instead of using createViewResolver() in order to be able to properly redirect
			 * to the login page without having to deal with a ton of conditional logic in the LoginViewModel and to avoid some of the default
			 * behaviour of resolvers created with createViewResolver(), e.g. caching.
			 */
			signup: {
				async onmatch() {
					const { showSignupDialog } = await import("../common/misc/LoginUtils.js")
					// We have to manually parse it because mithril does not put hash into args of onmatch
					const urlParams = m.parseQueryString(location.search.substring(1) + "&" + location.hash.substring(1))
					showSignupDialog(urlParams)
					// when the user presses the browser back button, we would get a /login route without arguments
					// in the popstate event, logging us out and reloading the page before we have a chance to (asynchronously) ask for confirmation
					// onmatch of the login view is called after the popstate handler, but before any asynchronous operations went ahead.
					// duplicating the history entry allows us to keep the arguments for a single back button press and run our own code to handle it
					m.route.set("/login", {
						keepSession: true,
					})
					m.route.set("/login", {
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
			drive: makeViewResolver<
				DriveViewAttrs,
				DriveView,
				{
					drawerAttrsFactory: () => DrawerMenuAttrs
					header: AppHeaderAttrs
					driveViewModel: DriveViewModel
					lazySearchBar: () => Children
					filePicker: DriveFilePicker
					bottomNav: () => Children
				}
			>(
				{
					prepareRoute: async (cache) => {
						const { DriveView } = await import("../drive-app/drive/view/DriveView.js")
						const { lazyDriveSearchBarStub } = await import("./LazyDriveSearchBarStub.js")
						const drawerAttrsFactory = await driveLocator.drawerAttrsFactory()
						const filePicker = await driveLocator.driveFilePicker()
						return {
							component: DriveView,
							cache: cache ?? {
								drawerAttrsFactory,
								header: await driveLocator.appHeaderAttrs(),
								driveViewModel: await driveLocator.driveViewModel(),
								lazySearchBar: () =>
									m(lazyDriveSearchBarStub, {
										placeholder: "stub",
									}),
								filePicker,
								bottomNav: () => null,
							},
						}
					},
					prepareAttrs: ({ header, driveViewModel, drawerAttrsFactory, lazySearchBar, filePicker, bottomNav }) => ({
						drawerAttrs: drawerAttrsFactory(),
						header,
						driveViewModel,
						lazySearchBar,
						showMoveItemDialog: (items, moveItems) => driveLocator.showMoveItemDialog(items, moveItems),
						filePicker,
						bottomNav,
					}),
				},
				driveLocator.logins,
			),
			settings: makeViewResolver<
				MobileSettingsViewAttrs,
				MobileSettingsView,
				{ header: AppHeaderAttrs; settingSections: readonly SettingsViewSection[] }
			>(
				{
					prepareRoute: async () => {
						const { MobileSettingsView } = await import("../common/settings/MobileSettingsView.js")
						const { makeDriveSettings } = await import("./settings/DriveSettingsView.js")
						const settingSections = makeDriveSettings(
							driveLocator.credentialsProvider,
							driveLocator.systemFacade,
							driveLocator.entityClient,
							driveLocator.logins,
							driveLocator.themeController,
							driveLocator.whitelabelThemeGenerator,
							driveLocator.mobilePaymentsFacade,
							driveLocator.customerFacade,
						)
						return {
							component: MobileSettingsView,
							cache: { header: await driveLocator.appHeaderAttrs(), settingSections },
						}
					},
					prepareAttrs: (cache) => ({
						header: cache.header,
						logins: driveLocator.logins,
						domainConfigProvider: driveLocator.domainConfigProvider(),
						eventController: driveLocator.eventController,
						settingSections: cache.settingSections,
						backUrl: DRIVE_PREFIX,
					}),
				},
				driveLocator.logins,
			),
		})

		m.route.prefix = ""

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
				const { NotFoundPage } = await import("../ui/base/NotFoundPage.js")
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
			await driveLocator.native.init()
		}
		// if (isDesktop()) {
		// 	const { exposeNativeInterface } = await import("../common/api/common/ExposeNativeInterface.js")
		// 	driveLocator.logins.addPostLoginAction(async () => exposeNativeInterface(driveLocator.native).postLoginActions)
		// }
		// after we set up prefixWithoutFile
		const domainConfig = driveLocator.domainConfigProvider().getCurrentDomainConfig()
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
	if (!new URL(target, window.location.href).hash) {
		target += location.hash
	}
	return target
}

function printJobsMessage(domainConfig: DomainConfig) {
	if (env.dist && domainConfig.firstPartyDomain) {
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
}
