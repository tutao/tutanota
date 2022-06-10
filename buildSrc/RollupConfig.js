import path from "path"

// These are the dependencies that must be provided for the module loader systemjs
export const dependencyMap = {
	"mithril": path.normalize("./libs/mithril.js"),
	"mithril/stream": path.normalize("./libs/stream.js"),
	"squire-rte": path.normalize("./libs/squire-raw.js"),
	"dompurify": path.normalize("./libs/purify.js"),
	"qrcode-svg": path.normalize("./libs/qrcode.js"),
	"jszip": path.normalize("./libs/jszip.js"),
	"luxon": path.normalize("./libs/luxon.js"),
	"linkifyjs": path.normalize("./libs/linkify.js"),
	"linkifyjs/html": path.normalize("./libs/linkify-html.js"),
	"cborg": path.normalize("./libs/cborg.js")
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
	"sanitizer": ["polyfill-helpers", "common-min", "common", "boot", "gui-base"],
	"date": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "sharing"],
	"mail-view": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main"],
	"mail-editor": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "mail-view", "sanitizer", "sharing"],
	"search": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "mail-view", "contacts", "date"],
	// ContactMergeView needs HtmlEditor even though ContactEditor doesn't?
	"contacts": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "mail-view", "date", "mail-editor"],
	"calendar-view": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "date", "sharing"],
	"login": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main",],
	"worker": ["polyfill-helpers", "common-min", "common", "native-common", "native-worker"],
	"settings": [
		"polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "contacts", "sanitizer", "mail-editor", "mail-view", "date",
		"login", "sharing"
	],
	"ui-extra": [
		"polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "settings", "contacts", "sanitizer", "login", "mail-editor"
	],
	"sharing": [
		"polyfill-helpers", "common-min", "common", "boot", "gui-base", "main"
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
	const moduleInfo = getModuleInfo(moduleId)
	const code = moduleInfo.code
	if (code == null) {
		console.log("SYNTHETIC MODULE??", moduleId)
	}
	if (
		code.includes("@bundleInto:common-min")
		|| moduleId.includes(path.normalize("libs/stream"))
		|| moduleId.includes(path.normalize("packages/tutanota-utils"))
	) {
		return "common-min"
	} else if (code.includes("assertMainOrNodeBoot") ||
		moduleId.includes(path.normalize("libs/mithril")) ||
		moduleId.includes(path.normalize("src/app.ts")) ||
		code.includes("@bundleInto:boot")
	) {
		// everything marked as assertMainOrNodeBoot goes into boot bundle right now
		// (which is getting merged into app.js)
		return "boot"
	} else if (moduleId.includes(path.normalize("src/gui/date")) ||
		moduleId.includes(path.normalize("src/misc/DateParser")) ||
		moduleId.includes("luxon") ||
		moduleId.includes(path.normalize("src/calendar/date")) ||
		moduleId.includes(path.normalize("src/calendar/export"))
	) {
		// luxon and everything that depends on it goes into date bundle
		return "date"
	} else if (moduleId.includes(path.normalize("src/misc/HtmlSanitizer")) || moduleId.includes(path.normalize("libs/purify"))) {
		return "sanitizer"
	} else if (moduleId.includes(path.normalize("src/gui/base"))) {
		// these gui elements are used from everywhere
		return "gui-base"
	} else if (moduleId.includes(path.normalize("src/native/main")) || moduleId.includes("SearchInPageOverlay")) {
		return "native-main"
	} else if (moduleId.includes(path.normalize("src/mail/editor")) ||
		moduleId.includes("squire") ||
		moduleId.includes(path.normalize("src/gui/editor")) ||
		moduleId.includes(path.normalize("src/mail/signature")) ||
		moduleId.includes(path.normalize("src/templates")) ||
		moduleId.includes(path.normalize("src/knowledgebase")) ||
		moduleId.includes(path.normalize("src/mail/press"))
	) {
		// squire is most often used with mail editor and they are both not too big so we merge them
		return "mail-editor"
	} else if (
		moduleId.includes(path.normalize("src/api/main")) ||
		moduleId.includes(path.normalize("src/mail/model")) ||
		moduleId.includes(path.normalize("src/contacts/model")) ||
		moduleId.includes(path.normalize("src/calendar/model")) ||
		moduleId.includes(path.normalize("src/search/model")) ||
		moduleId.includes(path.normalize("src/misc/ErrorHandlerImpl")) ||
		moduleId.includes(path.normalize("src/misc")) ||
		moduleId.includes(path.normalize("src/file")) ||
		moduleId.includes(path.normalize("src/gui")) ||
		moduleId.includes(path.normalize("packages/tutanota-usagetests"))
	) {
		// Things which we always need for main thread anyway, at least currently
		return "main"
	} else if (moduleId.includes(path.normalize("src/mail/view")) || moduleId.includes(path.normalize("src/mail/export"))) {
		return "mail-view"
	} else if (moduleId.includes(path.normalize("src/native/worker"))
		|| moduleId.includes(path.normalize("libs/linkify"))
		|| moduleId.includes(path.normalize("libs/linkify-html"))) {
		return "worker"
	} else if (moduleId.includes(path.normalize("src/native/common"))) {
		return "native-common"
	} else if (moduleId.includes(path.normalize("src/search"))) {
		return "search"
	} else if (moduleId.includes(path.normalize("src/calendar/view"))) {
		return "calendar-view"
	} else if (moduleId.includes(path.normalize("src/contacts"))) {
		return "contacts"
	} else if (moduleId.includes(path.normalize("src/login/recover"))
		|| moduleId.includes(path.normalize("src/support"))
		|| moduleId.includes(path.normalize("src/login/contactform"))) {
		// Collection of small UI components which are used not too often
		// Perhaps contact form should be separate
		// Recover things depends on HtmlEditor which we don't want to load on each login
		return "ui-extra"
	} else if (moduleId.includes(path.normalize("src/login"))) {
		return "login"
	} else if (moduleId.includes(path.normalize("src/api/common"))
		|| moduleId.includes(path.normalize("src/api/entities"))
		|| moduleId.includes(path.normalize("src/desktop/config/ConfigKeys"))
		|| moduleId.includes("cborg")
		|| moduleId.includes(path.normalize("src/offline"))
	) {
		// things that are used in both worker and client
		// entities could be separate in theory but in practice they are anyway
		return "common"
	} else if (moduleId.includes("rollupPluginBabelHelpers") || moduleId.includes("commonjsHelpers") || moduleId.includes("tslib")) {
		return "polyfill-helpers"
	} else if (moduleId.includes(path.normalize("src/settings")) ||
		moduleId.includes(path.normalize("src/subscription")) ||
		moduleId.includes(path.normalize("libs/qrcode"))) {
		// subscription and settings depend on each other right now.
		// subscription is also a kitchen sink with signup, utils and views, we should break it up
		return "settings"
	} else if (moduleId.includes(path.normalize("src/sharing"))) {
		return "sharing"
	} else if (moduleId.includes(path.normalize("src/api/worker"))
		|| moduleId.includes(path.normalize("packages/tutanota-crypto"))) {
		return "worker" // avoid that crypto stuff is only put into native
	} else if (moduleId.includes(path.normalize("libs/jszip"))) {
		return "jszip"
	} else {
		// Put all translations into "translation-code"
		// Almost like in Rollup example: https://rollupjs.org/guide/en/#outputmanualchunks
		// This groups chunks but does not rename them for some reason so we do chunkFileNames below
		const match = /.*[\\|\/]translations[\\|\/](\w+)+\.ts/.exec(moduleId)
		if (match) {
			const language = match[1]
			return "translation-" + language
		}
	}
}

function pushToMapEntry(map, key, value) {
	let entry = []
	if (map.has(key)) {
		entry = map.get(key)
	}
	entry.push(value)
	map.set(key, entry)
}

/**
 * Creates a plugin which checks that all imports satisfy the rules that are defined in {@link allowedImports}.
 */
export function bundleDependencyCheckPlugin() {
	const illegalImports = new Map()
	const staticLangImports = new Map()
	const unknownChunks = []

	const reportErrors = () => {
		let shouldThrow = false
		if (illegalImports.size > 0) {
			console.log("\nIllegal imports:")
			shouldThrow = true
			for (const [importer, importees] of Array.from(illegalImports.entries()).filter(([_, importees]) => importees.length > 0)) {
				console.log(`\n in ${importer}:`)
				for (const importee of importees) {
					console.log("\t", importee)
				}
			}
		}

		if (staticLangImports.size > 0) {
			console.log(shouldThrow ? "\n" : "", "Illegal static translation file dependencies:")
			shouldThrow = true
			for (const [importer, importees] of Array.from(staticLangImports.entries()).filter(([_, importees]) => importees.length > 0)) {
				console.log(`\n in ${importer}:`)
				for (const importee of importees) {
					console.log("\t", importee)
				}
			}
		}

		if (unknownChunks.length > 0) {
			console.log(shouldThrow ? "\n" : "", "Unknown chunks:")
			shouldThrow = true
			for (const unknownChunk of unknownChunks) {
				console.log("\t", unknownChunk)
			}
		}

		if (shouldThrow) throw new Error("fix illegal imports or unknown chunks (see above) and rerun")
	}

	return {
		name: "bundle-dependency-check",
		generateBundle(outOpts, bundle) {
			// retrieves getModule function from plugin context.
			const getModuleInfo = this.getModuleInfo.bind(this)

			for (const chunk of Object.values(bundle)) {
				if (!chunk || !chunk.modules) {
					continue
				}
				for (const moduleId of Object.keys(chunk.modules)) {
					// Its a translation file and they are in their own chunks. We can skip further checks.
					if (moduleId.includes(path.normalize("src/translations"))) {
						continue
					}
					const ownChunk = getChunkName(moduleId, {getModuleInfo})
					if (!allowedImports[ownChunk]) {
						unknownChunks.push(`${ownChunk} of ${importedId}`)
					}

					for (const importedId of getModuleInfo(moduleId).importedIds) {
						// static dependencies on translation files are not allowed
						if (importedId.includes(path.normalize("src/translations"))) {
							pushToMapEntry(staticLangImports, moduleId, importedId)
						}
						const importedChunk = getChunkName(importedId, {getModuleInfo})
						if (!allowedImports[importedChunk]) {
							unknownChunks.push(`${importedChunk} of ${importedId}`)
						}
						if (ownChunk !== importedChunk && !allowedImports[ownChunk].includes(importedChunk)) {
							pushToMapEntry(illegalImports, `${moduleId} [${ownChunk}]`, `${importedId} [${importedChunk}]`)
						}
					}
				}
			}

			reportErrors()
		}
	}
}