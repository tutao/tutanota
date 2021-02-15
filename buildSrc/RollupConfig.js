import path from "path"

// These are the dependencies that must be provided for the module loader systemjs
export const dependencyMap = {
	"mithril": "./libs/mithril.js",
	"mithril/stream/stream.js": "./libs/stream.js",
	"squire-rte": "./libs/squire-raw.js",
	"bluebird": "./libs/bluebird.js",
	"dompurify": "./libs/purify.js",
	"autolinker": "./libs/Autolinker.js",
	"qrcode": "./libs/qrcode.js",
	"jszip": "./libs/jszip.js",
	"luxon": "./libs/luxon.js",
	"oxmsg": "./node_modules/oxmsg/dist/oxmsg.js"
}

export const allowedImports = {
	"polyfill-helpers": [],
	"common-min": ["polyfill-helpers"],
	"boot": ["polyfill-helpers", "common-min"],
	"common": ["polyfill-helpers", "common-min"],
	"gui-base": ["polyfill-helpers", "common-min", "common", "boot"],
	"main": ["polyfill-helpers", "common-min", "common", "boot", "gui-base"],
	"urlifier": ["polyfill-helpers", "common-min", "common", "boot"],
	"sanitizer": ["polyfill-helpers", "common-min", "common", "boot", "gui-base"],
	"date": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main"],
	"mail-view": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main"],
	"mail-editor": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "mail-view", "sanitizer"],
	"search": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "mail-view", "contacts", "date"],
	// ContactMergeView needs HtmlEditor even though ContactEditor doesn't?
	"contacts": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "mail-view", "date", "mail-editor"],
	"calendar-view": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "date"],
	"login": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main",],
	"worker": ["polyfill-helpers", "common-min", "common", "native-common", "native-worker"],
	"settings": [
		"polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "contacts", "sanitizer", "mail-editor", "mail-view", "date",
		"login"
	],
	"ui-extra": [
		"polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "settings", "contacts", "sanitizer", "login", "mail-editor"
	],
	"native-common": ["polyfill-helpers", "common-min", "common"],
	"native-main": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "native-common", "login"],
	"native-worker": ["polyfill-helpers", "common-min", "common"],
	"jszip": ["polyfill-helpers"]
}

export function resolveLibs(baseDir = ".") {
	return {
		name: "resolve-libs",
		resolveId(source) {
			const resolved = dependencyMap[source]
			return resolved && path.join(baseDir, resolved)
		}
	}
}

export function manualChunks(id, {getModuleInfo}) {
	// See HACKING.md for rules
	const code = getModuleInfo(id).code
	if (code.includes("@bundleInto:common-min") || id.includes("libs/stream")) {
		return "common-min"
	} else if (code.includes("assertMainOrNodeBoot") ||
		id.includes("libs/mithril") ||
		id.includes("src/app.js") ||
		code.includes("@bundleInto:boot")
	) {
		// everything marked as assertMainOrNodeBoot goes into boot bundle right now
		// (which is getting merged into app.js)
		return "boot"
	} else if (id.includes("src/gui/date") ||
		id.includes("src/misc/DateParser") ||
		id.includes("luxon") ||
		id.includes("src/calendar/CalendarUtils") ||
		id.includes("src/calendar/CalendarInvites") ||
		id.includes("src/calendar/CalendarUpdateDistributor") ||
		id.includes("src/calendar/export") ||
		id.includes("src/calendar/CalendarEventViewModel")
	) {
		// luxon and everything that depends on it goes into date bundle
		return "date"
	} else if (id.includes("src/misc/HtmlSanitizer") || id.includes("libs/purify")) {
		return "sanitizer"
	} else if (id.includes("src/misc/Urlifier") || id.includes("libs/Autolinker")) {
		return "urlifier"
	} else if (id.includes("src/gui/base") || id.includes("src/gui/nav")) {
		// these gui elements are used from everywhere
		return "gui-base"
	} else if (id.includes("src/native/main") || id.includes("SearchInPageOverlay")) {
		return "native-main"
	} else if (id.includes("src/mail/editor") ||
		id.includes("squire") ||
		id.includes("src/gui/editor") ||
		id.includes("src/mail/signature")
	) {
		// squire is most often used with mail editor and they are both not too big so we merge them
		return "mail-editor"
	} else if (
		id.includes("src/api/main") ||
		id.includes("src/mail/model") ||
		id.includes("src/contacts/model") ||
		id.includes("src/calendar/model") ||
		id.includes("src/search/model") ||
		id.includes("src/misc/ErrorHandlerImpl") ||
		id.includes("src/misc") ||
		id.includes("src/file") ||
		id.includes("src/gui")
	) {
		// Things which we always need for main thread anyway, at least currently
		return "main"
	} else if (id.includes("src/mail/view") || id.includes("src/mail/export")) {
		return "mail-view"
	} else if (id.includes("src/native/worker")) {
		return "worker"
	} else if (id.includes("src/native/common")) {
		return "native-common"
	} else if (id.includes("src/search")) {
		return "search"
	} else if (id.includes("src/calendar/view")) {
		return "calendar-view"
	} else if (id.includes("src/contacts")) {
		return "contacts"
	} else if (id.includes("src/login/recover") || id.includes("src/support") || id.includes("src/login/contactform")) {
		// Collection of small UI components which are used not too often
		// Perhaps contact form should be separate
		// Recover things depends on HtmlEditor which we don't want to load on each login
		return "ui-extra"
	} else if (id.includes("src/login")) {
		return "login"
	} else if (id.includes("src/api/common") || id.includes("src/api/entities")) {
		// things that are used in both worker and client
		// entities could be separate in theory but in practice they are anyway
		return "common"
	} else if (id.includes("rollupPluginBabelHelpers") || id.includes("commonjsHelpers")) {
		return "polyfill-helpers"
	} else if (id.includes("src/settings") || id.includes("src/subscription") || id.includes("libs/qrcode")) {
		// subscription and settings depend on each other right now.
		// subscription is also a kitchen sink with signup, utils and views, we should break it up
		return "settings"
	} else if (id.includes("src/api/worker")) {
		return "worker" // avoid that crypto stuff is only put into native
	} else if (id.includes("libs/jszip")) {
		return "jszip"
	} else {
		// Put all translations into "translation-code"
		// Almost like in Rollup example: https://rollupjs.org/guide/en/#outputmanualchunks
		// This groups chunks but does not rename them for some reason so we do chunkFileNames below
		const match = /.*\/translations\/(\w+)+\.js/.exec(id)
		if (match) {
			const language = match[1]
			return "translation-" + language
		}
	}
}

export function bundleDepCheckPlugin() {
	return {
		name: "bundle-dep-check",
		generateBundle(outOpts, bundle) {
			const getModuleInfo = this.getModuleInfo.bind(this)

			for (const [key, value] of Object.entries(bundle)) {
				for (const module of Object.keys(value.modules)) {
					if (module.includes("src/translations")) {
						continue
					}
					const ownChunk = manualChunks(module, {getModuleInfo})
					if (!allowedImports[ownChunk]) {
						throw new Error(`Unknown chunk: ${ownChunk} of ${module}`)
					}

					for (const imported of getModuleInfo(module).importedIds) {
						if (imported.includes("src/translations")) {
							continue
						}
						const importedChunk = manualChunks(imported, {getModuleInfo})
						if (!allowedImports[importedChunk]) {
							throw new Error(`Unknown chunk: ${importedChunk} of ${imported}`)
						}
						if (ownChunk !== importedChunk && !allowedImports[ownChunk].includes(importedChunk)) {
							throw new Error(`${module} (from ${ownChunk}) imports ${imported} (from ${importedChunk}) which is not allowed`)
						}
					}
				}
			}
		}
	}
}