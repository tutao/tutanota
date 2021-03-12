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

/**
 * These are the definitions of chunks with static dependencies. Key is the chunk and values are dependencies to other chunks
 */
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

/**
 * Returns the chunk name for the given moduleId which is usually the file path.
 * @param moduleId Rollup moduleId usually the file path.
 * @param getModuleInfo Helper function to get information about the ES module.
 * @returns {string} Chunk name
 */
export function getChunkName(moduleId, {getModuleInfo}) {
	// See HACKING.md for rules
	const code = getModuleInfo(moduleId).code
	if (code.includes("@bundleInto:common-min") || moduleId.includes("libs/stream")) {
		return "common-min"
	} else if (code.includes("assertMainOrNodeBoot") ||
		moduleId.includes("libs/mithril") ||
		moduleId.includes("src/app.js") ||
		code.includes("@bundleInto:boot")
	) {
		// everything marked as assertMainOrNodeBoot goes into boot bundle right now
		// (which is getting merged into app.js)
		return "boot"
	} else if (moduleId.includes("src/gui/date") ||
		moduleId.includes("src/misc/DateParser") ||
		moduleId.includes("luxon") ||
		moduleId.includes("src/calendar/CalendarUtils") ||
		moduleId.includes("src/calendar/CalendarInvites") ||
		moduleId.includes("src/calendar/CalendarUpdateDistributor") ||
		moduleId.includes("src/calendar/export") ||
		moduleId.includes("src/calendar/CalendarEventViewModel")
	) {
		// luxon and everything that depends on it goes into date bundle
		return "date"
	} else if (moduleId.includes("src/misc/HtmlSanitizer") || moduleId.includes("libs/purify")) {
		return "sanitizer"
	} else if (moduleId.includes("src/misc/Urlifier") || moduleId.includes("libs/Autolinker")) {
		return "urlifier"
	} else if (moduleId.includes("src/gui/base") || moduleId.includes("src/gui/nav")) {
		// these gui elements are used from everywhere
		return "gui-base"
	} else if (moduleId.includes("src/native/main") || moduleId.includes("SearchInPageOverlay")) {
		return "native-main"
	} else if (moduleId.includes("src/mail/editor") ||
		moduleId.includes("squire") ||
		moduleId.includes("src/gui/editor") ||
		moduleId.includes("src/mail/signature")
	) {
		// squire is most often used with mail editor and they are both not too big so we merge them
		return "mail-editor"
	} else if (
		moduleId.includes("src/api/main") ||
		moduleId.includes("src/mail/model") ||
		moduleId.includes("src/contacts/model") ||
		moduleId.includes("src/calendar/model") ||
		moduleId.includes("src/search/model") ||
		moduleId.includes("src/misc/ErrorHandlerImpl") ||
		moduleId.includes("src/misc") ||
		moduleId.includes("src/file") ||
		moduleId.includes("src/gui")
	) {
		// Things which we always need for main thread anyway, at least currently
		return "main"
	} else if (moduleId.includes("src/mail/view") || moduleId.includes("src/mail/export")) {
		return "mail-view"
	} else if (moduleId.includes("src/native/worker")) {
		return "worker"
	} else if (moduleId.includes("src/native/common")) {
		return "native-common"
	} else if (moduleId.includes("src/search")) {
		return "search"
	} else if (moduleId.includes("src/calendar/view")) {
		return "calendar-view"
	} else if (moduleId.includes("src/contacts")) {
		return "contacts"
	} else if (moduleId.includes("src/login/recover") || moduleId.includes("src/support") || moduleId.includes("src/login/contactform")) {
		// Collection of small UI components which are used not too often
		// Perhaps contact form should be separate
		// Recover things depends on HtmlEditor which we don't want to load on each login
		return "ui-extra"
	} else if (moduleId.includes("src/login")) {
		return "login"
	} else if (moduleId.includes("src/api/common") || moduleId.includes("src/api/entities")) {
		// things that are used in both worker and client
		// entities could be separate in theory but in practice they are anyway
		return "common"
	} else if (moduleId.includes("rollupPluginBabelHelpers") || moduleId.includes("commonjsHelpers")) {
		return "polyfill-helpers"
	} else if (moduleId.includes("src/settings") || moduleId.includes("src/subscription") || moduleId.includes("libs/qrcode")) {
		// subscription and settings depend on each other right now.
		// subscription is also a kitchen sink with signup, utils and views, we should break it up
		return "settings"
	} else if (moduleId.includes("src/api/worker")) {
		return "worker" // avoid that crypto stuff is only put into native
	} else if (moduleId.includes("libs/jszip")) {
		return "jszip"
	} else {
		// Put all translations into "translation-code"
		// Almost like in Rollup example: https://rollupjs.org/guide/en/#outputmanualchunks
		// This groups chunks but does not rename them for some reason so we do chunkFileNames below
		const match = /.*\/translations\/(\w+)+\.js/.exec(moduleId)
		if (match) {
			const language = match[1]
			return "translation-" + language
		}
	}
}

/**
 * Creates a plugin which checks that all imports satisfy the rules that are defined in {@link allowedImports}.
 */
export function bundleDependencyCheckPlugin() {
	return {
		name: "bundle-dependency-check",
		generateBundle(outOpts, bundle) {
			// retrieves getModule function from plugin context.
			const getModuleInfo = this.getModuleInfo.bind(this)

			for (const chunk of Object.values(bundle)) {
				for (const moduleId of Object.keys(chunk.modules)) {
					// Its a translation file and they are in their own chunks. We can skip further checks.
					if (moduleId.includes("src/translations")) {
						continue
					}
					const ownChunk = getChunkName(moduleId, {getModuleInfo})
					if (!allowedImports[ownChunk]) {
						throw new Error(`Unknown chunk: ${ownChunk} of ${moduleId}`)
					}

					for (const importedId of getModuleInfo(moduleId).importedIds) {
						// static dependencies on translation files are not allowed
						if (importedId.includes("src/translations")) {
							throw new Error(`Static dependency of ${importedId} is not allowed from ${moduleId}`)
						}
						const importedChunk = getChunkName(importedId, {getModuleInfo})
						if (!allowedImports[importedChunk]) {
							throw new Error(`Unknown chunk: ${importedChunk} of ${importedId}`)
						}
						if (ownChunk !== importedChunk && !allowedImports[ownChunk].includes(importedChunk)) {
							throw new Error(`${moduleId} (from ${ownChunk}) imports ${importedId} (from ${importedChunk}) which is not allowed`)
						}
					}
				}
			}
		}
	}
}