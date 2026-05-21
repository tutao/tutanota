import path from "node:path"

/**
 * These are the vendored dependencies. This map is to help bundler find the resolved path.
 * Must stay in sync with ./updateLibs.js
 */
export const dependencyMap = {
	mithril: path.normalize("./libs/mithril.js"),
	"mithril/stream": path.normalize("./libs/stream.js"),
	"squire-rte": path.normalize("./libs/squire-raw.mjs"),
	dompurify: path.normalize("./libs/purify.js"),
	"qrcode-svg": path.normalize("./libs/qrcode.js"),
	jszip: path.normalize("./libs/jszip.js"),
	luxon: path.normalize("./libs/luxon.js"),
	linkifyjs: path.normalize("./libs/linkify.js"),
	"linkify-html": path.normalize("./libs/linkify-html.js"),
	cborg: path.normalize("./libs/cborg.js"),
	// below this, the modules are only running in the desktop main thread.
	"electron-updater": path.normalize("./libs/electron-updater.mjs"),
	undici: path.normalize("./libs/undici.mjs"),
	jsqr: path.normalize("./libs/jsQR.js"),
	"@signalapp/sqlcipher": path.normalize("./libs/node-sqlcipher.mjs"),
	"@fingerprintjs/botd": path.normalize("./libs/botd.mjs"),
	"./tensorflow-custom": path.normalize("./libs/tensorflow.js"),
}

export let tsImportAliases = {
	"@tutao/utils": path.normalize("build/utils/index.js"),
	"@tutao/crypto": path.normalize("build/crypto/index.js"),
	"@tutao/crypto/error": path.normalize("build/crypto/error.js"),
	"@tutao/usagetests": path.normalize("build/usagetests/index.js"),
	"@tutao/mimimi": path.normalize("build/mimimi/binding.js"),
	"@tutao/rest-client": path.normalize("build/rest-client/index.js"),
	"@tutao/rest-client/error": path.normalize("build/rest-client/error.js"),
	"@tutao/app-env": path.normalize("build/app-env/index.js"),
	"@tutao/typerefs": path.normalize("build/meta/index.js"),
	"@tutao/instance-pipeline": path.normalize("build/instance-pipeline/index.js"),
	"@tutao/native-bridge/common": path.normalize("build/native-bridge/common/index.js"),
	"@tutao/native-bridge/worker": path.normalize("build/native-bridge/worker/index.js"),
	"@tutao/native-bridge/main": path.normalize("build/native-bridge/main/index.js"),
	"@tutao/native-bridge/shared": path.normalize("build/native-bridge/shared/index.js"),
	"@tutao/native-bridge/generatedIpc/types": path.normalize("build/native-bridge/common/generatedipc/types/index.js"),
	"@tutao/local-store": path.normalize("build/local-store/index.js"),
	"@tutao/network": path.normalize("build/network/index.js"),
}

/** resolves certain imports to vendored libraries for the dist build */
export function resolveLibs(baseDir = ".", extraDependenciesMap = {}) {
	return {
		name: "resolve-libs",
		resolveId(source) {
			const value = dependencyMap[source] ?? tsImportAliases[source] ?? extraDependenciesMap[source]
			if (!value) return null
			const id = path.join(baseDir, value)
			return { id, resolvedBy: this.name }
		},
	}
}
