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
import { domainConfigs } from "./DomainConfigs.js"
import { visualizer } from "rollup-plugin-visualizer"
import { rollupWasmLoader } from "@tutao/tuta-wasm-loader"
import replace from "@rollup/plugin-replace"

/**
 * Builds the web app for production.
 * @param version Version of the app. Will be used for html generation and service worker versioning.
 * @param stage Deployment for which to build: 'prod' will build for the production system, 'test' for the test system, 'local' will use localhost.
 * @param host If stage is left undefined, the value provided here will be used to construct the app URL for HTML creation.
 * @param measure Function that returns the current elapsed build time.
 * @param minify Boolean. Set to true to perform minification.
 * @param projectDir Path to the tutanota root directory.
 * @param app App to build, 'mail' for mail app and 'calendar' for calendar app
 * @returns Nothing meaningful.
 */

export async function buildWebapp({ version, stage, host, measure, minify, projectDir, app }) {
	const isCalendarApp = app === "calendar"
	const tsConfig = isCalendarApp ? "tsconfig-calendar-app.json" : "tsconfig.json"
	const buildDir = isCalendarApp ? "build-calendar-app" : "build"
	const resolvedBuildDir = path.resolve(buildDir)
	const entryFile = isCalendarApp ? "src/calendar-app/calendar-app.ts" : "src/mail-app/app.ts"
	const workerFile = isCalendarApp ? "src/calendar-app/workerUtils/worker/calendar-worker.ts" : "src/mail-app/workerUtils/worker/mail-worker.ts"
	const powWorkerFile = "src/common/api/common/pow-worker.ts"
	const builtWorkerFile = isCalendarApp ? "calendar-worker.js" : "mail-worker.js"

	console.log("Building app", app)

	console.log("started cleaning", measure())
	await fs.emptyDir(buildDir)

	console.log("bundling polyfill", measure())
	const polyfillBundle = await rollup({
		input: ["src/polyfill.ts"],
		plugins: [
			typescript({
				tsconfig: tsConfig,
			}),
			minify && terser(),
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
		file: `${buildDir}/polyfill.js`,
	})

	console.log("started copying images", measure())
	await fs.copy(path.join(projectDir, "/resources/images"), path.join(projectDir, `/${buildDir}/images`))
	await fs.copy(path.join(projectDir, "/resources/favicon"), path.join(projectDir, `${buildDir}/images`))
	await fs.copy(path.join(projectDir, "/resources/pdf"), path.join(projectDir, `${buildDir}/pdf`))
	await fs.copy(path.join(projectDir, "/resources/wordlibrary.json"), path.join(projectDir, `${buildDir}/wordlibrary.json`))
	await fs.copy(path.join(projectDir, "/src/braintree.html"), path.join(projectDir, `/${buildDir}/braintree.html`))

	console.log("started bundling", measure())
	const bundle = await rollup({
		input: [entryFile, workerFile, powWorkerFile],
		preserveEntrySignatures: false,
		perf: true,
		plugins: [
			typescript({
				tsconfig: tsConfig,
			}),
			resolveLibs(),
			commonjs({
				exclude: "src/**",
			}),
			minify && terser(),
			analyzer(projectDir, buildDir),
			visualizer({ filename: `${buildDir}/stats.html`, gzipSize: true }),
			bundleDependencyCheckPlugin(),
			replace({
				// see AppType in src/common/misc/ClientConstants.ts
				APP_TYPE: JSON.stringify(app === "calendar" ? "2" : "1"),
			}),
			nodeResolve({
				preferBuiltins: true,
				resolveOnly: [/^@tutao\/.*$/],
			}),
			rollupWasmLoader({
				webassemblyLibraries: [
					{
						name: "liboqs.wasm",
						command: "make -f Makefile_liboqs build",
						workingDir: "libs/webassembly/",
						outputPath: path.join(resolvedBuildDir, "wasm/liboqs.wasm"),
						fallback: {
							command: "make -f Makefile_liboqs fallback",
							workingDir: "libs/webassembly/",
							outputPath: path.join(resolvedBuildDir, "wasm/liboqs.js"),
						},
					},
					{
						name: "argon2.wasm",
						command: "make -f Makefile_argon2 build fallback",
						workingDir: "libs/webassembly/",
						outputPath: path.join(resolvedBuildDir, "wasm/argon2.wasm"),
						fallback: {
							command: "make -f Makefile_argon2 fallback",
							workingDir: "libs/webassembly/",
							outputPath: path.join(resolvedBuildDir, "wasm/argon2.js"),
						},
					},
				],
			}),
		],
	})

	console.log("bundling timings: ")
	for (let [k, v] of Object.entries(bundle.getTimings())) {
		console.log(k, v[0])
	}
	console.log("started writing bundles into", buildDir, measure())
	const output = await bundle.write({
		sourcemap: true,
		format: "esm",
		dir: buildDir,
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
		`${buildDir}/worker-bootstrap.js`,
		`import "./polyfill.js"
import "./${builtWorkerFile}"`,
	)

	let restUrl
	let networkDebugging
	if (stage === "test") {
		restUrl = "https://app.test.tuta.com"
		networkDebugging = false
	} else if (stage === "prod") {
		restUrl = "https://app.tuta.com"
		networkDebugging = false
	} else if (stage === "local") {
		restUrl = "http://" + os.hostname() + ":9000"
		networkDebugging = true
	} else if (stage === "release") {
		restUrl = undefined
		networkDebugging = false
	} else {
		// host
		restUrl = host
		networkDebugging = true
	}
	await createHtml(
		env.create({
			staticUrl: stage === "release" || stage === "local" ? null : restUrl,
			version,
			mode: "Browser",
			dist: true,
			domainConfigs,
			networkDebugging,
		}),
		app,
	)
	if (stage !== "release") {
		await createHtml(env.create({ staticUrl: restUrl, version, mode: "App", dist: true, domainConfigs, networkDebugging }), app)
	}

	await bundleServiceWorker(chunks, version, minify, buildDir, tsConfig)
}

/**
 * @param bundles {string[]}
 * @param version {string}
 * @param minify {boolean}
 * @param buildDir {string}
 * @param tsConfig {string}
 * @returns {Promise<void>}
 */
async function bundleServiceWorker(bundles, version, minify, buildDir, tsConfig) {
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
		input: ["src/common/serviceworker/sw.ts"],
		plugins: [
			typescript({
				tsconfig: tsConfig,
			}),
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
		file: `${buildDir}/sw.js`,
	})
}

/**
 * A little plugin to:
 *  - Print out each chunk size and contents
 *  - Create a graph file with chunk dependencies.
 */
function analyzer(projectDir, buildDir) {
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
					if (module.includes("src/common/api/entities")) {
						continue
					}
					const moduleName = module.startsWith(prefix) ? module.substring(prefix.length) : module
					console.log("\t" + moduleName)
				}
			}

			buffer += "}\n"
			await fs.writeFile(`${buildDir}/bundles.dot`, buffer)
		},
	}
}
