import { default as path } from "path"
import fs from "fs-extra"

export function nativeDepWorkaroundPlugin() {
	return {
		name: "native-dep-workaround",
		resolveId(id) {
			// It's included in the build by electron builder, consider it external
			if (id === "electron") {
				return false
			}
			// There are issues with packaging it so we include it as unprocessed cjs. It doesn't tree-shake well anyway.
			if (id === "electron-updater") {
				return false
			}
			// We currently have an import in Rsa.js which we don't want in Desktop as it pulls the whole worker with it
			if (id.endsWith("RsaApp")) {
				return false
			}
		},
	}
}

/**
 * This plugin loads native node module (.node extension).
 * This is not general enough yet, it only works in commonjs and it doesn't use ROLLUP_ASSET_URL.
 * This will also not work with async imports.
 *
 * Important! Make sure that requireReturnsDefault for commonjs plugin is set to `true` or `"preferred"` if .node module is part of
 * commonjs code.
 */
export function pluginNativeLoader() {
	return {
		name: "native-loader",
		async load(id) {
			if (id.endsWith(".node")) {
				const name = path.basename(id)
				const content = await fs.promises.readFile(id)
				this.emitFile({
					type: "asset",
					name,
					fileName: name,
					source: content,
				})
				return `
				const nativeModule = require('./${name}')
				export default nativeModule`
			}
		},
	}
}
