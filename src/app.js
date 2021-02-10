//@flow
import {client} from "./misc/ClientDetector"
import m from "mithril"
import {lang, languageCodeToTag, languages} from "./misc/LanguageViewModel"
import {root} from "./RootView"
import {handleUncaughtError, logginOut} from "./misc/ErrorHandler"
import "./gui/main-styles"
import {assertMainOrNodeBoot, bootFinished, isApp, isDesktop, isTutanotaDomain} from "./api/common/Env"
import {logins} from "./api/main/LoginController"
import {downcast, neverNull} from "./api/common/utils/Utils"
import {themeId} from "./gui/theme"
import {routeChange} from "./misc/RouteChange"
import {windowFacade} from "./misc/WindowFacade"
import {Const} from "./api/common/TutanotaConstants"
import {styles} from "./gui/styles.js"
import {deviceConfig} from "./misc/DeviceConfig"
import {Logger, replaceNativeLogger} from "./api/common/Logger"
import {init as initSW} from "./serviceworker/ServiceWorkerClient"
import {applicationPaths} from "./ApplicationPaths"

assertMainOrNodeBoot()
bootFinished()

replaceNativeLogger(window, new Logger())

// TODO: define type definition for top-level views. Maybe it's CurrentView?
type View = Object

window.Promise = Promise.config({
	longStackTraces: false,
	warnings: false
})

let currentView: ?Component = null

window.tutao = {
	client,
	m,
	lang,
	root,
	logins,
	currentView,
	themeId,
	Const,
	locator: window.tutao ? window.tutao.locator : null // locator is not restored on hot reload otherwise
}
setupExceptionHandling()

client.init(navigator.userAgent, navigator.platform)
// this needs to stay after client.init
windowFacade.init()

export const state: {prefix: ?string, prefixWithoutFile: ?string} = (typeof module != "undefined" && module.hot && module.hot.data)
	? downcast(module.hot.data.state) : {prefix: null, prefixWithoutFile: null}

let startRoute = "/"
if (state.prefix == null) {
	const prefix = state.prefix = location.pathname[location.pathname.length - 1] !== '/'
		? location.pathname
		: location.pathname.substring(0, location.pathname.length - 1)
	state.prefixWithoutFile = prefix.includes(".") ? prefix.substring(0, prefix.lastIndexOf("/")) : prefix

	let query = m.parseQueryString(location.search)
	let redirectTo = query['r'] // redirection triggered by the server (e.g. the user reloads /mail/id by pressing F5)
	if (redirectTo) {
		delete query['r']
	} else {
		redirectTo = ""
	}
	let newQueryString = m.buildQueryString(query)
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
if (!isDesktop() && navigator.registerProtocolHandler) {
	try {
		navigator.registerProtocolHandler('mailto', origin + '/mailto#url=%s', 'Tutanota');
	} catch (e) {
		// Catch SecurityError's and some other cases when we are not allowed to register a handler
		console.log("Failed to register a mailto: protocol handler ", e)
	}
}

//$FlowFixMe[untyped-import]
import("./translations/en").then((en) => lang.init(en.default)).then(() => {
	if (!client.isSupported()) {
		throw new Error("Unsupported")
	}

	// do this after lang initialized
	if (client.isIE()) {
		import("./gui/base/NotificationOverlay.js").then((module) => module.show({
			view: () => m("", lang.get("unsupportedBrowserOverlay_msg"))
		}, {label: "close_alt"}, []))
	} else if (isDesktop()) {
		import("./native/main/UpdatePrompt.js").then(({registerForUpdates}) => registerForUpdates())
	}

	const userLanguage = deviceConfig.getLanguage() && languages.find((l) => l.code === deviceConfig.getLanguage())
	if (userLanguage) {
		const language = {code: userLanguage.code, languageTag: languageCodeToTag(userLanguage.code)}
		lang.setLanguage(language).catch((e) => {
			console.error("Failed to fetch translation: " + userLanguage.code, e)
		})
		if (isApp() || isDesktop()) {
			import("./native/main/SystemApp").then(({changeSystemLanguage}) => changeSystemLanguage(language))
		}
	}

	function createViewResolver(getView: lazy<Promise<View>>, requireLogin: boolean = true,
	                            doNotCache: boolean = false): RouteResolverMatch {
		let cache: {view: ?View} = {view: null}
		return {
			onmatch: (args, requestedPath) => {
				if (requireLogin && !logins.isUserLoggedIn()) {
					forceLogin(args, requestedPath)
				} else if (!requireLogin && logins.isUserLoggedIn()) {
					logginOut()
					return logins.logout(false).then(() => {
						windowFacade.reload(args)
					})
				} else {
					let promise
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
					Promise.all([
						promise,
						import("./gui/base/Header")
					]).then(([view, {header}]) => {
						view.updateUrl(args, requestedPath)
						const currentPath = m.route.get()
						routeChange({args, requestedPath, currentPath})
						header.updateCurrentView(view)
						tutao.currentView = view
					})
					return promise
				}
			},
			render: (vnode) => {
				return m(root, vnode)
			}
		}
	}

	const paths = applicationPaths({
		loginViewResolver: createViewResolver(() => import("./login/LoginView.js")
			.then(module => module.login), false),
		contactViewResolver: createViewResolver(() => import("./contacts/view/ContactView.js")
			.then(module => new module.ContactView())),
		externalLoginViewResolver: createViewResolver(() => import("./login/ExternalLoginView.js")
			.then(module => new module.ExternalLoginView()), false),
		mailViewResolver: createViewResolver(() => import("./mail/view/MailView.js")
			.then(module => new module.MailView())),
		settingsViewResolver: createViewResolver(() => import("./settings/SettingsView.js")
			.then(module => new module.SettingsView())),
		searchViewResolver: createViewResolver(() => import("./search/view/SearchView.js")
			.then(module => new module.SearchView())),
		contactFormViewResolver: createViewResolver(() => import("./login/contactform/ContactFormView.js")
			.then(module => module.contactFormView), false),
		calendarViewResolver: createViewResolver(() => import("./calendar/view/CalendarView.js")
			.then(module => new module.CalendarView()), true)
	})

	// see https://github.com/MithrilJS/mithril.js/issues/2659
	m.route.prefix = neverNull(state.prefix).replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
	styles.init()

	// keep in sync with RewriteAppResourceUrlHandler.java
	const resolvers: {[string]: RouteResolver} = {
		"/": {
			onmatch: (args, requestedPath) => forceLogin(args, requestedPath)
		},
	}

	for (let path in paths) {
		resolvers[path] = paths[path]
	}

	// append catch all at the end because mithril will stop at the first match
	resolvers["/:path"] = {
		onmatch: (args: {[string]: string}, requestedPath: string): Promise<Component> => {
			return Promise.all([import("./gui/base/InfoView"), import("./gui/base/ButtonN")])
			              .then(([{InfoView}, {ButtonType, ButtonN}]) => {
				              return {
					              view() {
						              return m(root, m(new InfoView(() => "404", () => [
							              m("p", lang.get("notFound404_msg")),
							              m(ButtonN, {
								              label: 'back_action',
								              click: () => window.history.back(),
								              type: ButtonType.Primary,
							              }),
						              ])))
					              }
				              }
			              })
		}
	}

	// keep in sync with RewriteAppResourceUrlHandler.java
	// flow fails to resolve RouteResolver properly
	m.route(neverNull(document.body), startRoute, downcast(resolvers))

	const workerPromise = import("./api/main/WorkerClient.js")
	workerPromise.then((worker) => {
		import("./gui/InfoMessageHandler.js")
	})

	// after we set up prefixWithoutFile
	initSW()
})

function forceLogin(args: {[string]: string}, requestedPath: string) {
	if (requestedPath.indexOf('#mail') !== -1) {
		m.route.set(`/ext${location.hash}`)
	} else if (requestedPath.startsWith("/#")) {
		// we do not allow any other hashes except "#mail". this prevents login loops.
		m.route.set("/login")
	} else {
		let pathWithoutParameter = requestedPath.indexOf("?") > 0
			? requestedPath.substring(0, requestedPath.indexOf("?"))
			: requestedPath
		if (pathWithoutParameter.trim() === '/') {
			let newQueryString = m.buildQueryString(args)
			m.route.set(`/login` + (newQueryString.length > 0 ? "?" + newQueryString : ""))
		} else {
			m.route.set(`/login?requestedPath=${encodeURIComponent(requestedPath)}`)
		}
	}
}

function setupExceptionHandling() {
	Promise.onPossiblyUnhandledRejection(handleUncaughtError);
	window.addEventListener('error', function (evt) {
		// evt.error is not always set, e.g. not for "content.js:1963 Uncaught DOMException: Failed to read the 'selectionStart' property from 'HTMLInputElement': The input element's type ('email') does not support selection."
		if (evt.error) {
			handleUncaughtError(evt.error)
			evt.preventDefault()
		}
	})
}

env.dist && isTutanotaDomain() && setTimeout(() => {
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

const hot = typeof module !== "undefined" && module.hot
if (hot) {
	// Save the state (mostly prefix) before the reload
	hot.dispose((data) => {
		data.state = state
	})
	// Import ourselves again to actually replace ourselves and all the dependencies
	hot.accept(() => {
		console.log("Requiring new app.js")
		require(module.id)
	})
}