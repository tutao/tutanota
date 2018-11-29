//@flow
import {client} from "./misc/ClientDetector"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import en from "./translations/en"
import {lang} from "./misc/LanguageViewModel"
import {root} from "./RootView"
import {handleUncaughtError, logginOut} from "./misc/ErrorHandler"
import {modal} from "./gui/base/Modal"
import "./gui/main-styles"
import {InfoView} from "./gui/base/InfoView"
import {Button, ButtonType} from "./gui/base/Button"
import {header} from "./gui/base/Header"
import {assertMainOrNodeBoot, bootFinished, isApp} from "./api/Env"
import deletedModule from "@hot"
import {keyManager} from "./misc/KeyManager"
import {logins} from "./api/main/LoginController"
import {asyncImport, neverNull} from "./api/common/utils/Utils"
import {themeId} from "./gui/theme"
import {routeChange} from "./misc/RouteChange"
import {windowFacade} from "./misc/WindowFacade"
import {Const} from "./api/common/TutanotaConstants"
import {DeviceType} from "./misc/ClientConstants"
import {styles} from "./gui/styles.js"

assertMainOrNodeBoot()
bootFinished()

// TODO: define type definition for top-level views. Maybe it's CurrentView?
type View = Object

Promise.config({
	longStackTraces: false,
	warnings: false
})

let currentView: ?Component = null

window.tutao = {
	client,
	m,
	stream,
	modal,
	lang,
	root,
	header,
	keyManager,
	logins,
	currentView,
	themeId,
	Const,
	locator: window.tutao ? window.tutao.locator : null // locator is not restored on hot reload otherwise
}

function _asyncImport(path: string) {
	return asyncImport(typeof module !== "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}${path}`)
}


client.init(navigator.userAgent, navigator.platform)

_asyncImport("src/serviceworker/ServiceWorkerClient.js").then((swModule) => swModule.init())


export const state: {prefix: ?string} = (deletedModule && deletedModule.module)
	? deletedModule.module.state : {prefix: null}

let origin = location.origin
if (location.origin.indexOf("localhost") !== -1) {
	origin += "/client/build/index"
}
if (navigator.registerProtocolHandler) {
	try {
		navigator.registerProtocolHandler('mailto', origin + '/mailto#url=%s', 'Tutanota');
	} catch (e) {
		// Catch SecurityError's and some other cases when we are not allowed to register a handler
		console.log("Failed to register a mailto: protocol handler ", e)
	}
}

let initialized = lang.init(en).then(() => {
	styles.init()
	if (!client.isSupported()) {
		if (isApp() && client.device === DeviceType.ANDROID) {

			const androidVersion = Number(/Android (0-9)*\./.exec(client.userAgent))
			m.render(document.body, m(new InfoView(
				() => "Tutanota",
				() => [
					m("p", "Sorry! We detected that your WebView version is outdated. Please update your WebView version."),
					m("p", m("a", {href: "market://details?id=com.google.android.webview"}, "Update WebView")),
					m("p", m("a", {href: "https://tutanota.uservoice.com/knowledgebase/articles/1890001-outdated-webview-version-on-android"}, "Learn more"))
				].concat(androidVersion >= 7
					? [
						m("p", "Starting from Android N, the WebView version depends on the Chrome version by default. You can change the used version in the settings"),
						m("p", m("a", {href: "market://details?id=com.android.chrome"}, "Update Chrome"))
					]
					: []))))
		} else {
			m.render(document.body, m(new InfoView(() => "Tutanota", () => [
				m("p", lang.get("unsupportedBrowser_msg")),
				m("p", m("a[target=_blank][href=http://www.mozilla.org/de/firefox]", "Firefox (Desktop)")),
				m("p", m("a[target=_blank][href=http://www.google.com/chrome]", "Chrome (Desktop, Android)")),
				m("p", m("a[target=_blank][href=http://www.opera.com/de/mobile/operabrowser]", "Opera (Desktop, Android)")),
				m("p", m("a[target=_blank][href=http://www.apple.com/de/safari]", "Safari (Desktop, iOS)")),
				m("p", m("a[target=_blank][href=https://support.microsoft.com/en-us/products/microsoft-edge]", "Microsoft Edge (Desktop)"))
			])))
		}

		return;
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
					return workerPromise.then(worker => {
						return worker.logout(false).then(function () {
							windowFacade.reload(args)
						})
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
					promise.then(view => {
						view.updateUrl(args, requestedPath)
						routeChange({args, requestedPath})
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

	let mailViewResolver = createViewResolver(() => _asyncImport("src/mail/MailView.js")
		.then(module => new module.MailView()))
	let contactViewResolver = createViewResolver(() => _asyncImport("src/contacts/ContactView.js")
		.then(module => new module.ContactView()))
	let externalLoginViewResolver = createViewResolver(() => _asyncImport("src/login/ExternalLoginView.js")
		.then(module => new module.ExternalLoginView()), false)
	let loginViewResolver = createViewResolver(() => _asyncImport("src/login/LoginView.js")
		.then(module => module.login), false)
	let settingsViewResolver = createViewResolver(() => _asyncImport("src/settings/SettingsView.js")
		.then(module => new module.SettingsView()))
	let searchViewResolver = createViewResolver(() => _asyncImport("src/search/SearchView.js")
		.then(module => new module.SearchView()))
	let contactFormViewResolver = createViewResolver(() => _asyncImport("src/login/ContactFormView.js")
		.then(module => module.contactFormView), false)

	let start = "/"
	if (!state.prefix) {
		state.prefix = location.pathname[location.pathname.length - 1] !== '/'
			? location.pathname : location.pathname.substring(0, location.pathname.length - 1)

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
		start = target
	}
	m.route.prefix(neverNull(state.prefix))

	// keep in sync with RewriteAppResourceUrlHandler.java
	m.route(document.body, start, {
		"/": {
			onmatch: (args, requestedPath) => forceLogin(args, requestedPath)
		},
		"/login": loginViewResolver,
		"/signup": loginViewResolver,
		"/recover": loginViewResolver,
		"/mailto": mailViewResolver,
		"/mail": mailViewResolver,
		"/mail/:listId": mailViewResolver,
		"/mail/:listId/:mailId": mailViewResolver,
		"/ext": externalLoginViewResolver,
		"/contact": contactViewResolver,
		"/contact/:listId": contactViewResolver,
		"/contact/:listId/:contactId": contactViewResolver,
		"/search/:category": searchViewResolver,
		"/search/:category/:id": searchViewResolver,
		"/settings": settingsViewResolver,
		"/settings/:folder": settingsViewResolver,
		"/contactform/:formId": contactFormViewResolver,
		"/:path...": {
			onmatch: (args: {[string]: string}, requestedPath: string): void => {
				console.log("Not found", args, requestedPath)
			},
			render: (vnode: Object): VirtualElement => {
				return m(root, m(new InfoView(() => "404", () => [
					m("p", lang.get("notFound404_msg")),
					m(new Button('back_action', () => window.history.back())
						.setType(ButtonType.Primary))
				])))
			}
		}
	})

	const workerPromise = _asyncImport("src/api/main/WorkerClient.js")
		.then(module => module.worker)

	setupExceptionHandling()
})


function forceLogin(args: {[string]: string}, requestedPath: string) {
	if (requestedPath.indexOf('#mail') !== -1) {
		m.route.set(`/ext${location.hash}`)
	} else if (requestedPath.startsWith("/#")) {
		// we do not allow any other hashes except "#mail". this prevents login loops.
		m.route.set("/login")
	} else {
		let pathWithoutParameter = requestedPath.indexOf("?")
		> 0 ? requestedPath.substring(0, requestedPath.indexOf("?")) : requestedPath
		if (pathWithoutParameter.trim() === '/') {
			let newQueryString = m.buildQueryString(args)
			m.route.set(`/login` + (newQueryString.length > 0 ? "?" + newQueryString : ""))
		} else {
			m.route.set(`/login?requestedPath=${encodeURIComponent(requestedPath)}`)
		}
	}
}


export function __reload(deletedModule: any) {
	console.log('__reload');
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