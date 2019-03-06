const Promise = require('bluebird')

const path = require("path")
const fs = Promise.Promise.promisifyAll(require("fs-extra"))


global.window = undefined

function getUrls(env) {
	if (env.staticUrl) {
		return env.staticUrl + " ws" + env.staticUrl.substring(4)
	} else {
		return ""
	}
}

/**
 * Renders the initial HTML page to bootstrap Tutanota for different environments
 */
module.exports.renderHtml = function (scripts, env) {
	global.window = require("mithril/test-utils/browserMock")()
	const m = require('mithril')
	const render = require('mithril-node-render')
	let html = '<!DOCTYPE html>\n' + render(
		m("html", [
			m("head", [
				m("meta[charset=utf-8]"),
				csp(m, env),
				m("meta[name=apple-mobile-web-app-capable][content=yes]"),
				m("meta[name=mobile-web-app-capable][content=yes]"),
				m("meta[name=referrer][content=no-referrer]"),
				m("meta[name=viewport][content=width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover]"),
				scripts.map(script => m(`script[src=${script}][defer]`)),
				m.trust("<!-- TutanotaTags -->"), // everything from here to </head> is replaced at runtime for custom domains with defined metaTags
				m("title", "Mail. Done. Right. Tutanota Login & Sign up"), // keep in sync with Env.
				m("meta[name=description][content=Mail. Done. Right. Register with the secure mail service Tutanota for free & take back your privacy. Tutanota encrypts mails and contacts automatically.]"),
				m("link[rel=shortcut icon][type=image/x-icon][href=/images/logo-favicon-152.png]"),
				m("meta[name=application-name][content=Tutanota]"),
				m("link[rel=apple-touch-icon][sizes=152x152][href=/images/logo-favicon-152.png]"),
				m("link[rel=icon][sizes=192x192][href=/images/logo-favicon-192.png]"),

				// twitter
				m("meta[name=twitter:card][content=summary]"),
				m("meta[name=twitter:site][content=@TutanotaTeam]"),
				m("meta[name=twitter:domain][content=tutanota.com]"),
				m("meta[name=twitter:image][content=https://tutanota.com/images/share_image.png]"),

				// facebook
				m("meta[stream=og:site_name][content=Tutanota]"),
				m("meta[stream=og:title][content=Secure Emails Become a Breeze]"),
				m("meta[stream=og:description][content=Get your encrypted mailbox for free and show the Internet spies that you won&#39;t make it easy for them! Why? Because you simply can.]"),
				m("meta[stream=og:locale][content=en_US]"),
				m("meta[stream=og:url][content=https://tutanota.com/]"),
				m("meta[stream=og:image][content=https://tutanota.com/images/share_image.png]"),
				m("meta[stream=article:publisher][content=https://www.facebook.com/tutanota]"),

				// google +
				m("meta[itemprop=name][content=Secure Emails Become a Breeze.]"),
				m("meta[itemprop=description][content=Get your encrypted mailbox for free and show the Internet spies that you won&#39;t make it easy for them! Why? Because you simply can.]"),
				m("meta[itemprop=image][content=https://tutanota.com/images/share_image.png]"),

				m("meta[name=apple-itunes-app][content=app-id=id922429609, affiliate-data=10lSfb]"),
			]),
			m("body", m("noscript",
				"Tutanota requires javascript to be enabled. Please, activate it in the settings of your browser."))
		])
	)
	global.window = undefined // we have to reset the window stream as it leads to problems with system js builder, otherwise
	return html
}

const csp = (m, env) => {
	if (env.dist && (env.mode === "App" || env.mode === "Desktop")) {
		// differences in comparison to web csp:
		// * Content Security Policies delivered via a <meta> element may not contain the frame-ancestors directive.
		return m("meta[http-equiv=Content-Security-Policy][content=default-src 'none'; script-src 'self'; child-src 'self'; font-src 'self'; img-src http: data: *; " +
			`style-src 'unsafe-inline'; base-uri 'none'; connect-src 'self' ${getUrls(env)};]`)
	} else {
		return null
	}
}

module.exports.renderTestHtml = function (scripts) {
	global.window = require("mithril/test-utils/browserMock")()
	const m = require('mithril')
	const render = require('mithril-node-render')
	let html = '<!DOCTYPE html>\n' + render(
		m("html", [
			m("head", [
				m("meta[charset=utf-8]"),
				m("title", "Test"),
				scripts.map(script => m(`script[src=${script}]`))
			]),
			m("body", "Open the console (F12) for test output!")
		])
	)
	global.window = undefined // we have to reset the window stream as it leads to problems with system js builder, otherwise
	return html
}

function _writeFile(targetFile, content) {
	return fs.mkdirsAsync(path.dirname(targetFile)).then(() => fs.writeFileAsync(targetFile, content, 'utf-8'))
}

class ExternalScript {
	constructor(url) {
		this.url = url
	}
}