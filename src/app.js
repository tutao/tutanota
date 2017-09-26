import {client} from "./misc/ClientDetector"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import en from "./translations/en"
import {lang} from "./misc/LanguageViewModel"
import {root} from "./RootView"
import {handleUncaughtError} from "./misc/ErrorHandler"
import {modal} from "./gui/base/Modal"
import {styles} from "./gui/styles"
import "./gui/main-styles"
import {InfoView} from "./gui/base/InfoView"
import {Button, ButtonType} from "./gui/base/Button"
import {header} from "./gui/base/Header"
import {assertMainOrNode} from "./api/Env"
import deletedModule from "@hot"
import {keyManager} from "./misc/KeyManager"
import {logins} from "./api/main/LoginController"
import {asyncImport} from "./api/common/utils/Utils"
import {themeId} from "./gui/theme"

assertMainOrNode()

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
}

function _asyncImport(path: string) {
	return asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}${path}`)
}


client.init(navigator.userAgent, navigator.platform)
styles.init()

export const state = (deletedModule && deletedModule.module) ? deletedModule.module.state : {prefix: null}


let initialized = lang.init(en).then(() => {
	if (!client.isSupported()) {
		m.render(document.body, m(root, m(new InfoView(() => "404", () => [
			m("p", lang.get("unsupportedBrowser_msg")),
			m("p", m("a[target=_blank][href=http://www.mozilla.org/de/firefox]", "Firefox (Desktop)")),
			m("p", m("a[target=_blank][href=http://www.google.com/chrome]", "Chrome (Desktop, Android)")),
			m("p", m("a[target=_blank][href=http://www.opera.com/de/mobile/operabrowser]", "Opera (Desktop, Android)")),
			m("p", m("a[target=_blank][href=http://www.apple.com/de/safari]", "Safari (Desktop, iOS)")),
			m("p", m("a[target=_blank][href=http://windows.microsoft.com/de-DE/internet-explorer/download-ie]", "Microsoft Edge (Desktop)")),
		]))))
		return;
	}

	function createViewResolver(getView: lazy<Component>, requireLogin: boolean = true) {
		let cache = {view: null}
		return {
			onmatch: (args, requestedPath) => {
				if (requireLogin && !logins.isUserLoggedIn()) {
					forceLogin(args, requestedPath)
				} else if (!requireLogin && logins.isUserLoggedIn()) {
					return workerPromise.then(worker => {
						return worker.logout().then(function () {
							window.location.reload();
						})
					})
				} else {
					let promise
					if (cache.view == null) {
						promise = getView().then(view => {
							cache.view = view
							return view
						})
					} else {
						promise = Promise.resolve(cache.view)
					}
					promise.then(view => {
						view.updateUrl(args)
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

	let mailViewResolver = createViewResolver(() => _asyncImport("src/mail/MailView.js").then(module => new module.MailView()))
	let contactViewResolver = createViewResolver(() => _asyncImport("src/contacts/ContactView.js").then(module => new module.ContactView()))
	let externalLoginViewResolver = createViewResolver(() => _asyncImport("src/login/ExternalLoginView.js").then(module => new module.ExternalLoginView()), false)
	let loginViewResolver = createViewResolver(() => _asyncImport("src/login/LoginView.js").then(module => new module.LoginView()), false)
	let settingsViewResolver = createViewResolver(() => _asyncImport("src/settings/SettingsView.js").then(module => new module.SettingsView()))
	let registerViewResolver = createViewResolver(() => _asyncImport("src/register/RegisterView.js").then(module => new module.RegisterView()), false)
	let contactFormViewResolver = createViewResolver(() => _asyncImport("src/login/ContactFormView.js").then(module => new module.ContactFormView()), false)

	let start = "/"
	if (state.prefix == null) {
		state.prefix = location.pathname[location.pathname.length - 1] !== '/' ? location.pathname : location.pathname.substring(0, location.pathname.length - 1)

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
		if (target == "" || target[0] != "/") target = "/" + target
		history.replaceState(null, null, state.prefix + target)
		start = target
	}
	m.route.prefix(state.prefix)

	// keep in sync with RewriteAppResourceUrlHandler.java
	m.route(document.body, start, {
		"/": {
			onmatch: (args, requestedPath) => forceLogin(args, requestedPath)
		},
		"/login": loginViewResolver,
		"/mail": mailViewResolver,
		"/mail/:listId": mailViewResolver,
		"/mail/:listId/:mailId": mailViewResolver,
		"/ext": externalLoginViewResolver,
		"/contact": contactViewResolver,
		"/contact/:listId": contactViewResolver,
		"/contact/:listId/:contactId": contactViewResolver,
		"/settings": settingsViewResolver,
		"/settings/:folder": settingsViewResolver,
		"/signup": registerViewResolver,
		"/contactform/:formId": contactFormViewResolver,
		"/:path...": {
			onmatch: (args, requestedPath) => {
				console.log("Not found", args, requestedPath)
			},
			render: () => {
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

	disableBodyTouchScrolling()
})

function forceLogin(args: string[], requestedPath: string) {
	if (requestedPath.indexOf('#mail') !== -1) {
		m.route.set(`/ext${location.hash}`)
	} else {
		if (requestedPath.trim() === '/') {
			m.route.set(`/login`)
		} else {
			m.route.set(`/login?requestedPath=${requestedPath}`)
		}
	}
}


export function __reload(deletedModule) {
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

/**
 * Prevents the complete window from scrolling vertically on touch for ios devices.
 * See http://stackoverflow.com/questions/10238084/ios-safari-how-to-disable-overscroll-but-allow-scrollable-divs-to-scroll-norma
 */
function disableBodyTouchScrolling() {
	document.addEventListener('touchmove', event => event.preventDefault(), client.passive() ? {passive: false} : false)
	document.body.addEventListener('touchmove', event => {
		let scrollable = event.target.closest(".scroll")
		if (scrollable && scrollable.scrollHeight > scrollable.offsetHeight) {
			event.stopPropagation();
		}
	}, client.passive() ? {passive: false} : false)

	document.body.addEventListener('touchstart', event => {
		let scrollable = event.target.closest(".scroll")
		if (scrollable && scrollable.scrollHeight > scrollable.offsetHeight) {
			if (scrollable.scrollTop === 0) {
				scrollable.scrollTop = 1;
			} else if (scrollable.scrollHeight === scrollable.scrollTop + scrollable.offsetHeight) {
				scrollable.scrollTop -= 1;
			}
		}
	}, client.passive() ? {passive: true} : false)

}