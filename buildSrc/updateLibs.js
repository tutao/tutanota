/**
 * Copies all currently used libraries from node_modules into libs.
 *
 * We do this to be able to audit changes in the libraries and not rely on npm for checksums.
 */
import fs from "fs-extra"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { rollup } from "rollup"
import commonjs from "@rollup/plugin-commonjs"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import json from "@rollup/plugin-json"

const __dirname = dirname(fileURLToPath(import.meta.url))

/*
 * Each entry is one of:
 *  - string: will be copied from specified to libs preserving the file name
 *  - object with:
 *     - src: path to file
 *     - target: resulting file name
 *     - rollup: if truthy will use src as input for rollup, otherwise just copy
 */
const clientDependencies = [
	"../node_modules/systemjs/dist/s.js",
	"../node_modules/mithril/mithril.js",
	"../node_modules/mithril/stream/stream.js",
	"../node_modules/squire-rte/dist/squire-raw.mjs",
	"../node_modules/dompurify/dist/purify.js",
	{ src: "../node_modules/linkifyjs/dist/linkify.module.js", target: "linkify.js" },
	{ src: "../node_modules/linkifyjs/dist/linkify-html.module.js", target: "linkify-html.js" },
	"../node_modules/luxon/build/es6/luxon.js",
	{ src: "../node_modules/cborg/esm/cborg.js", target: "cborg.js", rollup: true },
	{ src: "../node_modules/imapflow/lib/imap-flow.js", target: "imapflow.js", rollup: true },
	{ src: "../node_modules/mailparser/lib/mail-parser.js", target: "mailparser.js", rollup: true },
]

run()

async function run() {
	await copyToLibs(clientDependencies)
}

async function copyToLibs(files) {
	for (let srcFile of files) {
		let targetName = ""
		if (srcFile instanceof Object) {
			if (srcFile.rollup) {
				await roll(srcFile.src, srcFile.target)
				continue
			} else {
				targetName = srcFile.target
				srcFile = srcFile.src
			}
		} else {
			targetName = path.basename(srcFile)
		}
		await fs.copy(path.join(__dirname, srcFile), path.join(__dirname, "../libs/", targetName))
	}
}

/** Will bundle starting at {@param src} into a single file at {@param target}. */
async function roll(src, target) {
	const bundle = await rollup({
		input: path.join(__dirname, src),
		plugins: [json(), commonjs(), nodeResolve({ preferBuiltins: true })],
	})
	await bundle.write({ file: path.join(__dirname, "../libs", target) })
}
