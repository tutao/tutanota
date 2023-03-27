import path from "path"

// These are the dependencies that must be provided for the module loader systemjs
export const dependencyMap = {
	mithril: path.normalize("./libs/mithril.js"),
	"mithril/stream": path.normalize("./libs/stream.js"),
	"squire-rte": path.normalize("./libs/squire-raw.mjs"),
	dompurify: path.normalize("./libs/purify.js"),
	"qrcode-svg": path.normalize("./libs/qrcode.js"),
	jszip: path.normalize("./libs/jszip.js"),
	luxon: path.normalize("./libs/luxon.js"),
	linkifyjs: path.normalize("./libs/linkify.js"),
	"linkifyjs/html": path.normalize("./libs/linkify-html.js"),
	cborg: path.normalize("./libs/cborg.js"),
}

/**
 * These are the definitions of chunks with static dependencies. Key is the chunk and values are dependencies to other chunks
 */
export const allowedImports = {
	"polyfill-helpers": [],
	"common-min": ["polyfill-helpers"],
	boot: ["polyfill-helpers", "common-min"],
	common: ["polyfill-helpers", "common-min"],
	"gui-base": ["polyfill-helpers", "common-min", "common", "boot"],
	main: ["polyfill-helpers", "common-min", "common", "boot", "gui-base"],
	sanitizer: ["polyfill-helpers", "common-min", "common", "boot", "gui-base"],
	date: ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "sharing"],
	"mail-view": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main"],
	"mail-editor": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "mail-view", "sanitizer", "sharing"],
	search: ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "mail-view", "contacts", "date"],
	// ContactMergeView needs HtmlEditor even though ContactEditor doesn't?
	contacts: ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "mail-view", "date", "mail-editor"],
	"calendar-view": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "date", "sharing"],
	login: ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main"],
	worker: ["polyfill-helpers", "common-min", "common", "native-common", "native-worker"],
	settings: [
		"polyfill-helpers",
		"common-min",
		"common",
		"boot",
		"gui-base",
		"main",
		"contacts",
		"sanitizer",
		"mail-editor",
		"mail-view",
		"date",
		"login",
		"sharing",
	],
	"ui-extra": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "settings", "contacts", "sanitizer", "login", "mail-editor"],
	sharing: ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main"],
	"native-common": ["polyfill-helpers", "common-min", "common"],
	"native-main": ["polyfill-helpers", "common-min", "common", "boot", "gui-base", "main", "native-common", "login"],
	"native-worker": ["polyfill-helpers", "common-min", "common"],
	jszip: ["polyfill-helpers"],
	"worker-lazy": ["common-min", "common", "worker", "worker-search"],
	"worker-search": ["common-min", "common", "worker", "worker-lazy"],
	linkify: [],
}

export function resolveLibs(baseDir = ".") {
	return {
		name: "resolve-libs",
		resolveId(source) {
			const resolved = dependencyMap[source]
			return resolved && path.join(baseDir, resolved)
		},
	}
}

/**
 * Returns the chunk name for the given moduleId which is usually the file path.
 * @param moduleId Rollup moduleId usually the file path.
 * @param getModuleInfo Helper function to get information about the ES module.
 * @returns {string} Chunk name
 */
export function getChunkName(moduleId, { getModuleInfo }) {
	// See HACKING.md for rules
	const moduleInfo = getModuleInfo(moduleId)
	const code = moduleInfo.code
	if (code == null) {
		console.log("SYNTHETIC MODULE??", moduleId)
	}

	function isIn(subpath) {
		return moduleId.includes(path.normalize(subpath))
	}

	if (code.includes("@bundleInto:common-min") || isIn("libs/stream") || isIn("packages/tutanota-utils")) {
		return "common-min"
	} else if (code.includes("assertMainOrNodeBoot") || isIn("libs/mithril") || isIn("src/app.ts") || code.includes("@bundleInto:boot")) {
		// everything marked as assertMainOrNodeBoot goes into boot bundle right now
		// (which is getting merged into app.js)
		return "boot"
	} else if (isIn("src/gui/date") || isIn("src/misc/DateParser") || moduleId.includes("luxon") || isIn("src/calendar/date") || isIn("src/calendar/export")) {
		// luxon and everything that depends on it goes into date bundle
		return "date"
	} else if (isIn("src/misc/HtmlSanitizer") || isIn("libs/purify")) {
		return "sanitizer"
	} else if (isIn("src/gui/base")) {
		// these gui elements are used from everywhere
		return "gui-base"
	} else if (isIn("src/native/main") || moduleId.includes("SearchInPageOverlay")) {
		return "native-main"
	} else if (
		isIn("src/mail/editor") ||
		moduleId.includes("squire") ||
		isIn("src/gui/editor") ||
		isIn("src/mail/signature") ||
		isIn("src/templates") ||
		isIn("src/knowledgebase") ||
		isIn("src/mail/press")
	) {
		// squire is most often used with mail editor and they are both not too big so we merge them
		return "mail-editor"
	} else if (
		isIn("src/api/main") ||
		isIn("src/mail/model") ||
		isIn("src/contacts/model") ||
		isIn("src/calendar/model") ||
		isIn("src/search/model") ||
		isIn("src/misc/ErrorHandlerImpl") ||
		isIn("src/misc") ||
		isIn("src/file") ||
		isIn("src/gui") ||
		moduleId.includes(path.normalize("packages/tutanota-usagetests"))
	) {
		// Things which we always need for main thread anyway, at least currently
		return "main"
	} else if (isIn("src/mail/view") || isIn("src/mail/export")) {
		return "mail-view"
	} else if (isIn("src/native/worker")) {
		return "worker"
	} else if (isIn("src/native/common")) {
		return "native-common"
	} else if (isIn("src/search")) {
		return "search"
	} else if (isIn("src/calendar/view")) {
		return "calendar-view"
	} else if (isIn("src/contacts")) {
		return "contacts"
	} else if (isIn("src/login/recover") || isIn("src/support") || isIn("src/login/contactform")) {
		// Collection of small UI components which are used not too often
		// Perhaps contact form should be separate
		// Recover things depends on HtmlEditor which we don't want to load on each login
		return "ui-extra"
	} else if (isIn("src/login")) {
		return "login"
	} else if (
		isIn("src/api/common") ||
		isIn("src/api/entities") ||
		isIn("src/desktop/config/ConfigKeys") ||
		moduleId.includes("cborg") ||
		isIn("src/offline")
	) {
		// things that are used in both worker and client
		// entities could be separate in theory but in practice they are anyway
		return "common"
	} else if (moduleId.includes("rollupPluginBabelHelpers") || moduleId.includes("commonjsHelpers") || moduleId.includes("tslib")) {
		return "polyfill-helpers"
	} else if (isIn("src/settings") || isIn("src/subscription") || isIn("libs/qrcode") || isIn("src/termination")) {
		// subscription and settings depend on each other right now.
		// subscription is also a kitchen sink with signup, utils and views, we should break it up
		return "settings"
	} else if (isIn("src/sharing")) {
		return "sharing"
	} else if (isIn("src/api/worker/facades/lazy")) {
		// things that are not used for login and are generally accessed occasionally
		return "worker-lazy"
	} else if (isIn("src/api/worker/search")) {
		// things related to indexer or search
		return "worker-search"
	} else if (isIn("src/api/worker/Urlifier") || isIn("libs/linkify") || isIn("libs/linkify-html")) {
		return "linkify"
	} else if (isIn("src/api/worker") || moduleId.includes(path.normalize("packages/tutanota-crypto"))) {
		return "worker" // avoid that crypto stuff is only put into native
	} else if (isIn("libs/jszip")) {
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
					const ownChunk = getChunkName(moduleId, { getModuleInfo })
					if (!allowedImports[ownChunk]) {
						unknownChunks.push(`${ownChunk} of ${moduleId}`)
					}

					for (const importedId of getModuleInfo(moduleId).importedIds) {
						// static dependencies on translation files are not allowed
						if (importedId.includes(path.normalize("src/translations"))) {
							pushToMapEntry(staticLangImports, moduleId, importedId)
						}
						const importedChunk = getChunkName(importedId, { getModuleInfo })
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
		},
	}
}
