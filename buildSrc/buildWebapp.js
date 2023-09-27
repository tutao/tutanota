/**
	Exports the buildWebapp function that can be used for production builds.
 */
import { rollup } from "rollup"
import typescript from "@rollup/plugin-typescript"
import terser from "@rollup/plugin-terser"
import path from "node:path"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import fs from "fs-extra"
import { bundleDependencyCheckPlugin, getChunkName, resolveLibs } from "./RollupConfig.js"
import os from "node:os"
import * as env from "./env.js"
import { createHtml } from "./createHtml.js"

/**
 * Builds the web app for production.
 * @param version Version of the app. Will be used for html generation and service worker versioning.
 * @param stage Deployment for which to build: 'prod' will build for the production system, 'test' for the test system, 'local' will use localhost.
 * @param host If stage is left undefined, the value provided here will be used to construct the app URL for HTML creation.
 * @param measure Function that returns the current elapsed build time.
 * @param minify Boolean. Set to true to perform minification.
 * @param projectDir Path to the tutanota root directory.
 * @returns Nothing meaningful.
 */

export async function buildWebapp({ version, stage, host, measure, minify, projectDir }) {
	console.log("started cleaning", measure())
	await fs.emptyDir("build")

	console.log("bundling polyfill", measure())
	const polyfillBundle = await rollup({
		input: ["src/polyfill.ts"],
		plugins: [
			typescript(),
			minify && terser(),
			{
				name: "append-libs",
				resolveId(id) {
					if (id === "systemjs") {
						return path.resolve("libs/s.js")
					}
				},
			},
			// nodeResolve is for our own modules
			nodeResolve({
				preferBuiltins: true,
				resolveOnly: [/^@tutao\/.*$/],
			}),
			commonjs(),
		],
	})
	await polyfillBundle.write({
		sourcemap: false,
		format: "iife",
		file: "build/dist/polyfill.js",
	})

	console.log("started copying images", measure())
	await fs.copy(path.join(projectDir, "/resources/images"), path.join(projectDir, "/build/dist/images"))
	await fs.copy(path.join(projectDir, "/resources/favicon"), path.join(projectDir, "build/dist/images"))
	await fs.copy(path.join(projectDir, "/resources/wordlibrary.json"), path.join(projectDir, "build/dist/wordlibrary.json"))
	await fs.copy(path.join(projectDir, "/src/braintree.html"), path.join(projectDir, "/build/dist/braintree.html"))

	const wasmDir = path.join(projectDir, "/build/dist/wasm")
	await fs.emptyDir(wasmDir)
	await fs.copy(path.join(projectDir, "/packages/tutanota-crypto/lib/hashes/Argon2id/argon2.wasm"), path.join(wasmDir, "argon2.wasm"))
	await fs.copy(path.join(projectDir, "/packages/tutanota-crypto/lib/encryption/Liboqs/liboqs.wasm"), path.join(wasmDir, "liboqs.wasm"))

	console.log("started bundling", measure())
	const bundle = await rollup({
		input: ["src/app.ts", "src/api/worker/worker.ts"],
		preserveEntrySignatures: false,
		perf: true,
		plugins: [
			typescript({}),
			resolveLibs(),
			commonjs({
				exclude: "src/**",
			}),
			minify && terser(),
			analyzer(projectDir),
			bundleDependencyCheckPlugin(),
			nodeResolve({
				preferBuiltins: true,
				resolveOnly: [/^@tutao\/.*$/],
			}),
		],
	})

	console.log("bundling timings: ")
	for (let [k, v] of Object.entries(bundle.getTimings())) {
		console.log(k, v[0])
	}
	console.log("started writing bundles", measure())
	const output = await bundle.write({
		sourcemap: true,
		format: "system",
		dir: "build/dist",
		manualChunks(id, { getModuleInfo, getModuleIds }) {
			return getChunkName(id, { getModuleInfo })
		},
		chunkFileNames: (chunkInfo) => {
			return "[name]-[hash].js"
		},
	})
	const chunks = output.output.map((c) => c.fileName)

	// we have to use System.import here because bootstrap is not executed until we actually import()
	// unlike nollup+es format where it just runs on being loaded like you expect
	await fs.promises.writeFile(
		"build/dist/worker-bootstrap.js",
		`importScripts("./polyfill.js")
const importPromise = System.import("./worker.js")
self.onmessage = function (msg) {
	importPromise.then(function () {
		self.onmessage(msg)
	})
}
`,
	)

	let restUrl
	if (stage === "test") {
		restUrl = "https://test.tutanota.com"
	} else if (stage === "prod") {
		restUrl = "https://mail.tutanota.com"
	} else if (stage === "local") {
		restUrl = "http://" + os.hostname() + ":9000"
	} else if (stage === "release") {
		restUrl = undefined
	} else {
		// host
		restUrl = host
	}
	await createHtml(
		env.create({
			staticUrl: stage === "release" || stage === "local" ? null : restUrl,
			version,
			mode: "Browser",
			dist: true,
		}),
	)
	if (stage !== "release") {
		await createHtml(env.create({ staticUrl: restUrl, version, mode: "App", dist: true }))
	}

	await bundleServiceWorker(chunks, version, minify)
}

async function bundleServiceWorker(bundles, version, minify) {
	const customDomainFileExclusions = ["index.html", "index.js"]
	const filesToCache = ["index.js", "index.html", "polyfill.js", "worker-bootstrap.js"]
		// we always include English
		// we still cache native-common even though we don't need it because worker has to statically depend on it
		.concat(
			bundles.filter(
				(it) =>
					it.startsWith("translation-en") ||
					(!it.startsWith("translation") && !it.startsWith("native-main") && !it.startsWith("SearchInPageOverlay")),
			),
		)
		.concat(["images/logo-favicon.png", "images/logo-favicon-152.png", "images/logo-favicon-196.png", "images/font.ttf"])
	const swBundle = await rollup({
		input: ["src/serviceworker/sw.ts"],
		plugins: [
			typescript(),
			minify && terser(),
			{
				name: "sw-banner",
				banner() {
					return `function filesToCache() { return ${JSON.stringify(filesToCache)} }
					function version() { return "${version}" }
					function customDomainCacheExclusions() { return ${JSON.stringify(customDomainFileExclusions)} }`
				},
			},
		],
	})
	await swBundle.write({
		sourcemap: true,
		format: "iife",
		file: "build/dist/sw.js",
	})
}

/**
 * A little plugin to:
 *  - Print out each chunk size and contents
 *  - Create a graph file with chunk dependencies.
 */
function analyzer(projectDir) {
	return {
		name: "analyze",
		async generateBundle(outOpts, bundle) {
			const prefix = projectDir
			let buffer = "digraph G {\n"
			buffer += "edge [dir=back]\n"

			for (const [fileName, info] of Object.entries(bundle)) {
				if (fileName.startsWith("translation")) continue
				// https://www.rollupjs.org/plugin-development/#generatebundle
				if (info.type === "asset") continue
				for (const dep of info.imports) {
					if (!dep.includes("translation")) {
						buffer += `"${dep}" -> "${fileName}"\n`
					}
				}

				console.log(fileName, "", info.code.length / 1024 + "K")
				for (const module of Object.keys(info.modules)) {
					if (module.includes("src/api/entities")) {
						continue
					}
					const moduleName = module.startsWith(prefix) ? module.substring(prefix.length) : module
					console.log("\t" + moduleName)
				}
			}

			buffer += "}\n"
			await fs.writeFile("build/bundles.dot", buffer)
		},
	}
}
