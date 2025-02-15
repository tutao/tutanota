import "./dist-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNodeBoot, bootFinished, isApp, isDesktop, isIOSApp, isOfflineStorageAvailable } from "./Env-chunk.js";
import { AppType, client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { assertNotNull, neverNull } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang, languageCodeToTag, languages } from "./LanguageViewModel-chunk.js";
import { styles } from "./styles-chunk.js";
import "./theme-chunk.js";
import "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import { windowFacade } from "./WindowFacade-chunk.js";
import { root } from "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./luxon-chunk.js";
import "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import "./TypeRefs-chunk.js";
import "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import "./CalendarUtils-chunk.js";
import "./ImportExportUtils-chunk.js";
import "./FormatValidator-chunk.js";
import "./stream-chunk.js";
import { deviceConfig } from "./DeviceConfig-chunk.js";
import { Logger, replaceNativeLogger } from "./Logger-chunk.js";
import { disableErrorHandlingDuringLogout, handleUncaughtError } from "./ErrorHandler-chunk.js";
import "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import "./ErrorUtils-chunk.js";
import "./RestError-chunk.js";
import "./SetupMultipleError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./EventQueue-chunk.js";
import { CacheMode } from "./EntityRestClient-chunk.js";
import "./SuspensionError-chunk.js";
import "./LoginIncompleteError-chunk.js";
import "./CryptoError-chunk.js";
import "./RecipientsNotFoundError-chunk.js";
import "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import "./DeviceStorageUnavailableError-chunk.js";
import "./MailBodyTooLargeError-chunk.js";
import "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import "./PermissionError-chunk.js";
import "./MessageDispatcher-chunk.js";
import "./WorkerProxy-chunk.js";
import "./EntityUpdateUtils-chunk.js";
import { SessionType } from "./SessionType-chunk.js";

//#region src/mail-app/ApplicationPaths.ts
function applicationPaths({ login, termination, mail, externalLogin, contact, contactList, search, settings, calendar, signup, giftcard, recover, webauthn, webauthnmobile }) {
	return {
		"/login": login,
		"/termination": termination,
		"/signup": signup,
		"/recover": recover,
		"/mailto": mail,
		"/mail": mail,
		"/mail/:folderId": mail,
		"/mail/:folderId/:mailId": mail,
		"/ext": externalLogin,
		"/contact": contact,
		"/contact/:listId": contact,
		"/contact/:listId/:contactId": contact,
		"/contactlist": contactList,
		"/contactlist/:listId": contactList,
		"/contactlist/:listId/:Id": contactList,
		"/search/:category": search,
		"/search/:category/:id": search,
		"/settings": settings,
		"/settings/:folder": settings,
		"/settings/:folder/:id": settings,
		"/calendar": calendar,
		"/calendar/:view": calendar,
		"/calendar/:view/:date": calendar,
		"/giftcard/": giftcard,
		"/webauthn": webauthn,
		"/webauthnmobile": webauthnmobile
	};
}

//#endregion
//#region src/mail-app/app.ts
assertMainOrNodeBoot();
bootFinished();
const urlQueryParams = mithril_default.parseQueryString(location.search);
assignEnvPlatformId(urlQueryParams);
replaceNativeLogger(window, new Logger());
let currentView = null;
window.tutao = {
	client,
	m: mithril_default,
	lang,
	root,
	currentView,
	locator: null
};
client.init(navigator.userAgent, navigator.platform, AppType.Mail);
if (!client.isSupported()) throw new Error("Unsupported");
setupExceptionHandling();
const urlPrefixes = extractPathPrefixes();
window.tutao.appState = urlPrefixes;
const startRoute = getStartUrl(urlQueryParams);
history.replaceState(null, "", urlPrefixes.prefix + startRoute);
registerForMailto();
import("./en-chunk.js").then((en) => lang.init(en.default)).then(async () => {
	await import("./main-styles-chunk.js");
	const { initCommonLocator } = await import("./CommonLocator2-chunk.js");
	const { mailLocator } = await import("./mailLocator2-chunk.js");
	await mailLocator.init();
	initCommonLocator(mailLocator);
	const { setupNavShortcuts } = await import("./NavShortcuts-chunk.js");
	setupNavShortcuts();
	const { BottomNav } = await import("./BottomNav2-chunk.js");
	windowFacade.init(mailLocator.logins, mailLocator.connectivityModel, (visible) => {
		mailLocator.indexerFacade?.onVisibilityChanged(!document.hidden);
	});
	if (isDesktop()) import("./UpdatePrompt-chunk.js").then(({ registerForUpdates }) => registerForUpdates(mailLocator.desktopSettingsFacade));
	const userLanguage = deviceConfig.getLanguage() && languages.find((l) => l.code === deviceConfig.getLanguage());
	if (userLanguage) {
		const language = {
			code: userLanguage.code,
			languageTag: languageCodeToTag(userLanguage.code)
		};
		lang.setLanguage(language).catch((e) => {
			console.error("Failed to fetch translation: " + userLanguage.code, e);
		});
		if (isDesktop()) mailLocator.desktopSettingsFacade.changeLanguage(language.code, language.languageTag);
	}
	mailLocator.logins.addPostLoginAction(() => mailLocator.postLoginActions());
	mailLocator.logins.addPostLoginAction(async () => {
		return {
			async onPartialLoginSuccess() {
				if (isApp()) {
					mailLocator.fileApp.clearFileData().catch((e) => console.log("Failed to clean file data", e));
					const syncManager = mailLocator.nativeContactsSyncManager();
					if (syncManager.isEnabled() && isIOSApp()) {
						const canSync = await syncManager.canSync();
						if (!canSync) {
							await syncManager.disableSync();
							return;
						}
					}
					syncManager.syncContacts();
				}
				await mailLocator.mailboxModel.init();
				await mailLocator.mailModel.init();
			},
			async onFullLoginSuccess() {
				await mailLocator.groupManagementFacade.migrateLocalAdminsToGlobalAdmins();
				if (isOfflineStorageAvailable()) {
					await mailLocator.logins.loadCustomizations(CacheMode.WriteOnly);
					mithril_default.redraw();
				}
				if (mailLocator.mailModel.canManageLabels() && !mailLocator.logins.getUserController().props.defaultLabelCreated) {
					const { TutanotaPropertiesTypeRef } = await import("./TypeRefs3-chunk.js");
					const reloadTutanotaProperties = await mailLocator.entityClient.loadRoot(TutanotaPropertiesTypeRef, mailLocator.logins.getUserController().user.userGroup.group, { cacheMode: CacheMode.WriteOnly });
					if (!reloadTutanotaProperties.defaultLabelCreated) {
						const mailboxDetail = await mailLocator.mailboxModel.getMailboxDetails();
						mailLocator.mailFacade.createLabel(assertNotNull(mailboxDetail[0].mailbox._ownerGroup), {
							name: lang.get("importantLabel_label"),
							color: "#FEDC59"
						}).then(() => {
							mailLocator.logins.getUserController().props.defaultLabelCreated = true;
							mailLocator.entityClient.update(mailLocator.logins.getUserController().props);
						});
					}
				}
			}
		};
	});
	if (isOfflineStorageAvailable()) {
		const { CachePostLoginAction } = await import("./CachePostLoginAction-chunk.js");
		mailLocator.logins.addPostLoginAction(async () => new CachePostLoginAction(await mailLocator.calendarModel(), mailLocator.entityClient, mailLocator.progressTracker, mailLocator.cacheStorage, mailLocator.logins));
	}
	if (isDesktop()) mailLocator.logins.addPostLoginAction(async () => {
		return {
			onPartialLoginSuccess: async () => {},
			onFullLoginSuccess: async (event) => {
				if (event.sessionType === SessionType.Persistent) {
					const controller = await mailLocator.mailExportController();
					controller.resumeIfNeeded();
				}
			}
		};
	});
	styles.init(mailLocator.themeController);
	const contactViewResolver = makeViewResolver({
		prepareRoute: async () => {
			const { ContactView } = await import("./ContactView2-chunk.js");
			const drawerAttrsFactory = await mailLocator.drawerAttrsFactory();
			return {
				component: ContactView,
				cache: {
					drawerAttrsFactory,
					header: await mailLocator.appHeaderAttrs(),
					contactViewModel: await mailLocator.contactViewModel(),
					contactListViewModel: await mailLocator.contactListViewModel()
				}
			};
		},
		prepareAttrs: (cache) => ({
			drawerAttrs: cache.drawerAttrsFactory(),
			header: cache.header,
			contactViewModel: cache.contactViewModel,
			contactListViewModel: cache.contactListViewModel
		})
	}, mailLocator.logins);
	const paths = applicationPaths({
		login: makeViewResolver({
			prepareRoute: async () => {
				const migrator = await mailLocator.credentialFormatMigrator();
				await migrator.migrate();
				const { LoginView } = await import("./LoginView-chunk.js");
				const makeViewModel = await mailLocator.loginViewModelFactory();
				return {
					component: LoginView,
					cache: { makeViewModel }
				};
			},
			prepareAttrs: ({ makeViewModel }) => ({
				targetPath: "/mail",
				makeViewModel
			}),
			requireLogin: false
		}, mailLocator.logins),
		termination: makeViewResolver({
			prepareRoute: async () => {
				const { TerminationViewModel } = await import("./TerminationViewModel-chunk.js");
				const { TerminationView } = await import("./TerminationView-chunk.js");
				return {
					component: TerminationView,
					cache: {
						makeViewModel: () => new TerminationViewModel(mailLocator.logins, mailLocator.secondFactorHandler, mailLocator.serviceExecutor, mailLocator.entityClient),
						header: await mailLocator.appHeaderAttrs()
					}
				};
			},
			prepareAttrs: ({ makeViewModel, header }) => ({
				makeViewModel,
				header
			}),
			requireLogin: false
		}, mailLocator.logins),
		contact: contactViewResolver,
		contactList: contactViewResolver,
		externalLogin: makeViewResolver({
			prepareRoute: async () => {
				const { ExternalLoginView } = await import("./ExternalLoginView-chunk.js");
				const makeViewModel = await mailLocator.externalLoginViewModelFactory();
				return {
					component: ExternalLoginView,
					cache: {
						header: await mailLocator.appHeaderAttrs(),
						makeViewModel
					}
				};
			},
			prepareAttrs: ({ header, makeViewModel }) => ({
				header,
				viewModelFactory: makeViewModel
			}),
			requireLogin: false
		}, mailLocator.logins),
		mail: makeViewResolver({
			prepareRoute: async (previousCache) => {
				const { MailView } = await import("./MailView-chunk.js");
				return {
					component: MailView,
					cache: previousCache ?? {
						drawerAttrsFactory: await mailLocator.drawerAttrsFactory(),
						cache: {
							mailList: null,
							selectedFolder: null,
							conversationViewModel: null,
							conversationViewPreference: null
						},
						header: await mailLocator.appHeaderAttrs(),
						mailViewModel: await mailLocator.mailViewModel()
					}
				};
			},
			prepareAttrs: ({ drawerAttrsFactory, cache, header, mailViewModel }) => ({
				drawerAttrs: drawerAttrsFactory(),
				cache,
				header,
				desktopSystemFacade: mailLocator.desktopSystemFacade,
				mailViewModel
			})
		}, mailLocator.logins),
		settings: makeViewResolver({
			prepareRoute: async () => {
				const { SettingsView } = await import("./SettingsView-chunk.js");
				const drawerAttrsFactory = await mailLocator.drawerAttrsFactory();
				return {
					component: SettingsView,
					cache: {
						drawerAttrsFactory,
						header: await mailLocator.appHeaderAttrs()
					}
				};
			},
			prepareAttrs: (cache) => ({
				drawerAttrs: cache.drawerAttrsFactory(),
				header: cache.header,
				logins: mailLocator.logins
			})
		}, mailLocator.logins),
		search: makeViewResolver({
			prepareRoute: async () => {
				const { SearchView } = await import("./SearchView-chunk.js");
				const drawerAttrsFactory = await mailLocator.drawerAttrsFactory();
				return {
					component: SearchView,
					cache: {
						drawerAttrsFactory,
						header: await mailLocator.appHeaderAttrs(),
						searchViewModelFactory: await mailLocator.searchViewModelFactory(),
						contactModel: mailLocator.contactModel
					}
				};
			},
			prepareAttrs: (cache) => ({
				drawerAttrs: cache.drawerAttrsFactory(),
				header: cache.header,
				makeViewModel: cache.searchViewModelFactory,
				contactModel: cache.contactModel
			})
		}, mailLocator.logins),
		calendar: makeViewResolver({
			prepareRoute: async (cache) => {
				const { CalendarView } = await import("./CalendarView-chunk.js");
				const { lazySearchBar } = await import("./LazySearchBar2-chunk.js");
				const drawerAttrsFactory = await mailLocator.drawerAttrsFactory();
				return {
					component: CalendarView,
					cache: cache ?? {
						drawerAttrsFactory,
						header: await mailLocator.appHeaderAttrs(),
						calendarViewModel: await mailLocator.calendarViewModel(),
						bottomNav: () => mithril_default(BottomNav),
						lazySearchBar: () => mithril_default(lazySearchBar, { placeholder: lang.get("searchCalendar_placeholder") })
					}
				};
			},
			prepareAttrs: ({ header, calendarViewModel, drawerAttrsFactory, bottomNav, lazySearchBar }) => ({
				drawerAttrs: drawerAttrsFactory(),
				header,
				calendarViewModel,
				bottomNav,
				lazySearchBar
			})
		}, mailLocator.logins),
		signup: { async onmatch() {
			const { showSignupDialog } = await import("./LoginUtils2-chunk.js");
			const urlParams = mithril_default.parseQueryString(location.search.substring(1) + "&" + location.hash.substring(1));
			showSignupDialog(urlParams);
			const canonicalEl = document.querySelector("link[rel=canonical]");
			if (canonicalEl) canonicalEl.href = "https://app.tuta.com/signup";
			mithril_default.route.set("/login", {
				noAutoLogin: true,
				keepSession: true
			});
			mithril_default.route.set("/login", {
				noAutoLogin: true,
				keepSession: true
			});
			return null;
		} },
		giftcard: { async onmatch() {
			const { showGiftCardDialog } = await import("./LoginUtils2-chunk.js");
			showGiftCardDialog(location.hash);
			mithril_default.route.set("/login", {
				noAutoLogin: true,
				keepSession: true
			});
			return null;
		} },
		recover: { async onmatch(args) {
			const { showRecoverDialog } = await import("./LoginUtils2-chunk.js");
			const resetAction = args.resetAction === "password" || args.resetAction === "secondFactor" ? args.resetAction : "password";
			const mailAddress = typeof args.mailAddress === "string" ? args.mailAddress : "";
			showRecoverDialog(mailAddress, resetAction);
			mithril_default.route.set("/login", { noAutoLogin: true });
			return null;
		} },
		webauthn: makeOldViewResolver(async () => {
			const { BrowserWebauthn } = await import("./BrowserWebauthn2-chunk.js");
			const { NativeWebauthnView } = await import("./NativeWebauthnView-chunk.js");
			const { WebauthnNativeBridge } = await import("./WebauthnNativeBridge-chunk.js");
			const domainConfig$1 = mailLocator.domainConfigProvider().getDomainConfigForHostname(location.hostname, location.protocol, location.port);
			const creds = navigator.credentials;
			return new NativeWebauthnView(new BrowserWebauthn(creds, domainConfig$1), new WebauthnNativeBridge());
		}, {
			requireLogin: false,
			cacheView: false
		}, mailLocator.logins),
		webauthnmobile: makeViewResolver({
			prepareRoute: async () => {
				const { MobileWebauthnView } = await import("./MobileWebauthnView-chunk.js");
				const { BrowserWebauthn } = await import("./BrowserWebauthn2-chunk.js");
				const domainConfig$1 = mailLocator.domainConfigProvider().getDomainConfigForHostname(location.hostname, location.protocol, location.port);
				return {
					component: MobileWebauthnView,
					cache: { browserWebauthn: new BrowserWebauthn(navigator.credentials, domainConfig$1) }
				};
			},
			prepareAttrs: (cache) => cache,
			requireLogin: false
		}, mailLocator.logins)
	});
	mithril_default.route.prefix = neverNull(urlPrefixes.prefix).replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent);
	const resolvers = { "/": { onmatch: (args, requestedPath) => forceLogin(args, requestedPath) } };
	for (let path in paths) resolvers[path] = paths[path];
	resolvers["/:path..."] = { onmatch: async () => {
		const { NotFoundPage } = await import("./NotFoundPage-chunk.js");
		return { view: () => mithril_default(root, mithril_default(NotFoundPage)) };
	} };
	mithril_default.route(document.body, startRoute, resolvers);
	if (isApp() || isDesktop()) await mailLocator.native.init();
	if (isDesktop()) {
		const { exposeNativeInterface } = await import("./ExposeNativeInterface-chunk.js");
		mailLocator.logins.addPostLoginAction(async () => exposeNativeInterface(mailLocator.native).postLoginActions);
	}
	const domainConfig = mailLocator.domainConfigProvider().getCurrentDomainConfig();
	const serviceworker = await import("./ServiceWorkerClient-chunk.js");
	serviceworker.init(domainConfig);
	printJobsMessage(domainConfig);
});
function forceLogin(args, requestedPath) {
	if (requestedPath.indexOf("#mail") !== -1) mithril_default.route.set(`/ext${location.hash}`);
else if (requestedPath.startsWith("/#")) mithril_default.route.set("/login");
else {
		let pathWithoutParameter = requestedPath.indexOf("?") > 0 ? requestedPath.substring(0, requestedPath.indexOf("?")) : requestedPath;
		if (pathWithoutParameter.trim() === "/") {
			let newQueryString = mithril_default.buildQueryString(args);
			mithril_default.route.set(`/login` + (newQueryString.length > 0 ? "?" + newQueryString : ""));
		} else mithril_default.route.set(`/login?requestedPath=${encodeURIComponent(requestedPath)}`);
	}
}
function setupExceptionHandling() {
	window.addEventListener("error", function(evt) {
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
			handleUncaughtError(evt.error);
			evt.preventDefault();
		}
	});
	window.addEventListener("unhandledrejection", function(evt) {
		handleUncaughtError(evt.reason);
		evt.preventDefault();
	});
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
function makeViewResolver({ prepareRoute, prepareAttrs, requireLogin }, logins) {
	requireLogin = requireLogin ?? true;
	let cache;
	return {
		async onmatch(args, requestedPath) {
			if (requireLogin && !logins.isUserLoggedIn()) {
				forceLogin(args, requestedPath);
				return null;
			} else if (!requireLogin && logins.isUserLoggedIn() && !args.keepSession) {
				await disableErrorHandlingDuringLogout();
				await logins.logout(false);
				windowFacade.reload(args);
				return null;
			} else {
				const prepared = await prepareRoute(cache);
				cache = prepared.cache;
				return prepared.component;
			}
		},
		render(vnode) {
			const args = mithril_default.route.param();
			const requestedPath = mithril_default.route.get();
			const c = vnode.tag;
			const attrs = {
				requestedPath,
				args,
				...prepareAttrs(assertNotNull(cache))
			};
			return mithril_default(root, mithril_default(c, {
				...attrs,
				oncreate({ state }) {
					window.tutao.currentView = state;
				}
			}));
		}
	};
}
function makeOldViewResolver(makeView, { requireLogin, cacheView } = {}, logins) {
	requireLogin = requireLogin ?? true;
	cacheView = cacheView ?? true;
	const viewCache = { view: null };
	return {
		onmatch: async (args, requestedPath) => {
			if (requireLogin && !logins.isUserLoggedIn()) forceLogin(args, requestedPath);
else if (!requireLogin && logins.isUserLoggedIn()) {
				await disableErrorHandlingDuringLogout();
				await logins.logout(false);
				windowFacade.reload(args);
			} else {
				let promise;
				if (viewCache.view == null) promise = makeView(args, requestedPath).then((view) => {
					if (cacheView) viewCache.view = view;
					return view;
				});
else promise = Promise.resolve(viewCache.view);
				Promise.all([promise]).then(([view]) => {
					view.updateUrl?.(args, requestedPath);
					window.tutao.currentView = view;
				});
				return promise;
			}
		},
		render: (vnode) => {
			return mithril_default(root, vnode);
		}
	};
}
function assignEnvPlatformId(urlQueryParams$1) {
	const platformId = urlQueryParams$1["platformId"];
	if (isApp() || isDesktop()) if (isApp() && (platformId === "android" || platformId === "ios") || isDesktop() && (platformId === "linux" || platformId === "win32" || platformId === "darwin")) env.platformId = platformId;
else throw new ProgrammingError(`Invalid platform id: ${String(platformId)}`);
}
function extractPathPrefixes() {
	const prefix = location.pathname.endsWith("/") ? location.pathname.substring(0, location.pathname.length - 1) : location.pathname;
	const prefixWithoutFile = prefix.includes(".") ? prefix.substring(0, prefix.lastIndexOf("/")) : prefix;
	return Object.freeze({
		prefix,
		prefixWithoutFile
	});
}
function getStartUrl(urlQueryParams$1) {
	let redirectTo = urlQueryParams$1["r"];
	if (redirectTo) {
		delete urlQueryParams$1["r"];
		if (typeof redirectTo !== "string") redirectTo = "";
	} else redirectTo = "";
	let newQueryString = mithril_default.buildQueryString(urlQueryParams$1);
	if (newQueryString.length > 0) newQueryString = "?" + newQueryString;
	let target = redirectTo + newQueryString;
	if (target === "" || target[0] !== "/") target = "/" + target;
	if (!new URL(urlPrefixes.prefix + target, window.location.href).hash) target += location.hash;
	return target;
}
function registerForMailto() {
	if (window.parent === window && !isDesktop() && typeof navigator.registerProtocolHandler === "function") {
		let origin = location.origin;
		try {
			navigator.registerProtocolHandler("mailto", origin + "/mailto#url=%s", "Tuta Mail");
		} catch (e) {
			console.log("Failed to register a mailto: protocol handler ", e);
		}
	}
}
function printJobsMessage(domainConfig) {
	if (env.dist && domainConfig.firstPartyDomain) console.log(`

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

`);
}

//#endregion
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwibmFtZXMiOlsiY3VycmVudFZpZXc6IENvbXBvbmVudDx1bmtub3duPiB8IG51bGwiLCJjYW5vbmljYWxFbDogSFRNTExpbmtFbGVtZW50IHwgbnVsbCIsImFyZ3M6IGFueSIsImRvbWFpbkNvbmZpZyIsInJlc29sdmVyczogUm91dGVEZWZzIiwiYXJnczogUmVjb3JkPHN0cmluZywgRGljdD4iLCJyZXF1ZXN0ZWRQYXRoOiBzdHJpbmciLCJsb2dpbnM6IExvZ2luQ29udHJvbGxlciIsImNhY2hlOiBSb3V0ZUNhY2hlIHwgbnVsbCIsInZub2RlOiBWbm9kZTxDb21wb25lbnRUeXBlPiIsIm1ha2VWaWV3OiAoYXJnczogb2JqZWN0LCByZXF1ZXN0ZWRQYXRoOiBzdHJpbmcpID0+IFByb21pc2U8VG9wTGV2ZWxWaWV3PiIsInZpZXdDYWNoZTogeyB2aWV3OiBUb3BMZXZlbFZpZXcgfCBudWxsIH0iLCJwcm9taXNlOiBQcm9taXNlPFRvcExldmVsVmlldz4iLCJ1cmxRdWVyeVBhcmFtczogTWl0aHJpbC5QYXJhbXMiLCJ1cmxRdWVyeVBhcmFtcyIsImRvbWFpbkNvbmZpZzogRG9tYWluQ29uZmlnIl0sInNvdXJjZXMiOlsiLi4vc3JjL21haWwtYXBwL0FwcGxpY2F0aW9uUGF0aHMudHMiLCIuLi9zcmMvbWFpbC1hcHAvYXBwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIEBidW5kbGVJbnRvOmJvb3RcblxuaW1wb3J0IHsgUm91dGVSZXNvbHZlciB9IGZyb20gXCJtaXRocmlsXCJcblxuZXhwb3J0IHR5cGUgQXBwbGljYXRpb25QYXRocyA9IFJlY29yZDxzdHJpbmcsIFJvdXRlUmVzb2x2ZXI+XG50eXBlIFZpZXdSZXNvbHZlcnMgPSB7XG5cdGxvZ2luOiBSb3V0ZVJlc29sdmVyXG5cdHRlcm1pbmF0aW9uOiBSb3V0ZVJlc29sdmVyXG5cdG1haWw6IFJvdXRlUmVzb2x2ZXJcblx0ZXh0ZXJuYWxMb2dpbjogUm91dGVSZXNvbHZlclxuXHRjb250YWN0OiBSb3V0ZVJlc29sdmVyXG5cdGNvbnRhY3RMaXN0OiBSb3V0ZVJlc29sdmVyXG5cdHNlYXJjaDogUm91dGVSZXNvbHZlclxuXHRzZXR0aW5nczogUm91dGVSZXNvbHZlclxuXHRjYWxlbmRhcjogUm91dGVSZXNvbHZlclxuXHRzaWdudXA6IFJvdXRlUmVzb2x2ZXJcblx0Z2lmdGNhcmQ6IFJvdXRlUmVzb2x2ZXJcblx0cmVjb3ZlcjogUm91dGVSZXNvbHZlclxuXHR3ZWJhdXRobjogUm91dGVSZXNvbHZlclxuXHR3ZWJhdXRobm1vYmlsZTogUm91dGVSZXNvbHZlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbGljYXRpb25QYXRocyh7XG5cdGxvZ2luLFxuXHR0ZXJtaW5hdGlvbixcblx0bWFpbCxcblx0ZXh0ZXJuYWxMb2dpbixcblx0Y29udGFjdCxcblx0Y29udGFjdExpc3QsXG5cdHNlYXJjaCxcblx0c2V0dGluZ3MsXG5cdGNhbGVuZGFyLFxuXHRzaWdudXAsXG5cdGdpZnRjYXJkLFxuXHRyZWNvdmVyLFxuXHR3ZWJhdXRobixcblx0d2ViYXV0aG5tb2JpbGUsXG59OiBWaWV3UmVzb2x2ZXJzKTogQXBwbGljYXRpb25QYXRocyB7XG5cdHJldHVybiB7XG5cdFx0XCIvbG9naW5cIjogbG9naW4sXG5cdFx0XCIvdGVybWluYXRpb25cIjogdGVybWluYXRpb24sXG5cdFx0XCIvc2lnbnVwXCI6IHNpZ251cCxcblx0XHRcIi9yZWNvdmVyXCI6IHJlY292ZXIsXG5cdFx0XCIvbWFpbHRvXCI6IG1haWwsXG5cdFx0XCIvbWFpbFwiOiBtYWlsLFxuXHRcdFwiL21haWwvOmZvbGRlcklkXCI6IG1haWwsXG5cdFx0XCIvbWFpbC86Zm9sZGVySWQvOm1haWxJZFwiOiBtYWlsLFxuXHRcdFwiL2V4dFwiOiBleHRlcm5hbExvZ2luLFxuXHRcdFwiL2NvbnRhY3RcIjogY29udGFjdCxcblx0XHRcIi9jb250YWN0LzpsaXN0SWRcIjogY29udGFjdCxcblx0XHRcIi9jb250YWN0LzpsaXN0SWQvOmNvbnRhY3RJZFwiOiBjb250YWN0LFxuXHRcdFwiL2NvbnRhY3RsaXN0XCI6IGNvbnRhY3RMaXN0LFxuXHRcdFwiL2NvbnRhY3RsaXN0LzpsaXN0SWRcIjogY29udGFjdExpc3QsXG5cdFx0XCIvY29udGFjdGxpc3QvOmxpc3RJZC86SWRcIjogY29udGFjdExpc3QsXG5cdFx0XCIvc2VhcmNoLzpjYXRlZ29yeVwiOiBzZWFyY2gsXG5cdFx0XCIvc2VhcmNoLzpjYXRlZ29yeS86aWRcIjogc2VhcmNoLFxuXHRcdFwiL3NldHRpbmdzXCI6IHNldHRpbmdzLFxuXHRcdFwiL3NldHRpbmdzLzpmb2xkZXJcIjogc2V0dGluZ3MsXG5cdFx0XCIvc2V0dGluZ3MvOmZvbGRlci86aWRcIjogc2V0dGluZ3MsXG5cdFx0XCIvY2FsZW5kYXJcIjogY2FsZW5kYXIsXG5cdFx0XCIvY2FsZW5kYXIvOnZpZXdcIjogY2FsZW5kYXIsXG5cdFx0XCIvY2FsZW5kYXIvOnZpZXcvOmRhdGVcIjogY2FsZW5kYXIsXG5cdFx0XCIvZ2lmdGNhcmQvXCI6IGdpZnRjYXJkLFxuXHRcdFwiL3dlYmF1dGhuXCI6IHdlYmF1dGhuLFxuXHRcdFwiL3dlYmF1dGhubW9iaWxlXCI6IHdlYmF1dGhubW9iaWxlLFxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXRoQmFzZXMoKTogQXJyYXk8c3RyaW5nPiB7XG5cdGNvbnN0IHBhdGhzID0gT2JqZWN0LmtleXMoYXBwbGljYXRpb25QYXRocyh7fSBhcyBhbnkpKVxuXHRjb25zdCB1bmlxdWVQYXRoQmFzZXMgPSBuZXcgU2V0KHBhdGhzLm1hcCgocGF0aCkgPT4gcGF0aC5zcGxpdChcIi9cIilbMV0pKVxuXHRyZXR1cm4gQXJyYXkuZnJvbSh1bmlxdWVQYXRoQmFzZXMpXG59XG4iLCJpbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvQ2xpZW50RGV0ZWN0b3IuanNcIlxuaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IE1pdGhyaWwsIHsgQ2hpbGRyZW4sIENsYXNzQ29tcG9uZW50LCBDb21wb25lbnQsIFJvdXRlRGVmcywgUm91dGVSZXNvbHZlciwgVm5vZGUsIFZub2RlRE9NIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgbGFuZywgbGFuZ3VhZ2VDb2RlVG9UYWcsIGxhbmd1YWdlcyB9IGZyb20gXCIuLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyByb290IH0gZnJvbSBcIi4uL1Jvb3RWaWV3LmpzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIG5ldmVyTnVsbCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgd2luZG93RmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL1dpbmRvd0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBzdHlsZXMgfSBmcm9tIFwiLi4vY29tbW9uL2d1aS9zdHlsZXMuanNcIlxuaW1wb3J0IHsgZGV2aWNlQ29uZmlnIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL0RldmljZUNvbmZpZy5qc1wiXG5pbXBvcnQgeyBMb2dnZXIsIHJlcGxhY2VOYXRpdmVMb2dnZXIgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9jb21tb24vTG9nZ2VyLmpzXCJcbmltcG9ydCB7IGFwcGxpY2F0aW9uUGF0aHMgfSBmcm9tIFwiLi9BcHBsaWNhdGlvblBhdGhzLmpzXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgdHlwZSB7IExvZ2luVmlldywgTG9naW5WaWV3QXR0cnMgfSBmcm9tIFwiLi4vY29tbW9uL2xvZ2luL0xvZ2luVmlldy5qc1wiXG5pbXBvcnQgdHlwZSB7IExvZ2luVmlld01vZGVsIH0gZnJvbSBcIi4uL2NvbW1vbi9sb2dpbi9Mb2dpblZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBUZXJtaW5hdGlvblZpZXcsIFRlcm1pbmF0aW9uVmlld0F0dHJzIH0gZnJvbSBcIi4uL2NvbW1vbi90ZXJtaW5hdGlvbi9UZXJtaW5hdGlvblZpZXcuanNcIlxuaW1wb3J0IHsgVGVybWluYXRpb25WaWV3TW9kZWwgfSBmcm9tIFwiLi4vY29tbW9uL3Rlcm1pbmF0aW9uL1Rlcm1pbmF0aW9uVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IE1vYmlsZVdlYmF1dGhuQXR0cnMsIE1vYmlsZVdlYmF1dGhuVmlldyB9IGZyb20gXCIuLi9jb21tb24vbG9naW4vTW9iaWxlV2ViYXV0aG5WaWV3LmpzXCJcbmltcG9ydCB7IEJyb3dzZXJXZWJhdXRobiB9IGZyb20gXCIuLi9jb21tb24vbWlzYy8yZmEvd2ViYXV0aG4vQnJvd3NlcldlYmF1dGhuLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyVmlldywgQ2FsZW5kYXJWaWV3QXR0cnMgfSBmcm9tIFwiLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL3ZpZXcvQ2FsZW5kYXJWaWV3LmpzXCJcbmltcG9ydCB7IERyYXdlck1lbnVBdHRycyB9IGZyb20gXCIuLi9jb21tb24vZ3VpL25hdi9EcmF3ZXJNZW51LmpzXCJcbmltcG9ydCB7IE1haWxWaWV3LCBNYWlsVmlld0F0dHJzLCBNYWlsVmlld0NhY2hlIH0gZnJvbSBcIi4vbWFpbC92aWV3L01haWxWaWV3LmpzXCJcbmltcG9ydCB7IENvbnRhY3RWaWV3LCBDb250YWN0Vmlld0F0dHJzIH0gZnJvbSBcIi4vY29udGFjdHMvdmlldy9Db250YWN0Vmlldy5qc1wiXG5pbXBvcnQgeyBTZXR0aW5nc1ZpZXcgfSBmcm9tIFwiLi9zZXR0aW5ncy9TZXR0aW5nc1ZpZXcuanNcIlxuaW1wb3J0IHsgU2VhcmNoVmlldywgU2VhcmNoVmlld0F0dHJzIH0gZnJvbSBcIi4vc2VhcmNoL3ZpZXcvU2VhcmNoVmlldy5qc1wiXG5pbXBvcnQgeyBUb3BMZXZlbEF0dHJzLCBUb3BMZXZlbFZpZXcgfSBmcm9tIFwiLi4vVG9wTGV2ZWxWaWV3LmpzXCJcbmltcG9ydCB7IEFwcEhlYWRlckF0dHJzIH0gZnJvbSBcIi4uL2NvbW1vbi9ndWkvSGVhZGVyLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyVmlld01vZGVsIH0gZnJvbSBcIi4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L0NhbGVuZGFyVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IEV4dGVybmFsTG9naW5WaWV3LCBFeHRlcm5hbExvZ2luVmlld0F0dHJzLCBFeHRlcm5hbExvZ2luVmlld01vZGVsIH0gZnJvbSBcIi4vbWFpbC92aWV3L0V4dGVybmFsTG9naW5WaWV3LmpzXCJcbmltcG9ydCB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuLi9jb21tb24vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcbmltcG9ydCB0eXBlIHsgTWFpbFZpZXdNb2RlbCB9IGZyb20gXCIuL21haWwvdmlldy9NYWlsVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IFNlYXJjaFZpZXdNb2RlbCB9IGZyb20gXCIuL3NlYXJjaC92aWV3L1NlYXJjaFZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBDb250YWN0Vmlld01vZGVsIH0gZnJvbSBcIi4vY29udGFjdHMvdmlldy9Db250YWN0Vmlld01vZGVsLmpzXCJcbmltcG9ydCB7IENvbnRhY3RMaXN0Vmlld01vZGVsIH0gZnJvbSBcIi4vY29udGFjdHMvdmlldy9Db250YWN0TGlzdFZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlQm9vdCwgYm9vdEZpbmlzaGVkLCBpc0FwcCwgaXNEZXNrdG9wLCBpc0lPU0FwcCwgaXNPZmZsaW5lU3RvcmFnZUF2YWlsYWJsZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHsgU2V0dGluZ3NWaWV3QXR0cnMgfSBmcm9tIFwiLi4vY29tbW9uL3NldHRpbmdzL0ludGVyZmFjZXMuanNcIlxuaW1wb3J0IHsgZGlzYWJsZUVycm9ySGFuZGxpbmdEdXJpbmdMb2dvdXQsIGhhbmRsZVVuY2F1Z2h0RXJyb3IgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvRXJyb3JIYW5kbGVyLmpzXCJcbmltcG9ydCB7IEFwcFR5cGUgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvQ2xpZW50Q29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IENvbnRhY3RNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vY29udGFjdHNGdW5jdGlvbmFsaXR5L0NvbnRhY3RNb2RlbC5qc1wiXG5pbXBvcnQgeyBDYWNoZU1vZGUgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvcmVzdC9FbnRpdHlSZXN0Q2xpZW50XCJcbmltcG9ydCB7IFNlc3Npb25UeXBlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvY29tbW9uL1Nlc3Npb25UeXBlLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZUJvb3QoKVxuYm9vdEZpbmlzaGVkKClcblxuY29uc3QgdXJsUXVlcnlQYXJhbXMgPSBtLnBhcnNlUXVlcnlTdHJpbmcobG9jYXRpb24uc2VhcmNoKVxuXG5hc3NpZ25FbnZQbGF0Zm9ybUlkKHVybFF1ZXJ5UGFyYW1zKVxucmVwbGFjZU5hdGl2ZUxvZ2dlcih3aW5kb3csIG5ldyBMb2dnZXIoKSlcblxubGV0IGN1cnJlbnRWaWV3OiBDb21wb25lbnQ8dW5rbm93bj4gfCBudWxsID0gbnVsbFxud2luZG93LnR1dGFvID0ge1xuXHRjbGllbnQsXG5cdG0sXG5cdGxhbmcsXG5cdHJvb3QsXG5cdGN1cnJlbnRWaWV3LFxuXHRsb2NhdG9yOiBudWxsLFxufVxuXG5jbGllbnQuaW5pdChuYXZpZ2F0b3IudXNlckFnZW50LCBuYXZpZ2F0b3IucGxhdGZvcm0sIEFwcFR5cGUuTWFpbClcblxuaWYgKCFjbGllbnQuaXNTdXBwb3J0ZWQoKSkge1xuXHR0aHJvdyBuZXcgRXJyb3IoXCJVbnN1cHBvcnRlZFwiKVxufVxuXG4vLyBTZXR1cCBleGNlcHRpb24gaGFuZGxpbmcgYWZ0ZXIgY2hlY2tpbmcgZm9yIGNsaWVudCBzdXBwb3J0LCBiZWNhdXNlIGluIGFuZHJvaWQgdGhlIEVycm9yIGlzIGNhdWdodCBieSB0aGUgdW5oYW5kbGVkIHJlamVjdGlvbiBoYW5kbGVyXG4vLyBhbmQgdGhlbiB0aGUgXCJVcGRhdGUgV2ViVmlld1wiIG1lc3NhZ2Ugd2lsbCBuZXZlciBiZSBzaG93XG4vLyB3ZSBzdGlsbCB3YW50IHRvIGRvIHRoaXMgQVNBUCBzbyB3ZSBjYW4gaGFuZGxlIG90aGVyIGVycm9yc1xuc2V0dXBFeGNlcHRpb25IYW5kbGluZygpXG5cbi8vIElmIHRoZSB3ZWJhcHAgaXMgc2VydmVkIHVuZGVyIHNvbWUgZm9sZGVyIGUuZy4gL2J1aWxkIHdlIHdhbnQgdG8gY29uc2lkZXIgdGhpcyBvdXIgcm9vdFxuY29uc3QgdXJsUHJlZml4ZXMgPSBleHRyYWN0UGF0aFByZWZpeGVzKClcbi8vIFdyaXRlIGl0IGhlcmUgZm9yIHRoZSBXb3JrZXJDbGllbnQgc28gdGhhdCBpdCBjYW4gbG9hZCByZWxhdGl2ZSB3b3JrZXIgZWFzaWx5LiBTaG91bGQgZG8gaXQgaGVyZSBzbyB0aGF0IGl0IGRvZXNuJ3QgYnJlYWsgYWZ0ZXIgSE1SLlxud2luZG93LnR1dGFvLmFwcFN0YXRlID0gdXJsUHJlZml4ZXNcblxuY29uc3Qgc3RhcnRSb3V0ZSA9IGdldFN0YXJ0VXJsKHVybFF1ZXJ5UGFyYW1zKVxuaGlzdG9yeS5yZXBsYWNlU3RhdGUobnVsbCwgXCJcIiwgdXJsUHJlZml4ZXMucHJlZml4ICsgc3RhcnRSb3V0ZSlcblxucmVnaXN0ZXJGb3JNYWlsdG8oKVxuXG5pbXBvcnQoXCIuL3RyYW5zbGF0aW9ucy9lbi5qc1wiKVxuXHQudGhlbigoZW4pID0+IGxhbmcuaW5pdChlbi5kZWZhdWx0KSlcblx0LnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9ndWkvbWFpbi1zdHlsZXMuanNcIilcblxuXHRcdC8vIGRvIHRoaXMgYWZ0ZXIgbGFuZyBpbml0aWFsaXplZFxuXHRcdGNvbnN0IHsgaW5pdENvbW1vbkxvY2F0b3IgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCIpXG5cdFx0Y29uc3QgeyBtYWlsTG9jYXRvciB9ID0gYXdhaXQgaW1wb3J0KFwiLi9tYWlsTG9jYXRvci5qc1wiKVxuXHRcdGF3YWl0IG1haWxMb2NhdG9yLmluaXQoKVxuXG5cdFx0aW5pdENvbW1vbkxvY2F0b3IobWFpbExvY2F0b3IpXG5cblx0XHRjb25zdCB7IHNldHVwTmF2U2hvcnRjdXRzIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbWlzYy9OYXZTaG9ydGN1dHMuanNcIilcblx0XHRzZXR1cE5hdlNob3J0Y3V0cygpXG5cblx0XHRjb25zdCB7IEJvdHRvbU5hdiB9ID0gYXdhaXQgaW1wb3J0KFwiLi9ndWkvQm90dG9tTmF2LmpzXCIpXG5cblx0XHQvLyB0aGlzIG5lZWRzIHRvIHN0YXkgYWZ0ZXIgY2xpZW50LmluaXRcblx0XHR3aW5kb3dGYWNhZGUuaW5pdChtYWlsTG9jYXRvci5sb2dpbnMsIG1haWxMb2NhdG9yLmNvbm5lY3Rpdml0eU1vZGVsLCAodmlzaWJsZSkgPT4ge1xuXHRcdFx0bWFpbExvY2F0b3IuaW5kZXhlckZhY2FkZT8ub25WaXNpYmlsaXR5Q2hhbmdlZCghZG9jdW1lbnQuaGlkZGVuKVxuXHRcdH0pXG5cdFx0aWYgKGlzRGVza3RvcCgpKSB7XG5cdFx0XHRpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vVXBkYXRlUHJvbXB0LmpzXCIpLnRoZW4oKHsgcmVnaXN0ZXJGb3JVcGRhdGVzIH0pID0+IHJlZ2lzdGVyRm9yVXBkYXRlcyhtYWlsTG9jYXRvci5kZXNrdG9wU2V0dGluZ3NGYWNhZGUpKVxuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXJMYW5ndWFnZSA9IGRldmljZUNvbmZpZy5nZXRMYW5ndWFnZSgpICYmIGxhbmd1YWdlcy5maW5kKChsKSA9PiBsLmNvZGUgPT09IGRldmljZUNvbmZpZy5nZXRMYW5ndWFnZSgpKVxuXG5cdFx0aWYgKHVzZXJMYW5ndWFnZSkge1xuXHRcdFx0Y29uc3QgbGFuZ3VhZ2UgPSB7XG5cdFx0XHRcdGNvZGU6IHVzZXJMYW5ndWFnZS5jb2RlLFxuXHRcdFx0XHRsYW5ndWFnZVRhZzogbGFuZ3VhZ2VDb2RlVG9UYWcodXNlckxhbmd1YWdlLmNvZGUpLFxuXHRcdFx0fVxuXHRcdFx0bGFuZy5zZXRMYW5ndWFnZShsYW5ndWFnZSkuY2F0Y2goKGUpID0+IHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBmZXRjaCB0cmFuc2xhdGlvbjogXCIgKyB1c2VyTGFuZ3VhZ2UuY29kZSwgZSlcblx0XHRcdH0pXG5cblx0XHRcdGlmIChpc0Rlc2t0b3AoKSkge1xuXHRcdFx0XHRtYWlsTG9jYXRvci5kZXNrdG9wU2V0dGluZ3NGYWNhZGUuY2hhbmdlTGFuZ3VhZ2UobGFuZ3VhZ2UuY29kZSwgbGFuZ3VhZ2UubGFuZ3VhZ2VUYWcpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bWFpbExvY2F0b3IubG9naW5zLmFkZFBvc3RMb2dpbkFjdGlvbigoKSA9PiBtYWlsTG9jYXRvci5wb3N0TG9naW5BY3Rpb25zKCkpXG5cdFx0bWFpbExvY2F0b3IubG9naW5zLmFkZFBvc3RMb2dpbkFjdGlvbihhc3luYyAoKSA9PiB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRhc3luYyBvblBhcnRpYWxMb2dpblN1Y2Nlc3MoKSB7XG5cdFx0XHRcdFx0aWYgKGlzQXBwKCkpIHtcblx0XHRcdFx0XHRcdG1haWxMb2NhdG9yLmZpbGVBcHAuY2xlYXJGaWxlRGF0YSgpLmNhdGNoKChlKSA9PiBjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBjbGVhbiBmaWxlIGRhdGFcIiwgZSkpXG5cdFx0XHRcdFx0XHRjb25zdCBzeW5jTWFuYWdlciA9IG1haWxMb2NhdG9yLm5hdGl2ZUNvbnRhY3RzU3luY01hbmFnZXIoKVxuXHRcdFx0XHRcdFx0aWYgKHN5bmNNYW5hZ2VyLmlzRW5hYmxlZCgpICYmIGlzSU9TQXBwKCkpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgY2FuU3luYyA9IGF3YWl0IHN5bmNNYW5hZ2VyLmNhblN5bmMoKVxuXHRcdFx0XHRcdFx0XHRpZiAoIWNhblN5bmMpIHtcblx0XHRcdFx0XHRcdFx0XHRhd2FpdCBzeW5jTWFuYWdlci5kaXNhYmxlU3luYygpXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHN5bmNNYW5hZ2VyLnN5bmNDb250YWN0cygpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGF3YWl0IG1haWxMb2NhdG9yLm1haWxib3hNb2RlbC5pbml0KClcblx0XHRcdFx0XHRhd2FpdCBtYWlsTG9jYXRvci5tYWlsTW9kZWwuaW5pdCgpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGFzeW5jIG9uRnVsbExvZ2luU3VjY2VzcygpIHtcblx0XHRcdFx0XHRhd2FpdCBtYWlsTG9jYXRvci5ncm91cE1hbmFnZW1lbnRGYWNhZGUubWlncmF0ZUxvY2FsQWRtaW5zVG9HbG9iYWxBZG1pbnMoKVxuXG5cdFx0XHRcdFx0Ly8gV2UgbWlnaHQgaGF2ZSBvdXRkYXRlZCBDdXN0b21lciBmZWF0dXJlcywgZm9yY2UgcmVsb2FkIHRoZSBjdXN0b21lciB0byBtYWtlIHN1cmUgdGhlIGN1c3RvbWl6YXRpb25zIGFyZSB1cC10by1kYXRlXG5cdFx0XHRcdFx0aWYgKGlzT2ZmbGluZVN0b3JhZ2VBdmFpbGFibGUoKSkge1xuXHRcdFx0XHRcdFx0YXdhaXQgbWFpbExvY2F0b3IubG9naW5zLmxvYWRDdXN0b21pemF0aW9ucyhDYWNoZU1vZGUuV3JpdGVPbmx5KVxuXHRcdFx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChtYWlsTG9jYXRvci5tYWlsTW9kZWwuY2FuTWFuYWdlTGFiZWxzKCkgJiYgIW1haWxMb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnByb3BzLmRlZmF1bHRMYWJlbENyZWF0ZWQpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHsgVHV0YW5vdGFQcm9wZXJ0aWVzVHlwZVJlZiB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmc1wiKVxuXHRcdFx0XHRcdFx0Y29uc3QgcmVsb2FkVHV0YW5vdGFQcm9wZXJ0aWVzID0gYXdhaXQgbWFpbExvY2F0b3IuZW50aXR5Q2xpZW50LmxvYWRSb290KFxuXHRcdFx0XHRcdFx0XHRUdXRhbm90YVByb3BlcnRpZXNUeXBlUmVmLFxuXHRcdFx0XHRcdFx0XHRtYWlsTG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyLnVzZXJHcm91cC5ncm91cCxcblx0XHRcdFx0XHRcdFx0eyBjYWNoZU1vZGU6IENhY2hlTW9kZS5Xcml0ZU9ubHkgfSxcblx0XHRcdFx0XHRcdClcblxuXHRcdFx0XHRcdFx0aWYgKCFyZWxvYWRUdXRhbm90YVByb3BlcnRpZXMuZGVmYXVsdExhYmVsQ3JlYXRlZCkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBtYWlsYm94RGV0YWlsID0gYXdhaXQgbWFpbExvY2F0b3IubWFpbGJveE1vZGVsLmdldE1haWxib3hEZXRhaWxzKClcblxuXHRcdFx0XHRcdFx0XHRtYWlsTG9jYXRvci5tYWlsRmFjYWRlXG5cdFx0XHRcdFx0XHRcdFx0LmNyZWF0ZUxhYmVsKGFzc2VydE5vdE51bGwobWFpbGJveERldGFpbFswXS5tYWlsYm94Ll9vd25lckdyb3VwKSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0bmFtZTogbGFuZy5nZXQoXCJpbXBvcnRhbnRMYWJlbF9sYWJlbFwiKSxcblx0XHRcdFx0XHRcdFx0XHRcdGNvbG9yOiBcIiNGRURDNTlcIixcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdC50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdG1haWxMb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnByb3BzLmRlZmF1bHRMYWJlbENyZWF0ZWQgPSB0cnVlXG5cdFx0XHRcdFx0XHRcdFx0XHRtYWlsTG9jYXRvci5lbnRpdHlDbGllbnQudXBkYXRlKG1haWxMb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnByb3BzKVxuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fVxuXHRcdH0pXG5cblx0XHRpZiAoaXNPZmZsaW5lU3RvcmFnZUF2YWlsYWJsZSgpKSB7XG5cdFx0XHRjb25zdCB7IENhY2hlUG9zdExvZ2luQWN0aW9uIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vb2ZmbGluZS9DYWNoZVBvc3RMb2dpbkFjdGlvbi5qc1wiKVxuXHRcdFx0bWFpbExvY2F0b3IubG9naW5zLmFkZFBvc3RMb2dpbkFjdGlvbihcblx0XHRcdFx0YXN5bmMgKCkgPT5cblx0XHRcdFx0XHRuZXcgQ2FjaGVQb3N0TG9naW5BY3Rpb24oXG5cdFx0XHRcdFx0XHRhd2FpdCBtYWlsTG9jYXRvci5jYWxlbmRhck1vZGVsKCksXG5cdFx0XHRcdFx0XHRtYWlsTG9jYXRvci5lbnRpdHlDbGllbnQsXG5cdFx0XHRcdFx0XHRtYWlsTG9jYXRvci5wcm9ncmVzc1RyYWNrZXIsXG5cdFx0XHRcdFx0XHRtYWlsTG9jYXRvci5jYWNoZVN0b3JhZ2UsXG5cdFx0XHRcdFx0XHRtYWlsTG9jYXRvci5sb2dpbnMsXG5cdFx0XHRcdFx0KSxcblx0XHRcdClcblx0XHR9XG5cblx0XHRpZiAoaXNEZXNrdG9wKCkpIHtcblx0XHRcdG1haWxMb2NhdG9yLmxvZ2lucy5hZGRQb3N0TG9naW5BY3Rpb24oYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdG9uUGFydGlhbExvZ2luU3VjY2VzczogYXN5bmMgKCkgPT4ge30sXG5cdFx0XHRcdFx0b25GdWxsTG9naW5TdWNjZXNzOiBhc3luYyAoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdC8vIG5vdCBhIHRlbXBvcmFyeSBha2Egc2lnbnVwIGxvZ2luXG5cdFx0XHRcdFx0XHRpZiAoZXZlbnQuc2Vzc2lvblR5cGUgPT09IFNlc3Npb25UeXBlLlBlcnNpc3RlbnQpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgY29udHJvbGxlciA9IGF3YWl0IG1haWxMb2NhdG9yLm1haWxFeHBvcnRDb250cm9sbGVyKClcblx0XHRcdFx0XHRcdFx0Y29udHJvbGxlci5yZXN1bWVJZk5lZWRlZCgpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRzdHlsZXMuaW5pdChtYWlsTG9jYXRvci50aGVtZUNvbnRyb2xsZXIpXG5cblx0XHRjb25zdCBjb250YWN0Vmlld1Jlc29sdmVyID0gbWFrZVZpZXdSZXNvbHZlcjxcblx0XHRcdENvbnRhY3RWaWV3QXR0cnMsXG5cdFx0XHRDb250YWN0Vmlldyxcblx0XHRcdHtcblx0XHRcdFx0ZHJhd2VyQXR0cnNGYWN0b3J5OiAoKSA9PiBEcmF3ZXJNZW51QXR0cnNcblx0XHRcdFx0aGVhZGVyOiBBcHBIZWFkZXJBdHRyc1xuXHRcdFx0XHRjb250YWN0Vmlld01vZGVsOiBDb250YWN0Vmlld01vZGVsXG5cdFx0XHRcdGNvbnRhY3RMaXN0Vmlld01vZGVsOiBDb250YWN0TGlzdFZpZXdNb2RlbFxuXHRcdFx0fVxuXHRcdD4oXG5cdFx0XHR7XG5cdFx0XHRcdHByZXBhcmVSb3V0ZTogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHsgQ29udGFjdFZpZXcgfSA9IGF3YWl0IGltcG9ydChcIi4vY29udGFjdHMvdmlldy9Db250YWN0Vmlldy5qc1wiKVxuXHRcdFx0XHRcdGNvbnN0IGRyYXdlckF0dHJzRmFjdG9yeSA9IGF3YWl0IG1haWxMb2NhdG9yLmRyYXdlckF0dHJzRmFjdG9yeSgpXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGNvbXBvbmVudDogQ29udGFjdFZpZXcsXG5cdFx0XHRcdFx0XHRjYWNoZToge1xuXHRcdFx0XHRcdFx0XHRkcmF3ZXJBdHRyc0ZhY3RvcnksXG5cdFx0XHRcdFx0XHRcdGhlYWRlcjogYXdhaXQgbWFpbExvY2F0b3IuYXBwSGVhZGVyQXR0cnMoKSxcblx0XHRcdFx0XHRcdFx0Y29udGFjdFZpZXdNb2RlbDogYXdhaXQgbWFpbExvY2F0b3IuY29udGFjdFZpZXdNb2RlbCgpLFxuXHRcdFx0XHRcdFx0XHRjb250YWN0TGlzdFZpZXdNb2RlbDogYXdhaXQgbWFpbExvY2F0b3IuY29udGFjdExpc3RWaWV3TW9kZWwoKSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRwcmVwYXJlQXR0cnM6IChjYWNoZSkgPT4gKHtcblx0XHRcdFx0XHRkcmF3ZXJBdHRyczogY2FjaGUuZHJhd2VyQXR0cnNGYWN0b3J5KCksXG5cdFx0XHRcdFx0aGVhZGVyOiBjYWNoZS5oZWFkZXIsXG5cdFx0XHRcdFx0Y29udGFjdFZpZXdNb2RlbDogY2FjaGUuY29udGFjdFZpZXdNb2RlbCxcblx0XHRcdFx0XHRjb250YWN0TGlzdFZpZXdNb2RlbDogY2FjaGUuY29udGFjdExpc3RWaWV3TW9kZWwsXG5cdFx0XHRcdH0pLFxuXHRcdFx0fSxcblx0XHRcdG1haWxMb2NhdG9yLmxvZ2lucyxcblx0XHQpXG5cblx0XHRjb25zdCBwYXRocyA9IGFwcGxpY2F0aW9uUGF0aHMoe1xuXHRcdFx0bG9naW46IG1ha2VWaWV3UmVzb2x2ZXI8TG9naW5WaWV3QXR0cnMsIExvZ2luVmlldywgeyBtYWtlVmlld01vZGVsOiAoKSA9PiBMb2dpblZpZXdNb2RlbCB9Pihcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHByZXBhcmVSb3V0ZTogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWlncmF0b3IgPSBhd2FpdCBtYWlsTG9jYXRvci5jcmVkZW50aWFsRm9ybWF0TWlncmF0b3IoKVxuXHRcdFx0XHRcdFx0YXdhaXQgbWlncmF0b3IubWlncmF0ZSgpXG5cblx0XHRcdFx0XHRcdGNvbnN0IHsgTG9naW5WaWV3IH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbG9naW4vTG9naW5WaWV3LmpzXCIpXG5cdFx0XHRcdFx0XHRjb25zdCBtYWtlVmlld01vZGVsID0gYXdhaXQgbWFpbExvY2F0b3IubG9naW5WaWV3TW9kZWxGYWN0b3J5KClcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdGNvbXBvbmVudDogTG9naW5WaWV3LFxuXHRcdFx0XHRcdFx0XHRjYWNoZToge1xuXHRcdFx0XHRcdFx0XHRcdG1ha2VWaWV3TW9kZWwsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRwcmVwYXJlQXR0cnM6ICh7IG1ha2VWaWV3TW9kZWwgfSkgPT4gKHsgdGFyZ2V0UGF0aDogXCIvbWFpbFwiLCBtYWtlVmlld01vZGVsIH0pLFxuXHRcdFx0XHRcdHJlcXVpcmVMb2dpbjogZmFsc2UsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG1haWxMb2NhdG9yLmxvZ2lucyxcblx0XHRcdCksXG5cdFx0XHR0ZXJtaW5hdGlvbjogbWFrZVZpZXdSZXNvbHZlcjxcblx0XHRcdFx0VGVybWluYXRpb25WaWV3QXR0cnMsXG5cdFx0XHRcdFRlcm1pbmF0aW9uVmlldyxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG1ha2VWaWV3TW9kZWw6ICgpID0+IFRlcm1pbmF0aW9uVmlld01vZGVsXG5cdFx0XHRcdFx0aGVhZGVyOiBBcHBIZWFkZXJBdHRyc1xuXHRcdFx0XHR9XG5cdFx0XHQ+KFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cHJlcGFyZVJvdXRlOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCB7IFRlcm1pbmF0aW9uVmlld01vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vdGVybWluYXRpb24vVGVybWluYXRpb25WaWV3TW9kZWwuanNcIilcblx0XHRcdFx0XHRcdGNvbnN0IHsgVGVybWluYXRpb25WaWV3IH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vdGVybWluYXRpb24vVGVybWluYXRpb25WaWV3LmpzXCIpXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRjb21wb25lbnQ6IFRlcm1pbmF0aW9uVmlldyxcblx0XHRcdFx0XHRcdFx0Y2FjaGU6IHtcblx0XHRcdFx0XHRcdFx0XHRtYWtlVmlld01vZGVsOiAoKSA9PlxuXHRcdFx0XHRcdFx0XHRcdFx0bmV3IFRlcm1pbmF0aW9uVmlld01vZGVsKFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRtYWlsTG9jYXRvci5sb2dpbnMsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG1haWxMb2NhdG9yLnNlY29uZEZhY3RvckhhbmRsZXIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG1haWxMb2NhdG9yLnNlcnZpY2VFeGVjdXRvcixcblx0XHRcdFx0XHRcdFx0XHRcdFx0bWFpbExvY2F0b3IuZW50aXR5Q2xpZW50LFxuXHRcdFx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0XHRoZWFkZXI6IGF3YWl0IG1haWxMb2NhdG9yLmFwcEhlYWRlckF0dHJzKCksXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRwcmVwYXJlQXR0cnM6ICh7IG1ha2VWaWV3TW9kZWwsIGhlYWRlciB9KSA9PiAoeyBtYWtlVmlld01vZGVsLCBoZWFkZXIgfSksXG5cdFx0XHRcdFx0cmVxdWlyZUxvZ2luOiBmYWxzZSxcblx0XHRcdFx0fSxcblx0XHRcdFx0bWFpbExvY2F0b3IubG9naW5zLFxuXHRcdFx0KSxcblx0XHRcdGNvbnRhY3Q6IGNvbnRhY3RWaWV3UmVzb2x2ZXIsXG5cdFx0XHRjb250YWN0TGlzdDogY29udGFjdFZpZXdSZXNvbHZlcixcblx0XHRcdGV4dGVybmFsTG9naW46IG1ha2VWaWV3UmVzb2x2ZXI8XG5cdFx0XHRcdEV4dGVybmFsTG9naW5WaWV3QXR0cnMsXG5cdFx0XHRcdEV4dGVybmFsTG9naW5WaWV3LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aGVhZGVyOiBBcHBIZWFkZXJBdHRyc1xuXHRcdFx0XHRcdG1ha2VWaWV3TW9kZWw6ICgpID0+IEV4dGVybmFsTG9naW5WaWV3TW9kZWxcblx0XHRcdFx0fVxuXHRcdFx0Pihcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHByZXBhcmVSb3V0ZTogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyBFeHRlcm5hbExvZ2luVmlldyB9ID0gYXdhaXQgaW1wb3J0KFwiLi9tYWlsL3ZpZXcvRXh0ZXJuYWxMb2dpblZpZXcuanNcIilcblx0XHRcdFx0XHRcdGNvbnN0IG1ha2VWaWV3TW9kZWwgPSBhd2FpdCBtYWlsTG9jYXRvci5leHRlcm5hbExvZ2luVmlld01vZGVsRmFjdG9yeSgpXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRjb21wb25lbnQ6IEV4dGVybmFsTG9naW5WaWV3LFxuXHRcdFx0XHRcdFx0XHRjYWNoZTogeyBoZWFkZXI6IGF3YWl0IG1haWxMb2NhdG9yLmFwcEhlYWRlckF0dHJzKCksIG1ha2VWaWV3TW9kZWwgfSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHByZXBhcmVBdHRyczogKHsgaGVhZGVyLCBtYWtlVmlld01vZGVsIH0pID0+ICh7IGhlYWRlciwgdmlld01vZGVsRmFjdG9yeTogbWFrZVZpZXdNb2RlbCB9KSxcblx0XHRcdFx0XHRyZXF1aXJlTG9naW46IGZhbHNlLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtYWlsTG9jYXRvci5sb2dpbnMsXG5cdFx0XHQpLFxuXHRcdFx0bWFpbDogbWFrZVZpZXdSZXNvbHZlcjxcblx0XHRcdFx0TWFpbFZpZXdBdHRycyxcblx0XHRcdFx0TWFpbFZpZXcsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRkcmF3ZXJBdHRyc0ZhY3Rvcnk6ICgpID0+IERyYXdlck1lbnVBdHRyc1xuXHRcdFx0XHRcdGNhY2hlOiBNYWlsVmlld0NhY2hlXG5cdFx0XHRcdFx0aGVhZGVyOiBBcHBIZWFkZXJBdHRyc1xuXHRcdFx0XHRcdG1haWxWaWV3TW9kZWw6IE1haWxWaWV3TW9kZWxcblx0XHRcdFx0fVxuXHRcdFx0Pihcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHByZXBhcmVSb3V0ZTogYXN5bmMgKHByZXZpb3VzQ2FjaGUpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHsgTWFpbFZpZXcgfSA9IGF3YWl0IGltcG9ydChcIi4vbWFpbC92aWV3L01haWxWaWV3LmpzXCIpXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRjb21wb25lbnQ6IE1haWxWaWV3LFxuXHRcdFx0XHRcdFx0XHRjYWNoZTogcHJldmlvdXNDYWNoZSA/PyB7XG5cdFx0XHRcdFx0XHRcdFx0ZHJhd2VyQXR0cnNGYWN0b3J5OiBhd2FpdCBtYWlsTG9jYXRvci5kcmF3ZXJBdHRyc0ZhY3RvcnkoKSxcblx0XHRcdFx0XHRcdFx0XHRjYWNoZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0bWFpbExpc3Q6IG51bGwsXG5cdFx0XHRcdFx0XHRcdFx0XHRzZWxlY3RlZEZvbGRlcjogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnZlcnNhdGlvblZpZXdNb2RlbDogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnZlcnNhdGlvblZpZXdQcmVmZXJlbmNlOiBudWxsLFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0aGVhZGVyOiBhd2FpdCBtYWlsTG9jYXRvci5hcHBIZWFkZXJBdHRycygpLFxuXHRcdFx0XHRcdFx0XHRcdG1haWxWaWV3TW9kZWw6IGF3YWl0IG1haWxMb2NhdG9yLm1haWxWaWV3TW9kZWwoKSxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHByZXBhcmVBdHRyczogKHsgZHJhd2VyQXR0cnNGYWN0b3J5LCBjYWNoZSwgaGVhZGVyLCBtYWlsVmlld01vZGVsIH0pID0+ICh7XG5cdFx0XHRcdFx0XHRkcmF3ZXJBdHRyczogZHJhd2VyQXR0cnNGYWN0b3J5KCksXG5cdFx0XHRcdFx0XHRjYWNoZSxcblx0XHRcdFx0XHRcdGhlYWRlcixcblx0XHRcdFx0XHRcdGRlc2t0b3BTeXN0ZW1GYWNhZGU6IG1haWxMb2NhdG9yLmRlc2t0b3BTeXN0ZW1GYWNhZGUsXG5cdFx0XHRcdFx0XHRtYWlsVmlld01vZGVsLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtYWlsTG9jYXRvci5sb2dpbnMsXG5cdFx0XHQpLFxuXHRcdFx0c2V0dGluZ3M6IG1ha2VWaWV3UmVzb2x2ZXI8XG5cdFx0XHRcdFNldHRpbmdzVmlld0F0dHJzLFxuXHRcdFx0XHRTZXR0aW5nc1ZpZXcsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRkcmF3ZXJBdHRyc0ZhY3Rvcnk6ICgpID0+IERyYXdlck1lbnVBdHRyc1xuXHRcdFx0XHRcdGhlYWRlcjogQXBwSGVhZGVyQXR0cnNcblx0XHRcdFx0fVxuXHRcdFx0Pihcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHByZXBhcmVSb3V0ZTogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyBTZXR0aW5nc1ZpZXcgfSA9IGF3YWl0IGltcG9ydChcIi4vc2V0dGluZ3MvU2V0dGluZ3NWaWV3LmpzXCIpXG5cdFx0XHRcdFx0XHRjb25zdCBkcmF3ZXJBdHRyc0ZhY3RvcnkgPSBhd2FpdCBtYWlsTG9jYXRvci5kcmF3ZXJBdHRyc0ZhY3RvcnkoKVxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0Y29tcG9uZW50OiBTZXR0aW5nc1ZpZXcsXG5cdFx0XHRcdFx0XHRcdGNhY2hlOiB7XG5cdFx0XHRcdFx0XHRcdFx0ZHJhd2VyQXR0cnNGYWN0b3J5LFxuXHRcdFx0XHRcdFx0XHRcdGhlYWRlcjogYXdhaXQgbWFpbExvY2F0b3IuYXBwSGVhZGVyQXR0cnMoKSxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHByZXBhcmVBdHRyczogKGNhY2hlKSA9PiAoe1xuXHRcdFx0XHRcdFx0ZHJhd2VyQXR0cnM6IGNhY2hlLmRyYXdlckF0dHJzRmFjdG9yeSgpLFxuXHRcdFx0XHRcdFx0aGVhZGVyOiBjYWNoZS5oZWFkZXIsXG5cdFx0XHRcdFx0XHRsb2dpbnM6IG1haWxMb2NhdG9yLmxvZ2lucyxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0fSxcblx0XHRcdFx0bWFpbExvY2F0b3IubG9naW5zLFxuXHRcdFx0KSxcblx0XHRcdHNlYXJjaDogbWFrZVZpZXdSZXNvbHZlcjxcblx0XHRcdFx0U2VhcmNoVmlld0F0dHJzLFxuXHRcdFx0XHRTZWFyY2hWaWV3LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZHJhd2VyQXR0cnNGYWN0b3J5OiAoKSA9PiBEcmF3ZXJNZW51QXR0cnNcblx0XHRcdFx0XHRoZWFkZXI6IEFwcEhlYWRlckF0dHJzXG5cdFx0XHRcdFx0c2VhcmNoVmlld01vZGVsRmFjdG9yeTogKCkgPT4gU2VhcmNoVmlld01vZGVsXG5cdFx0XHRcdFx0Y29udGFjdE1vZGVsOiBDb250YWN0TW9kZWxcblx0XHRcdFx0fVxuXHRcdFx0Pihcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHByZXBhcmVSb3V0ZTogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyBTZWFyY2hWaWV3IH0gPSBhd2FpdCBpbXBvcnQoXCIuL3NlYXJjaC92aWV3L1NlYXJjaFZpZXcuanNcIilcblx0XHRcdFx0XHRcdGNvbnN0IGRyYXdlckF0dHJzRmFjdG9yeSA9IGF3YWl0IG1haWxMb2NhdG9yLmRyYXdlckF0dHJzRmFjdG9yeSgpXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRjb21wb25lbnQ6IFNlYXJjaFZpZXcsXG5cdFx0XHRcdFx0XHRcdGNhY2hlOiB7XG5cdFx0XHRcdFx0XHRcdFx0ZHJhd2VyQXR0cnNGYWN0b3J5LFxuXHRcdFx0XHRcdFx0XHRcdGhlYWRlcjogYXdhaXQgbWFpbExvY2F0b3IuYXBwSGVhZGVyQXR0cnMoKSxcblx0XHRcdFx0XHRcdFx0XHRzZWFyY2hWaWV3TW9kZWxGYWN0b3J5OiBhd2FpdCBtYWlsTG9jYXRvci5zZWFyY2hWaWV3TW9kZWxGYWN0b3J5KCksXG5cdFx0XHRcdFx0XHRcdFx0Y29udGFjdE1vZGVsOiBtYWlsTG9jYXRvci5jb250YWN0TW9kZWwsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRwcmVwYXJlQXR0cnM6IChjYWNoZSkgPT4gKHtcblx0XHRcdFx0XHRcdGRyYXdlckF0dHJzOiBjYWNoZS5kcmF3ZXJBdHRyc0ZhY3RvcnkoKSxcblx0XHRcdFx0XHRcdGhlYWRlcjogY2FjaGUuaGVhZGVyLFxuXHRcdFx0XHRcdFx0bWFrZVZpZXdNb2RlbDogY2FjaGUuc2VhcmNoVmlld01vZGVsRmFjdG9yeSxcblx0XHRcdFx0XHRcdGNvbnRhY3RNb2RlbDogY2FjaGUuY29udGFjdE1vZGVsLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtYWlsTG9jYXRvci5sb2dpbnMsXG5cdFx0XHQpLFxuXHRcdFx0Y2FsZW5kYXI6IG1ha2VWaWV3UmVzb2x2ZXI8XG5cdFx0XHRcdENhbGVuZGFyVmlld0F0dHJzLFxuXHRcdFx0XHRDYWxlbmRhclZpZXcsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRkcmF3ZXJBdHRyc0ZhY3Rvcnk6ICgpID0+IERyYXdlck1lbnVBdHRyc1xuXHRcdFx0XHRcdGhlYWRlcjogQXBwSGVhZGVyQXR0cnNcblx0XHRcdFx0XHRjYWxlbmRhclZpZXdNb2RlbDogQ2FsZW5kYXJWaWV3TW9kZWxcblx0XHRcdFx0XHRib3R0b21OYXY6ICgpID0+IENoaWxkcmVuXG5cdFx0XHRcdFx0bGF6eVNlYXJjaEJhcjogKCkgPT4gQ2hpbGRyZW5cblx0XHRcdFx0fVxuXHRcdFx0Pihcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHByZXBhcmVSb3V0ZTogYXN5bmMgKGNhY2hlKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCB7IENhbGVuZGFyVmlldyB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL3ZpZXcvQ2FsZW5kYXJWaWV3LmpzXCIpXG5cdFx0XHRcdFx0XHRjb25zdCB7IGxhenlTZWFyY2hCYXIgfSA9IGF3YWl0IGltcG9ydChcIi4vTGF6eVNlYXJjaEJhci5qc1wiKVxuXHRcdFx0XHRcdFx0Y29uc3QgZHJhd2VyQXR0cnNGYWN0b3J5ID0gYXdhaXQgbWFpbExvY2F0b3IuZHJhd2VyQXR0cnNGYWN0b3J5KClcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdGNvbXBvbmVudDogQ2FsZW5kYXJWaWV3LFxuXHRcdFx0XHRcdFx0XHRjYWNoZTogY2FjaGUgPz8ge1xuXHRcdFx0XHRcdFx0XHRcdGRyYXdlckF0dHJzRmFjdG9yeSxcblx0XHRcdFx0XHRcdFx0XHRoZWFkZXI6IGF3YWl0IG1haWxMb2NhdG9yLmFwcEhlYWRlckF0dHJzKCksXG5cdFx0XHRcdFx0XHRcdFx0Y2FsZW5kYXJWaWV3TW9kZWw6IGF3YWl0IG1haWxMb2NhdG9yLmNhbGVuZGFyVmlld01vZGVsKCksXG5cdFx0XHRcdFx0XHRcdFx0Ym90dG9tTmF2OiAoKSA9PiBtKEJvdHRvbU5hdiksXG5cdFx0XHRcdFx0XHRcdFx0bGF6eVNlYXJjaEJhcjogKCkgPT5cblx0XHRcdFx0XHRcdFx0XHRcdG0obGF6eVNlYXJjaEJhciwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRwbGFjZWhvbGRlcjogbGFuZy5nZXQoXCJzZWFyY2hDYWxlbmRhcl9wbGFjZWhvbGRlclwiKSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0cHJlcGFyZUF0dHJzOiAoeyBoZWFkZXIsIGNhbGVuZGFyVmlld01vZGVsLCBkcmF3ZXJBdHRyc0ZhY3RvcnksIGJvdHRvbU5hdiwgbGF6eVNlYXJjaEJhciB9KSA9PiAoe1xuXHRcdFx0XHRcdFx0ZHJhd2VyQXR0cnM6IGRyYXdlckF0dHJzRmFjdG9yeSgpLFxuXHRcdFx0XHRcdFx0aGVhZGVyLFxuXHRcdFx0XHRcdFx0Y2FsZW5kYXJWaWV3TW9kZWwsXG5cdFx0XHRcdFx0XHRib3R0b21OYXYsXG5cdFx0XHRcdFx0XHRsYXp5U2VhcmNoQmFyLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtYWlsTG9jYXRvci5sb2dpbnMsXG5cdFx0XHQpLFxuXG5cdFx0XHQvKipcblx0XHRcdCAqIFRoZSBmb2xsb3dpbmcgcmVzb2x2ZXJzIGFyZSBwcm9ncmFtbWVkIGJ5IGhhbmQgaW5zdGVhZCBvZiB1c2luZyBjcmVhdGVWaWV3UmVzb2x2ZXIoKSBpbiBvcmRlciB0byBiZSBhYmxlIHRvIHByb3Blcmx5IHJlZGlyZWN0XG5cdFx0XHQgKiB0byB0aGUgbG9naW4gcGFnZSB3aXRob3V0IGhhdmluZyB0byBkZWFsIHdpdGggYSB0b24gb2YgY29uZGl0aW9uYWwgbG9naWMgaW4gdGhlIExvZ2luVmlld01vZGVsIGFuZCB0byBhdm9pZCBzb21lIG9mIHRoZSBkZWZhdWx0XG5cdFx0XHQgKiBiZWhhdmlvdXIgb2YgcmVzb2x2ZXJzIGNyZWF0ZWQgd2l0aCBjcmVhdGVWaWV3UmVzb2x2ZXIoKSwgZS5nLiBjYWNoaW5nLlxuXHRcdFx0ICovXG5cdFx0XHRzaWdudXA6IHtcblx0XHRcdFx0YXN5bmMgb25tYXRjaCgpIHtcblx0XHRcdFx0XHRjb25zdCB7IHNob3dTaWdudXBEaWFsb2cgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9taXNjL0xvZ2luVXRpbHMuanNcIilcblxuXHRcdFx0XHRcdC8vIFdlIGhhdmUgdG8gbWFudWFsbHkgcGFyc2UgaXQgYmVjYXVzZSBtaXRocmlsIGRvZXMgbm90IHB1dCBoYXNoIGludG8gYXJncyBvZiBvbm1hdGNoXG5cdFx0XHRcdFx0Y29uc3QgdXJsUGFyYW1zID0gbS5wYXJzZVF1ZXJ5U3RyaW5nKGxvY2F0aW9uLnNlYXJjaC5zdWJzdHJpbmcoMSkgKyBcIiZcIiArIGxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpKVxuXHRcdFx0XHRcdHNob3dTaWdudXBEaWFsb2codXJsUGFyYW1zKVxuXG5cdFx0XHRcdFx0Ly8gQ2hhbmdlIHRoZSBocmVmIG9mIHRoZSBjYW5vbmljYWwgbGluayBlbGVtZW50IHRvIG1ha2UgdGhlIC9zaWdudXAgcGF0aCBpbmRleGVkLlxuXHRcdFx0XHRcdC8vIFNpbmNlIHRoaXMgaXMganVzdCBmb3Igc2VhcmNoIGNyYXdsZXJzLCB3ZSBkbyBub3QgaGF2ZSB0byBjaGFuZ2UgaXQgYWdhaW4gbGF0ZXIuXG5cdFx0XHRcdFx0Ly8gV2Uga25vdyBhdCBsZWFzdCBHb29nbGUgY3Jhd2xlciBleGVjdXRlcyBqcyB0byByZW5kZXIgdGhlIGFwcGxpY2F0aW9uLlxuXHRcdFx0XHRcdGNvbnN0IGNhbm9uaWNhbEVsOiBIVE1MTGlua0VsZW1lbnQgfCBudWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImxpbmtbcmVsPWNhbm9uaWNhbF1cIilcblx0XHRcdFx0XHRpZiAoY2Fub25pY2FsRWwpIHtcblx0XHRcdFx0XHRcdGNhbm9uaWNhbEVsLmhyZWYgPSBcImh0dHBzOi8vYXBwLnR1dGEuY29tL3NpZ251cFwiXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gd2hlbiB0aGUgdXNlciBwcmVzc2VzIHRoZSBicm93c2VyIGJhY2sgYnV0dG9uLCB3ZSB3b3VsZCBnZXQgYSAvbG9naW4gcm91dGUgd2l0aG91dCBhcmd1bWVudHNcblx0XHRcdFx0XHQvLyBpbiB0aGUgcG9wc3RhdGUgZXZlbnQsIGxvZ2dpbmcgdXMgb3V0IGFuZCByZWxvYWRpbmcgdGhlIHBhZ2UgYmVmb3JlIHdlIGhhdmUgYSBjaGFuY2UgdG8gKGFzeW5jaHJvbm91c2x5KSBhc2sgZm9yIGNvbmZpcm1hdGlvblxuXHRcdFx0XHRcdC8vIG9ubWF0Y2ggb2YgdGhlIGxvZ2luIHZpZXcgaXMgY2FsbGVkIGFmdGVyIHRoZSBwb3BzdGF0ZSBoYW5kbGVyLCBidXQgYmVmb3JlIGFueSBhc3luY2hyb25vdXMgb3BlcmF0aW9ucyB3ZW50IGFoZWFkLlxuXHRcdFx0XHRcdC8vIGR1cGxpY2F0aW5nIHRoZSBoaXN0b3J5IGVudHJ5IGFsbG93cyB1cyB0byBrZWVwIHRoZSBhcmd1bWVudHMgZm9yIGEgc2luZ2xlIGJhY2sgYnV0dG9uIHByZXNzIGFuZCBydW4gb3VyIG93biBjb2RlIHRvIGhhbmRsZSBpdFxuXHRcdFx0XHRcdG0ucm91dGUuc2V0KFwiL2xvZ2luXCIsIHtcblx0XHRcdFx0XHRcdG5vQXV0b0xvZ2luOiB0cnVlLFxuXHRcdFx0XHRcdFx0a2VlcFNlc3Npb246IHRydWUsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRtLnJvdXRlLnNldChcIi9sb2dpblwiLCB7XG5cdFx0XHRcdFx0XHRub0F1dG9Mb2dpbjogdHJ1ZSxcblx0XHRcdFx0XHRcdGtlZXBTZXNzaW9uOiB0cnVlLFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRnaWZ0Y2FyZDoge1xuXHRcdFx0XHRhc3luYyBvbm1hdGNoKCkge1xuXHRcdFx0XHRcdGNvbnN0IHsgc2hvd0dpZnRDYXJkRGlhbG9nIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbWlzYy9Mb2dpblV0aWxzLmpzXCIpXG5cdFx0XHRcdFx0c2hvd0dpZnRDYXJkRGlhbG9nKGxvY2F0aW9uLmhhc2gpXG5cdFx0XHRcdFx0bS5yb3V0ZS5zZXQoXCIvbG9naW5cIiwge1xuXHRcdFx0XHRcdFx0bm9BdXRvTG9naW46IHRydWUsXG5cdFx0XHRcdFx0XHRrZWVwU2Vzc2lvbjogdHJ1ZSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0cmVjb3Zlcjoge1xuXHRcdFx0XHRhc3luYyBvbm1hdGNoKGFyZ3M6IGFueSkge1xuXHRcdFx0XHRcdGNvbnN0IHsgc2hvd1JlY292ZXJEaWFsb2cgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9taXNjL0xvZ2luVXRpbHMuanNcIilcblx0XHRcdFx0XHRjb25zdCByZXNldEFjdGlvbiA9IGFyZ3MucmVzZXRBY3Rpb24gPT09IFwicGFzc3dvcmRcIiB8fCBhcmdzLnJlc2V0QWN0aW9uID09PSBcInNlY29uZEZhY3RvclwiID8gYXJncy5yZXNldEFjdGlvbiA6IFwicGFzc3dvcmRcIlxuXHRcdFx0XHRcdGNvbnN0IG1haWxBZGRyZXNzID0gdHlwZW9mIGFyZ3MubWFpbEFkZHJlc3MgPT09IFwic3RyaW5nXCIgPyBhcmdzLm1haWxBZGRyZXNzIDogXCJcIlxuXHRcdFx0XHRcdHNob3dSZWNvdmVyRGlhbG9nKG1haWxBZGRyZXNzLCByZXNldEFjdGlvbilcblx0XHRcdFx0XHRtLnJvdXRlLnNldChcIi9sb2dpblwiLCB7XG5cdFx0XHRcdFx0XHRub0F1dG9Mb2dpbjogdHJ1ZSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0d2ViYXV0aG46IG1ha2VPbGRWaWV3UmVzb2x2ZXIoXG5cdFx0XHRcdGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRjb25zdCB7IEJyb3dzZXJXZWJhdXRobiB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL21pc2MvMmZhL3dlYmF1dGhuL0Jyb3dzZXJXZWJhdXRobi5qc1wiKVxuXHRcdFx0XHRcdGNvbnN0IHsgTmF0aXZlV2ViYXV0aG5WaWV3IH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbG9naW4vTmF0aXZlV2ViYXV0aG5WaWV3LmpzXCIpXG5cdFx0XHRcdFx0Y29uc3QgeyBXZWJhdXRobk5hdGl2ZUJyaWRnZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL25hdGl2ZS9tYWluL1dlYmF1dGhuTmF0aXZlQnJpZGdlLmpzXCIpXG5cdFx0XHRcdFx0Ly8gZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpIHRha2VzIGVudi5zdGF0aWNVcmwgaW50byBhY2NvdW50IGJ1dCB3ZSBhY3R1YWxseSBkb24ndCBjYXJlIGFib3V0IGl0IGluIHRoaXMgY2FzZS5cblx0XHRcdFx0XHQvLyBTY2VuYXJpbyB3aGVuIGl0IGNhbiBkaWZmZXI6IGxvY2FsIGRlc2t0b3AgY2xpZW50IHdoaWNoIG9wZW5zIHdlYmF1dGhuIHdpbmRvdyBhbmQgdGhhdCB3aW5kb3cgaXMgYWxzbyBidWlsdCB3aXRoIHRoZSBzdGF0aWMgVVJMIGJlY2F1c2Vcblx0XHRcdFx0XHQvLyBpdCBpcyB0aGUgc2FtZSBjbGllbnQgYnVpbGQuXG5cdFx0XHRcdFx0Y29uc3QgZG9tYWluQ29uZmlnID0gbWFpbExvY2F0b3IuZG9tYWluQ29uZmlnUHJvdmlkZXIoKS5nZXREb21haW5Db25maWdGb3JIb3N0bmFtZShsb2NhdGlvbi5ob3N0bmFtZSwgbG9jYXRpb24ucHJvdG9jb2wsIGxvY2F0aW9uLnBvcnQpXG5cdFx0XHRcdFx0Y29uc3QgY3JlZHMgPSBuYXZpZ2F0b3IuY3JlZGVudGlhbHNcblx0XHRcdFx0XHRyZXR1cm4gbmV3IE5hdGl2ZVdlYmF1dGhuVmlldyhuZXcgQnJvd3NlcldlYmF1dGhuKGNyZWRzLCBkb21haW5Db25maWcpLCBuZXcgV2ViYXV0aG5OYXRpdmVCcmlkZ2UoKSlcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJlcXVpcmVMb2dpbjogZmFsc2UsXG5cdFx0XHRcdFx0Y2FjaGVWaWV3OiBmYWxzZSxcblx0XHRcdFx0fSxcblx0XHRcdFx0bWFpbExvY2F0b3IubG9naW5zLFxuXHRcdFx0KSxcblx0XHRcdHdlYmF1dGhubW9iaWxlOiBtYWtlVmlld1Jlc29sdmVyPFxuXHRcdFx0XHRNb2JpbGVXZWJhdXRobkF0dHJzLFxuXHRcdFx0XHRNb2JpbGVXZWJhdXRoblZpZXcsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRicm93c2VyV2ViYXV0aG46IEJyb3dzZXJXZWJhdXRoblxuXHRcdFx0XHR9XG5cdFx0XHQ+KFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cHJlcGFyZVJvdXRlOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCB7IE1vYmlsZVdlYmF1dGhuVmlldyB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2xvZ2luL01vYmlsZVdlYmF1dGhuVmlldy5qc1wiKVxuXHRcdFx0XHRcdFx0Y29uc3QgeyBCcm93c2VyV2ViYXV0aG4gfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9taXNjLzJmYS93ZWJhdXRobi9Ccm93c2VyV2ViYXV0aG4uanNcIilcblx0XHRcdFx0XHRcdC8vIHNlZSAvd2ViYXV0aG4gdmlldyByZXNvbHZlciBmb3IgdGhlIGV4cGxhbmF0aW9uXG5cdFx0XHRcdFx0XHRjb25zdCBkb21haW5Db25maWcgPSBtYWlsTG9jYXRvci5kb21haW5Db25maWdQcm92aWRlcigpLmdldERvbWFpbkNvbmZpZ0Zvckhvc3RuYW1lKGxvY2F0aW9uLmhvc3RuYW1lLCBsb2NhdGlvbi5wcm90b2NvbCwgbG9jYXRpb24ucG9ydClcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdGNvbXBvbmVudDogTW9iaWxlV2ViYXV0aG5WaWV3LFxuXHRcdFx0XHRcdFx0XHRjYWNoZToge1xuXHRcdFx0XHRcdFx0XHRcdGJyb3dzZXJXZWJhdXRobjogbmV3IEJyb3dzZXJXZWJhdXRobihuYXZpZ2F0b3IuY3JlZGVudGlhbHMsIGRvbWFpbkNvbmZpZyksXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRwcmVwYXJlQXR0cnM6IChjYWNoZSkgPT4gY2FjaGUsXG5cdFx0XHRcdFx0cmVxdWlyZUxvZ2luOiBmYWxzZSxcblx0XHRcdFx0fSxcblx0XHRcdFx0bWFpbExvY2F0b3IubG9naW5zLFxuXHRcdFx0KSxcblx0XHR9KVxuXG5cdFx0Ly8gSW4gc29tZSBjYXNlcyBvdXIgcHJlZml4IGNhbiBoYXZlIG5vbi1hc2NpaSBjaGFyYWN0ZXJzLCBkZXBlbmRpbmcgb24gdGhlIHBhdGggdGhlIHdlYmFwcCBpcyBzZXJ2ZWQgZnJvbVxuXHRcdC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vTWl0aHJpbEpTL21pdGhyaWwuanMvaXNzdWVzLzI2NTlcblx0XHRtLnJvdXRlLnByZWZpeCA9IG5ldmVyTnVsbCh1cmxQcmVmaXhlcy5wcmVmaXgpLnJlcGxhY2UoLyg/OiVbYS1mODldW2EtZjAtOV0pKy9naW0sIGRlY29kZVVSSUNvbXBvbmVudClcblxuXHRcdC8vIGtlZXAgaW4gc3luYyB3aXRoIFJld3JpdGVBcHBSZXNvdXJjZVVybEhhbmRsZXIuamF2YVxuXHRcdGNvbnN0IHJlc29sdmVyczogUm91dGVEZWZzID0ge1xuXHRcdFx0XCIvXCI6IHtcblx0XHRcdFx0b25tYXRjaDogKGFyZ3MsIHJlcXVlc3RlZFBhdGgpID0+IGZvcmNlTG9naW4oYXJncywgcmVxdWVzdGVkUGF0aCksXG5cdFx0XHR9LFxuXHRcdH1cblxuXHRcdGZvciAobGV0IHBhdGggaW4gcGF0aHMpIHtcblx0XHRcdHJlc29sdmVyc1twYXRoXSA9IHBhdGhzW3BhdGhdXG5cdFx0fVxuXG5cdFx0Ly8gYXBwZW5kIGNhdGNoIGFsbCBhdCB0aGUgZW5kIGJlY2F1c2UgbWl0aHJpbCB3aWxsIHN0b3AgYXQgdGhlIGZpcnN0IG1hdGNoXG5cdFx0cmVzb2x2ZXJzW1wiLzpwYXRoLi4uXCJdID0ge1xuXHRcdFx0b25tYXRjaDogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRjb25zdCB7IE5vdEZvdW5kUGFnZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2d1aS9iYXNlL05vdEZvdW5kUGFnZS5qc1wiKVxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHZpZXc6ICgpID0+IG0ocm9vdCwgbShOb3RGb3VuZFBhZ2UpKSxcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHR9XG5cblx0XHQvLyBrZWVwIGluIHN5bmMgd2l0aCBSZXdyaXRlQXBwUmVzb3VyY2VVcmxIYW5kbGVyLmphdmFcblx0XHRtLnJvdXRlKGRvY3VtZW50LmJvZHksIHN0YXJ0Um91dGUsIHJlc29sdmVycylcblxuXHRcdC8vIFdlIG5lZWQgdG8gaW5pdGlhbGl6ZSBuYXRpdmUgb25jZSB3ZSBzdGFydCB0aGUgbWl0aHJpbCByb3V0aW5nLCBzcGVjaWZpY2FsbHkgZm9yIHRoZSBjYXNlIG9mIG1haWx0byBoYW5kbGluZyBpbiBhbmRyb2lkXG5cdFx0Ly8gSWYgbmF0aXZlIHN0YXJ0cyB0ZWxsaW5nIHRoZSB3ZWIgc2lkZSB0byBuYXZpZ2F0ZSB0b28gZWFybHksIG1pdGhyaWwgd29uJ3QgYmUgcmVhZHkgYW5kIHRoZSByZXF1ZXN0cyB3aWxsIGJlIGxvc3Rcblx0XHRpZiAoaXNBcHAoKSB8fCBpc0Rlc2t0b3AoKSkge1xuXHRcdFx0YXdhaXQgbWFpbExvY2F0b3IubmF0aXZlLmluaXQoKVxuXHRcdH1cblx0XHRpZiAoaXNEZXNrdG9wKCkpIHtcblx0XHRcdGNvbnN0IHsgZXhwb3NlTmF0aXZlSW50ZXJmYWNlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vYXBpL2NvbW1vbi9FeHBvc2VOYXRpdmVJbnRlcmZhY2UuanNcIilcblx0XHRcdG1haWxMb2NhdG9yLmxvZ2lucy5hZGRQb3N0TG9naW5BY3Rpb24oYXN5bmMgKCkgPT4gZXhwb3NlTmF0aXZlSW50ZXJmYWNlKG1haWxMb2NhdG9yLm5hdGl2ZSkucG9zdExvZ2luQWN0aW9ucylcblx0XHR9XG5cdFx0Ly8gYWZ0ZXIgd2Ugc2V0IHVwIHByZWZpeFdpdGhvdXRGaWxlXG5cdFx0Y29uc3QgZG9tYWluQ29uZmlnID0gbWFpbExvY2F0b3IuZG9tYWluQ29uZmlnUHJvdmlkZXIoKS5nZXRDdXJyZW50RG9tYWluQ29uZmlnKClcblx0XHRjb25zdCBzZXJ2aWNld29ya2VyID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL3NlcnZpY2V3b3JrZXIvU2VydmljZVdvcmtlckNsaWVudC5qc1wiKVxuXHRcdHNlcnZpY2V3b3JrZXIuaW5pdChkb21haW5Db25maWcpXG5cblx0XHRwcmludEpvYnNNZXNzYWdlKGRvbWFpbkNvbmZpZylcblx0fSlcblxuZnVuY3Rpb24gZm9yY2VMb2dpbihhcmdzOiBSZWNvcmQ8c3RyaW5nLCBEaWN0PiwgcmVxdWVzdGVkUGF0aDogc3RyaW5nKSB7XG5cdGlmIChyZXF1ZXN0ZWRQYXRoLmluZGV4T2YoXCIjbWFpbFwiKSAhPT0gLTEpIHtcblx0XHRtLnJvdXRlLnNldChgL2V4dCR7bG9jYXRpb24uaGFzaH1gKVxuXHR9IGVsc2UgaWYgKHJlcXVlc3RlZFBhdGguc3RhcnRzV2l0aChcIi8jXCIpKSB7XG5cdFx0Ly8gd2UgZG8gbm90IGFsbG93IGFueSBvdGhlciBoYXNoZXMgZXhjZXB0IFwiI21haWxcIi4gdGhpcyBwcmV2ZW50cyBsb2dpbiBsb29wcy5cblx0XHRtLnJvdXRlLnNldChcIi9sb2dpblwiKVxuXHR9IGVsc2Uge1xuXHRcdGxldCBwYXRoV2l0aG91dFBhcmFtZXRlciA9IHJlcXVlc3RlZFBhdGguaW5kZXhPZihcIj9cIikgPiAwID8gcmVxdWVzdGVkUGF0aC5zdWJzdHJpbmcoMCwgcmVxdWVzdGVkUGF0aC5pbmRleE9mKFwiP1wiKSkgOiByZXF1ZXN0ZWRQYXRoXG5cblx0XHRpZiAocGF0aFdpdGhvdXRQYXJhbWV0ZXIudHJpbSgpID09PSBcIi9cIikge1xuXHRcdFx0bGV0IG5ld1F1ZXJ5U3RyaW5nID0gbS5idWlsZFF1ZXJ5U3RyaW5nKGFyZ3MpXG5cdFx0XHRtLnJvdXRlLnNldChgL2xvZ2luYCArIChuZXdRdWVyeVN0cmluZy5sZW5ndGggPiAwID8gXCI/XCIgKyBuZXdRdWVyeVN0cmluZyA6IFwiXCIpKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRtLnJvdXRlLnNldChgL2xvZ2luP3JlcXVlc3RlZFBhdGg9JHtlbmNvZGVVUklDb21wb25lbnQocmVxdWVzdGVkUGF0aCl9YClcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0dXBFeGNlcHRpb25IYW5kbGluZygpIHtcblx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCBmdW5jdGlvbiAoZXZ0KSB7XG5cdFx0LyoqXG5cdFx0ICogZXZ0LmVycm9yIGlzIG5vdCBhbHdheXMgc2V0LCBlLmcuIG5vdCBmb3IgXCJjb250ZW50LmpzOjE5NjMgVW5jYXVnaHQgRE9NRXhjZXB0aW9uOiBGYWlsZWQgdG8gcmVhZFxuXHRcdCAqIHRoZSAnc2VsZWN0aW9uU3RhcnQnIHByb3BlcnR5IGZyb20gJ0hUTUxJbnB1dEVsZW1lbnQnOiBUaGUgaW5wdXQgZWxlbWVudCdzIHR5cGUgKCdlbWFpbCcpXG5cdFx0ICogZG9lcyBub3Qgc3VwcG9ydCBzZWxlY3Rpb24uXCJcblx0XHQgKlxuXHRcdCAqIGNoZWNraW5nIGZvciBkZWZhdWx0UHJldmVudGVkIGlzIG5lY2Vzc2FyeSB0byBwcmV2ZW50IGRldlRvb2xzIGV2YWwgZXJyb3JzIHRvIGJlIHRocm93biBpbiBoZXJlIHVudGlsXG5cdFx0ICogaHR0cHM6Ly9jaHJvbWl1bS1yZXZpZXcuZ29vZ2xlc291cmNlLmNvbS9jL3Y4L3Y4LysvMzY2MDI1M1xuXHRcdCAqIGlzIGluIHRoZSBjaHJvbWl1bSB2ZXJzaW9uIHVzZWQgYnkgb3VyIGVsZWN0cm9uIGNsaWVudC5cblx0XHQgKiBzZWUgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNzIzOTY1MjcvZXZhbGVycm9yLXBvc3NpYmxlLXNpZGUtZWZmZWN0LWluLWRlYnVnLWV2YWx1YXRlLWluLWdvb2dsZS1jaHJvbWVcblx0XHQgKiAqL1xuXHRcdGlmIChldnQuZXJyb3IgJiYgIWV2dC5kZWZhdWx0UHJldmVudGVkKSB7XG5cdFx0XHRoYW5kbGVVbmNhdWdodEVycm9yKGV2dC5lcnJvcilcblx0XHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0fVxuXHR9KVxuXHQvLyBIYW5kbGUgdW5oYW5kbGVkIG5hdGl2ZSBKUyBQcm9taXNlIHJlamVjdGlvbnNcblx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmhhbmRsZWRyZWplY3Rpb25cIiwgZnVuY3Rpb24gKGV2dCkge1xuXHRcdGhhbmRsZVVuY2F1Z2h0RXJyb3IoZXZ0LnJlYXNvbilcblx0XHRldnQucHJldmVudERlZmF1bHQoKVxuXHR9KVxufVxuXG4vKipcbiAqIFdyYXAgdG9wLWxldmVsIGNvbXBvbmVudCB3aXRoIG5lY2Vzc2FyeSBsb2dpYy5cbiAqIE5vdGU6IEkgY2FuJ3QgbWFrZSB0eXBlIGluZmVyZW5jZSB3b3JrIHdpdGggYXR0cmlidXRlcyBhbmQgY29tcG9uZW50cyBiZWNhdXNlIG9mIGhvdyBicm9rZW4gbWl0aHJpbCB0eXBlZGVmcyBhcmUgc28gdGhleSBhcmUgXCJuZXZlclwiIGJ5IGRlZmF1bHQgYW5kIHlvdVxuICogaGF2ZSB0byBzcGVjaWZ5IGdlbmVyaWMgdHlwZXMgbWFudWFsbHkuXG4gKiBAdGVtcGxhdGUgRnVsbEF0dHJzIHR5cGUgb2YgdGhlIGF0dHJpYnV0ZXMgdGhhdCB0aGUgY29tcG9uZW50IHRha2VzXG4gKiBAdGVtcGxhdGUgQ29tcG9uZW50VHlwZSB0eXBlIG9mIHRoZSBjb21wb25lbnRcbiAqIEB0ZW1wbGF0ZSBSb3V0ZUNhY2hlIGluZm8gdGhhdCBpcyBwcmVwYXJlZCBhc3luYyBvbiByb3V0ZSBjaGFuZ2UgYW5kIGNhbiBiZSB1c2VkIGxhdGVyIHRvIGNyZWF0ZSBhdHRyaWJ1dGVzIG9uIGV2ZXJ5IHJlbmRlci4gSXMgYWxzbyBwZXJzaXN0ZWQgYmV0d2VlblxuICogdGhlIHJvdXRlIGNoYW5nZXMuXG4gKiBAcGFyYW0gcGFyYW1cbiAqIEBwYXJhbSBwYXJhbS5wcmVwYXJlUm91dGUgY2FsbGVkIG9uY2UgcGVyIHJvdXRlIGNoYW5nZS4gVXNlIGl0IGZvciBldmVyeXRoaW5nIGFzeW5jIHRoYXQgc2hvdWxkIGhhcHBlbiBiZWZvcmUgdGhlIHJvdXRlIGNoYW5nZS4gVGhlIHJlc3VsdCBpcyBwcmVzZXJ2ZWQgZm9yXG4gKiBhcyBsb25nIGFzIFJvdXRlUmVzb2x2ZXIgbGl2ZXMgaWYgeW91IG5lZWQgdG8gcGVyc2lzdCB0aGluZ3MgYmV0d2VlbiByb3V0ZXMuIEl0IHJlY2VpdmVzIHRoZSByb3V0ZSBjYWNoZSBmcm9tIHRoZSBwcmV2aW91cyBjYWxsIGlmIHRoZXJlIHdhcyBvbmUuXG4gKiBAcGFyYW0gcGFyYW0ucHJlcGFyZUF0dHJzIGNhbGxlZCBvbmNlIHBlciByZWRyYXcuIFRoZSByZXN1bHQgb2YgaXQgd2lsbCBiZSBhZGRlZCB0byBUb3BMZXZlbEF0dHJzIHRvIG1ha2UgZnVsbCBhdHRyaWJ1dGVzLlxuICogQHBhcmFtIHBhcmFtLnJlcXVpcmVMb2dpbiBlbmZvcmNlIGxvZ2luIHBvbGljeSB0byBlaXRoZXIgcmVkaXJlY3QgdG8gdGhlIGxvZ2luIHBhZ2Ugb3IgcmVsb2FkXG4gKiBAcGFyYW0gbG9naW5zIGxvZ2luY29udHJvbGxlciB0byBhc2sgYWJvdXQgbG9naW4gc3RhdGVcbiAqL1xuZnVuY3Rpb24gbWFrZVZpZXdSZXNvbHZlcjxGdWxsQXR0cnMgZXh0ZW5kcyBUb3BMZXZlbEF0dHJzID0gbmV2ZXIsIENvbXBvbmVudFR5cGUgZXh0ZW5kcyBUb3BMZXZlbFZpZXc8RnVsbEF0dHJzPiA9IG5ldmVyLCBSb3V0ZUNhY2hlID0gdW5kZWZpbmVkPihcblx0e1xuXHRcdHByZXBhcmVSb3V0ZSxcblx0XHRwcmVwYXJlQXR0cnMsXG5cdFx0cmVxdWlyZUxvZ2luLFxuXHR9OiB7XG5cdFx0cHJlcGFyZVJvdXRlOiAoY2FjaGU6IFJvdXRlQ2FjaGUgfCBudWxsKSA9PiBQcm9taXNlPHsgY29tcG9uZW50OiBDbGFzczxDb21wb25lbnRUeXBlPjsgY2FjaGU6IFJvdXRlQ2FjaGUgfT5cblx0XHRwcmVwYXJlQXR0cnM6IChjYWNoZTogUm91dGVDYWNoZSkgPT4gT21pdDxGdWxsQXR0cnMsIGtleW9mIFRvcExldmVsQXR0cnM+XG5cdFx0cmVxdWlyZUxvZ2luPzogYm9vbGVhblxuXHR9LFxuXHRsb2dpbnM6IExvZ2luQ29udHJvbGxlcixcbik6IFJvdXRlUmVzb2x2ZXIge1xuXHRyZXF1aXJlTG9naW4gPSByZXF1aXJlTG9naW4gPz8gdHJ1ZVxuXHRsZXQgY2FjaGU6IFJvdXRlQ2FjaGUgfCBudWxsXG5cblx0Ly8gYSBiaXQgb2YgY29udGV4dCBmb3Igd2h5IHdlIGRvIHRoaW5ncyB0aGUgd2F5IHdlIGRvLiBDb25zdHJhaW50czpcblx0Ly8gIC0gdmlldyBtdXN0IGJlIGltcG9ydGVkIGFzeW5jIGluIG9ubWF0Y2hcblx0Ly8gIC0gdmlldyBzaGFsbCBub3QgYmUgY3JlYXRlZCBtYW51YWxseSwgd2UgZG8gbm90IHdhbnQgdG8gaG9sZCBvbiB0byB0aGUgaW5zdGFuY2Vcblx0Ly8gIC0gd2Ugd2FudCB0byBwYXNzIGFkZGl0aW9uYWwgcGFyYW1ldGVycyB0byB0aGUgdmlld1xuXHQvLyAgLSB2aWV3IHNob3VsZCBub3QgYmUgY3JlYXRlZCB0d2ljZSBhbmQgbmVpdGhlciBpdHMgZGVwZW5kZW5jaWVzXG5cdC8vICAtIHdlIGVpdGhlciBuZWVkIHRvIGNhbGwgdXBkYXRlVXJsIG9yIHBhc3MgcmVxdWVzdGVkUGF0aCBhbmQgYXJncyBhcyBhdHRyaWJ1dGVzXG5cdHJldHVybiB7XG5cdFx0Ly8gb25tYXRjaCgpIGlzIGNhbGxlZCBmb3IgZXZlcnkgVVJMIGNoYW5nZVxuXHRcdGFzeW5jIG9ubWF0Y2goYXJnczogUmVjb3JkPHN0cmluZywgRGljdD4sIHJlcXVlc3RlZFBhdGg6IHN0cmluZyk6IFByb21pc2U8Q2xhc3M8Q29tcG9uZW50VHlwZT4gfCBudWxsPiB7XG5cdFx0XHQvLyBlbmZvcmNlIHZhbGlkIGxvZ2luIHN0YXRlIGZpcnN0LlxuXHRcdFx0Ly8gd2UgaGF2ZSB2aWV3cyB3aXRoIHJlcXVpcmVMb2dpbjogdHJ1ZSBhbmQgdmlld3Mgd2l0aCByZXF1aXJlTG9naW46IGZhbHNlLCBlYWNoIG9mIHdoaWNoIGVuZm9yY2UgYmVpbmcgbG9nZ2VkIGluIG9yIGJlaW5nIGxvZ2dlZCBvdXQgcmVzcGVjdGl2ZWx5LlxuXHRcdFx0Ly8gaW4gdGhlIGxvZ291dCBjYXNlICh3aGVyZSByZXF1aXJlTG9naW46IGZhbHNlKSB0aGlzIHdpbGwgZm9yY2UgYSByZWxvYWQuXG5cdFx0XHQvLyB0aGUgbG9naW4gdmlldyBpcyBzcGVjaWFsIGluIHRoYXQgaXQgaGFzIHJlcXVpcmVsb2dpbjogZmFsc2UsIGJ1dCBjYW4gYmUgbG9nZ2VkIGluIGFmdGVyIGFjY291bnQgY3JlYXRpb24gZHVyaW5nIHNpZ251cC5cblx0XHRcdC8vIHRvIGhhbmRsZSBiYWNrIGJ1dHRvbiBwcmVzc2VzIHdoZXJlIHRoZSB1c2VyIGRlY2lkZXMgdG8gc3RheSBvbiB0aGUgcGFnZSBhZnRlciBhbGwgKHdlIHNob3cgYSBjb25maXJtYXRpb24pXG5cdFx0XHQvLyB3ZSBuZWVkIHRvIHByZXZlbnQgdGhlIGxvZ291dC9yZWxvYWQuIHRoaXMgaXMgdGhlIHB1cnBvc2Ugb2YgdGhlIGtlZXBTZXNzaW9uIGFyZ3VtZW50LlxuXHRcdFx0Ly8gdGhlIHNpZ251cCB3aXphcmQgdGhhdCBzZXRzIGl0IGhhbmRsZXMgdGhlIHNlc3Npb24gaXRzZWxmLlxuXHRcdFx0aWYgKHJlcXVpcmVMb2dpbiAmJiAhbG9naW5zLmlzVXNlckxvZ2dlZEluKCkpIHtcblx0XHRcdFx0Zm9yY2VMb2dpbihhcmdzLCByZXF1ZXN0ZWRQYXRoKVxuXHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0fSBlbHNlIGlmICghcmVxdWlyZUxvZ2luICYmIGxvZ2lucy5pc1VzZXJMb2dnZWRJbigpICYmICFhcmdzLmtlZXBTZXNzaW9uKSB7XG5cdFx0XHRcdGF3YWl0IGRpc2FibGVFcnJvckhhbmRsaW5nRHVyaW5nTG9nb3V0KClcblx0XHRcdFx0YXdhaXQgbG9naW5zLmxvZ291dChmYWxzZSlcblx0XHRcdFx0d2luZG93RmFjYWRlLnJlbG9hZChhcmdzKVxuXHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgcHJlcGFyZWQgPSBhd2FpdCBwcmVwYXJlUm91dGUoY2FjaGUpXG5cdFx0XHRcdGNhY2hlID0gcHJlcGFyZWQuY2FjaGVcblx0XHRcdFx0cmV0dXJuIHByZXBhcmVkLmNvbXBvbmVudFxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gcmVuZGVyKCkgaXMgY2FsbGVkIG9uIGV2ZXJ5IHJlbmRlclxuXHRcdHJlbmRlcih2bm9kZTogVm5vZGU8Q29tcG9uZW50VHlwZT4pOiBDaGlsZHJlbiB7XG5cdFx0XHRjb25zdCBhcmdzID0gbS5yb3V0ZS5wYXJhbSgpXG5cdFx0XHRjb25zdCByZXF1ZXN0ZWRQYXRoID0gbS5yb3V0ZS5nZXQoKVxuXHRcdFx0Ly8gcmVzdWx0IG9mIG9ubWF0Y2goKSBpcyBwYXNzZWQgaW50byBtKCkgYnkgbXRocmlsIGFuZCB0aGVuIGdpdmVuIHRvIHVzIGhlcmVcblx0XHRcdC8vIEl0IGlzIG5vdCB3aGF0IHdlIHdhbnQgYXMgd2Ugd2FudCB0byBwYXNzIGZldyB0aGluZ3MgdG8gaXQgYnV0IGl0J3MgaGFybWxlc3MgYmVjYXVzZVxuXHRcdFx0Ly8gaXQganVzdCBjcmVhdGVzIGEgdm5vZGUgYnV0IGRvZXNuJ3QgcmVuZGVyIGl0LlxuXHRcdFx0Ly8gV2hhdCB3ZSBkbyBpcyBncmFiIHRoZSBjbGFzcyBmcm9tIHRoYXQgdm5vZGUuIFdlIGNvdWxkIGhhdmUgZG9uZSBpdCBkaWZmZXJlbnRseSBidXQgdGhpc1xuXHRcdFx0Ly8gd2F5IHdlIGRvbid0IGRvIGFueSBtb3JlIGNhY2hpbmcgdGhhbiBNaXRocmlsIHdvdWxkIGRvIGFueXdheS5cblxuXHRcdFx0Ly8gVFMgY2FuJ3QgcHJvdmUgdGhhdCBpdCdzIHRoZSByaWdodCBjb21wb25lbnQgYW5kIHRoZSBtaXRocmlsIHR5cGluZ3MgYXJlIGdlbmVyYWxseSBzbGlnaHRseSBicm9rZW5cblx0XHRcdGNvbnN0IGMgPSB2bm9kZS50YWcgYXMgdW5rbm93biBhcyBDbGFzczxDbGFzc0NvbXBvbmVudDxGdWxsQXR0cnM+PlxuXG5cdFx0XHQvLyBkb3duY2FzdCBiZWNhdXNlIHdlIHRzIGNhbid0IHJlYWxseSBwcm92ZSBvciBlbmZvcmNlIHRoYXQgYWRkaXRpb25hbCBhdHRycyBoYXZlIGNvbXBhdGlibGUgcmVxdWVzdGVkUGF0aCBhbmQgYXJnc1xuXHRcdFx0Y29uc3QgYXR0cnMgPSB7IHJlcXVlc3RlZFBhdGgsIGFyZ3MsIC4uLnByZXBhcmVBdHRycyhhc3NlcnROb3ROdWxsKGNhY2hlKSkgfSBhcyBGdWxsQXR0cnNcblx0XHRcdHJldHVybiBtKFxuXHRcdFx0XHRyb290LFxuXHRcdFx0XHRtKGMsIHtcblx0XHRcdFx0XHQuLi5hdHRycyxcblx0XHRcdFx0XHRvbmNyZWF0ZSh7IHN0YXRlIH06IFZub2RlRE9NPEZ1bGxBdHRycywgQ29tcG9uZW50VHlwZT4pIHtcblx0XHRcdFx0XHRcdHdpbmRvdy50dXRhby5jdXJyZW50VmlldyA9IHN0YXRlXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0fSxcblx0fVxufVxuXG5mdW5jdGlvbiBtYWtlT2xkVmlld1Jlc29sdmVyKFxuXHRtYWtlVmlldzogKGFyZ3M6IG9iamVjdCwgcmVxdWVzdGVkUGF0aDogc3RyaW5nKSA9PiBQcm9taXNlPFRvcExldmVsVmlldz4sXG5cdHsgcmVxdWlyZUxvZ2luLCBjYWNoZVZpZXcgfTogeyByZXF1aXJlTG9naW4/OiBib29sZWFuOyBjYWNoZVZpZXc/OiBib29sZWFuIH0gPSB7fSxcblx0bG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsXG4pOiBSb3V0ZVJlc29sdmVyIHtcblx0cmVxdWlyZUxvZ2luID0gcmVxdWlyZUxvZ2luID8/IHRydWVcblx0Y2FjaGVWaWV3ID0gY2FjaGVWaWV3ID8/IHRydWVcblxuXHRjb25zdCB2aWV3Q2FjaGU6IHsgdmlldzogVG9wTGV2ZWxWaWV3IHwgbnVsbCB9ID0geyB2aWV3OiBudWxsIH1cblx0cmV0dXJuIHtcblx0XHRvbm1hdGNoOiBhc3luYyAoYXJncywgcmVxdWVzdGVkUGF0aCkgPT4ge1xuXHRcdFx0aWYgKHJlcXVpcmVMb2dpbiAmJiAhbG9naW5zLmlzVXNlckxvZ2dlZEluKCkpIHtcblx0XHRcdFx0Zm9yY2VMb2dpbihhcmdzLCByZXF1ZXN0ZWRQYXRoKVxuXHRcdFx0fSBlbHNlIGlmICghcmVxdWlyZUxvZ2luICYmIGxvZ2lucy5pc1VzZXJMb2dnZWRJbigpKSB7XG5cdFx0XHRcdGF3YWl0IGRpc2FibGVFcnJvckhhbmRsaW5nRHVyaW5nTG9nb3V0KClcblx0XHRcdFx0YXdhaXQgbG9naW5zLmxvZ291dChmYWxzZSlcblx0XHRcdFx0d2luZG93RmFjYWRlLnJlbG9hZChhcmdzKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bGV0IHByb21pc2U6IFByb21pc2U8VG9wTGV2ZWxWaWV3PlxuXG5cdFx0XHRcdGlmICh2aWV3Q2FjaGUudmlldyA9PSBudWxsKSB7XG5cdFx0XHRcdFx0cHJvbWlzZSA9IG1ha2VWaWV3KGFyZ3MsIHJlcXVlc3RlZFBhdGgpLnRoZW4oKHZpZXcpID0+IHtcblx0XHRcdFx0XHRcdGlmIChjYWNoZVZpZXcpIHtcblx0XHRcdFx0XHRcdFx0dmlld0NhY2hlLnZpZXcgPSB2aWV3XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiB2aWV3XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKHZpZXdDYWNoZS52aWV3KVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0UHJvbWlzZS5hbGwoW3Byb21pc2VdKS50aGVuKChbdmlld10pID0+IHtcblx0XHRcdFx0XHR2aWV3LnVwZGF0ZVVybD8uKGFyZ3MsIHJlcXVlc3RlZFBhdGgpXG5cdFx0XHRcdFx0d2luZG93LnR1dGFvLmN1cnJlbnRWaWV3ID0gdmlld1xuXHRcdFx0XHR9KVxuXHRcdFx0XHRyZXR1cm4gcHJvbWlzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVuZGVyOiAodm5vZGUpID0+IHtcblx0XHRcdHJldHVybiBtKHJvb3QsIHZub2RlKVxuXHRcdH0sXG5cdH1cbn1cblxuLy8gUGxhdGZvcm1JZCBpcyBwYXNzZWQgYnkgdGhlIG5hdGl2ZSBwYXJ0IGluIHRoZSBVUkxcbmZ1bmN0aW9uIGFzc2lnbkVudlBsYXRmb3JtSWQodXJsUXVlcnlQYXJhbXM6IE1pdGhyaWwuUGFyYW1zKSB7XG5cdGNvbnN0IHBsYXRmb3JtSWQgPSB1cmxRdWVyeVBhcmFtc1tcInBsYXRmb3JtSWRcIl1cblxuXHRpZiAoaXNBcHAoKSB8fCBpc0Rlc2t0b3AoKSkge1xuXHRcdGlmIChcblx0XHRcdChpc0FwcCgpICYmIChwbGF0Zm9ybUlkID09PSBcImFuZHJvaWRcIiB8fCBwbGF0Zm9ybUlkID09PSBcImlvc1wiKSkgfHxcblx0XHRcdChpc0Rlc2t0b3AoKSAmJiAocGxhdGZvcm1JZCA9PT0gXCJsaW51eFwiIHx8IHBsYXRmb3JtSWQgPT09IFwid2luMzJcIiB8fCBwbGF0Zm9ybUlkID09PSBcImRhcndpblwiKSlcblx0XHQpIHtcblx0XHRcdGVudi5wbGF0Zm9ybUlkID0gcGxhdGZvcm1JZFxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihgSW52YWxpZCBwbGF0Zm9ybSBpZDogJHtTdHJpbmcocGxhdGZvcm1JZCl9YClcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gZXh0cmFjdFBhdGhQcmVmaXhlcygpOiBSZWFkb25seTx7IHByZWZpeDogc3RyaW5nOyBwcmVmaXhXaXRob3V0RmlsZTogc3RyaW5nIH0+IHtcblx0Y29uc3QgcHJlZml4ID0gbG9jYXRpb24ucGF0aG5hbWUuZW5kc1dpdGgoXCIvXCIpID8gbG9jYXRpb24ucGF0aG5hbWUuc3Vic3RyaW5nKDAsIGxvY2F0aW9uLnBhdGhuYW1lLmxlbmd0aCAtIDEpIDogbG9jYXRpb24ucGF0aG5hbWVcblx0Y29uc3QgcHJlZml4V2l0aG91dEZpbGUgPSBwcmVmaXguaW5jbHVkZXMoXCIuXCIpID8gcHJlZml4LnN1YnN0cmluZygwLCBwcmVmaXgubGFzdEluZGV4T2YoXCIvXCIpKSA6IHByZWZpeFxuXHRyZXR1cm4gT2JqZWN0LmZyZWV6ZSh7IHByZWZpeCwgcHJlZml4V2l0aG91dEZpbGUgfSlcbn1cblxuZnVuY3Rpb24gZ2V0U3RhcnRVcmwodXJsUXVlcnlQYXJhbXM6IE1pdGhyaWwuUGFyYW1zKTogc3RyaW5nIHtcblx0Ly8gUmVkaXJlY3Rpb24gdHJpZ2dlcmVkIGJ5IHRoZSBzZXJ2ZXIgb3Igc2VydmljZSB3b3JrZXIgKGUuZy4gdGhlIHVzZXIgcmVsb2FkcyAvbWFpbC9pZCBieSBwcmVzc2luZ1xuXHQvLyBGNSBhbmQgd2Ugd2FudCB0byBvcGVuIC9sb2dpbj9yPW1haWwvaWQpLlxuXG5cdC8vIFdlIHdhbnQgdG8gYnVpbGQgYSBuZXcgVVJMIGJhc2VkIG9uIHRoZSByZWRpcmVjdCBwYXJhbWV0ZXIgYW5kIG91ciBjdXJyZW50IHBhdGggYW5kIGhhc2guXG5cblx0Ly8gdGFrZSByZWRpcmVjdCBwYXJhbWV0ZXIgZnJvbSB0aGUgcXVlcnkgcGFyYW1zXG5cdC8vIHJlbW92ZSBpdCBmcm9tIHRoZSBxdWVyeSBwYXJhbXMgKHNvIHRoYXQgd2UgZG9uJ3QgbG9vcClcblx0bGV0IHJlZGlyZWN0VG8gPSB1cmxRdWVyeVBhcmFtc1tcInJcIl1cblx0aWYgKHJlZGlyZWN0VG8pIHtcblx0XHRkZWxldGUgdXJsUXVlcnlQYXJhbXNbXCJyXCJdXG5cblx0XHRpZiAodHlwZW9mIHJlZGlyZWN0VG8gIT09IFwic3RyaW5nXCIpIHtcblx0XHRcdHJlZGlyZWN0VG8gPSBcIlwiXG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJlZGlyZWN0VG8gPSBcIlwiXG5cdH1cblxuXHQvLyBidWlsZCBuZXcgcXVlcnksIHRoaXMgdGltZSB3aXRob3V0IHJlZGlyZWN0XG5cdGxldCBuZXdRdWVyeVN0cmluZyA9IG0uYnVpbGRRdWVyeVN0cmluZyh1cmxRdWVyeVBhcmFtcylcblxuXHRpZiAobmV3UXVlcnlTdHJpbmcubGVuZ3RoID4gMCkge1xuXHRcdG5ld1F1ZXJ5U3RyaW5nID0gXCI/XCIgKyBuZXdRdWVyeVN0cmluZ1xuXHR9XG5cblx0bGV0IHRhcmdldCA9IHJlZGlyZWN0VG8gKyBuZXdRdWVyeVN0cmluZ1xuXG5cdGlmICh0YXJnZXQgPT09IFwiXCIgfHwgdGFyZ2V0WzBdICE9PSBcIi9cIikgdGFyZ2V0ID0gXCIvXCIgKyB0YXJnZXRcblxuXHQvLyBPbmx5IGFwcGVuZCBjdXJyZW50IGhhc2ggaWYgdGhlcmUncyBubyBoYXNoIGluIHRoZSByZWRpcmVjdCBhbHJlYWR5LlxuXHQvLyBNb3N0IGJyb3dzZXJzIHdpbGwga2VlcCB0aGUgaGFzaCBhcm91bmQgZXZlbiBhZnRlciB0aGUgcmVkaXJlY3QgdW5sZXNzIHRoZXJlJ3MgYW5vdGhlciBvbmUgcHJvdmlkZWQuXG5cdC8vIEluIG91ciBjYXNlIHRoZSBoYXNoIGlzIGVuY29kZWQgYXMgcGFydCBvZiB0aGUgcXVlcnkgYW5kIGlzIG5vdCBkZWR1cGxpY2F0ZWQgbGlrZSBkZXNjcmliZWQgYWJvdmUgc28gd2UgaGF2ZSB0byBtYW51YWxseSBkbyBpdCwgb3RoZXJ3aXNlIHdlIGVuZFxuXHQvLyB1cCB3aXRoIGRvdWJsZSBoYXNoZXMuXG5cdGlmICghbmV3IFVSTCh1cmxQcmVmaXhlcy5wcmVmaXggKyB0YXJnZXQsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKS5oYXNoKSB7XG5cdFx0dGFyZ2V0ICs9IGxvY2F0aW9uLmhhc2hcblx0fVxuXHRyZXR1cm4gdGFyZ2V0XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyRm9yTWFpbHRvKCkge1xuXHQvLyBkb24ndCBkbyB0aGlzIGlmIHdlJ3JlIGluIGFuIGlmcmFtZSwgaW4gYW4gYXBwIG9yIHRoZSBuYXZpZ2F0b3IgZG9lc24ndCBhbGxvdyB1cyB0byBkbyB0aGlzLlxuXHRpZiAod2luZG93LnBhcmVudCA9PT0gd2luZG93ICYmICFpc0Rlc2t0b3AoKSAmJiB0eXBlb2YgbmF2aWdhdG9yLnJlZ2lzdGVyUHJvdG9jb2xIYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRsZXQgb3JpZ2luID0gbG9jYXRpb24ub3JpZ2luXG5cdFx0dHJ5IHtcblx0XHRcdC8vIEB0cy1pZ25vcmUgdGhpcmQgYXJndW1lbnQgcmVtb3ZlZCBmcm9tIHNwZWMsIGJ1dCB1c2UgaXMgc3RpbGwgcmVjb21tZW5kZWRcblx0XHRcdG5hdmlnYXRvci5yZWdpc3RlclByb3RvY29sSGFuZGxlcihcIm1haWx0b1wiLCBvcmlnaW4gKyBcIi9tYWlsdG8jdXJsPSVzXCIsIFwiVHV0YSBNYWlsXCIpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Ly8gQ2F0Y2ggU2VjdXJpdHlFcnJvcidzIGFuZCBzb21lIG90aGVyIGNhc2VzIHdoZW4gd2UgYXJlIG5vdCBhbGxvd2VkIHRvIHJlZ2lzdGVyIGEgaGFuZGxlclxuXHRcdFx0Y29uc29sZS5sb2coXCJGYWlsZWQgdG8gcmVnaXN0ZXIgYSBtYWlsdG86IHByb3RvY29sIGhhbmRsZXIgXCIsIGUpXG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHByaW50Sm9ic01lc3NhZ2UoZG9tYWluQ29uZmlnOiBEb21haW5Db25maWcpIHtcblx0aWYgKGVudi5kaXN0ICYmIGRvbWFpbkNvbmZpZy5maXJzdFBhcnR5RG9tYWluKSB7XG5cdFx0Y29uc29sZS5sb2coYFxuXG4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4uLi4uLi4uLkBAQEBAQEBAQEBAQEBAQEBAQEBAQEBALi4uLi4uLi4uXG4uLi4uLkAuLi4uQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAuLi4uLi4uXG4uLi4uLkBAQC4uLi5AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQC4uLi4uXG4uLi4uLkBAQEBALi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uICAgIERvIHlvdSBjYXJlIGFib3V0IHByaXZhY3k/XG4uLi4uLkBAQEBALi4uQEBAQEBAQEBAQEBAQEBAQEBAQEBAQC4uLi4uXG4uLi4uLkBAQEAuLi5AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQC4uLi4uICAgIFdvcmsgYXQgVHV0YSEgRmlnaHQgZm9yIG91ciByaWdodHMhXG4uLi4uLkBAQEAuLi5AQEBAQEBAQEBAQEBAQEBAQEBAQEBALi4uLi4uXG4uLi4uLkBAQC4uLkBAQEBAQEBAQEBAQEBAQEBAQEBAQEAuLi4uLi4uICAgIGh0dHBzOi8vdHV0YS5jb20vam9ic1xuLi4uLi5AQEAuLi5AQEBAQEBAQEBAQEBAQEBAQEBAQEBALi4uLi4uLlxuLi4uLi5AQC4uLkBAQEBAQEBAQEBAQEBAQEBAQEBAQEAuLi4uLi4uLlxuLi4uLi5AQC4uLkBAQEBAQEBAQEBAQEBAQEBAQEBAQEAuLi4uLi4uLlxuLi4uLi5ALi4uQEBAQEBAQEBAQEBAQEBAQEBAQEBAQC4uLi4uLi4uLlxuLi4uLi5ALi4uQEBAQEBAQEBAQEBAQEBAQEBAQEBAQC4uLi4uLi4uLlxuLi4uLi4uLi5AQEBAQEBAQEBAQEBAQEBAQEBAQEBALi4uLi4uLi4uLlxuLi4uLi4uLkBAQEBAQEBAQEBAQEBAQEBAQEBAQEAuLi4uLi4uLi4uLlxuLi4uLi4uLkBAQEBAQEBAQEBAQEBAQEBAQEBAQEAuLi4uLi4uLi4uLlxuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuXG5gKVxuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQk8sU0FBUyxpQkFBaUIsRUFDaEMsT0FDQSxhQUNBLE1BQ0EsZUFDQSxTQUNBLGFBQ0EsUUFDQSxVQUNBLFVBQ0EsUUFDQSxVQUNBLFNBQ0EsVUFDQSxnQkFDZSxFQUFvQjtBQUNuQyxRQUFPO0VBQ04sVUFBVTtFQUNWLGdCQUFnQjtFQUNoQixXQUFXO0VBQ1gsWUFBWTtFQUNaLFdBQVc7RUFDWCxTQUFTO0VBQ1QsbUJBQW1CO0VBQ25CLDJCQUEyQjtFQUMzQixRQUFRO0VBQ1IsWUFBWTtFQUNaLG9CQUFvQjtFQUNwQiwrQkFBK0I7RUFDL0IsZ0JBQWdCO0VBQ2hCLHdCQUF3QjtFQUN4Qiw0QkFBNEI7RUFDNUIscUJBQXFCO0VBQ3JCLHlCQUF5QjtFQUN6QixhQUFhO0VBQ2IscUJBQXFCO0VBQ3JCLHlCQUF5QjtFQUN6QixhQUFhO0VBQ2IsbUJBQW1CO0VBQ25CLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QsYUFBYTtFQUNiLG1CQUFtQjtDQUNuQjtBQUNEOzs7O0FDekJELHNCQUFz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