/**
 * Copies all currently used libraries from node_modules into libs.
 *
 * We do this to be able to audit changes in the libraries and not rely on npm for checksums.
 */
import fs from "fs-extra";
import path, {dirname} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url))

const clientDependencies = [
	"../node_modules/systemjs/dist/s.js",
	"../node_modules/bluebird/js/browser/bluebird.js",
	"../node_modules/mithril/mithril.js",
	"../node_modules/mithril/stream/stream.js",
	"../node_modules/squire-rte/build/squire-raw.js",
	"../node_modules/dompurify/dist/purify.js",
	"../node_modules/autolinker/dist/Autolinker.js",
	"../node_modules/luxon/build/cjs-browser/luxon.js",
]

run()

async function run() {
	await copyToLibs(clientDependencies)
}

async function copyToLibs(files) {
	for (let srcFile of files) {
		let targetName = ""
		if (srcFile instanceof Object) {
			targetName = srcFile.target
			srcFile = srcFile.src
		} else {
			targetName = path.basename(srcFile)
		}
		await fs.copy(path.join(__dirname, srcFile), path.join(__dirname, '../libs/', targetName))
	}
}