import * as env from "../buildSrc/env.js"
import fs from "fs-extra"
import path from "node:path"
import { renderHtml } from "../buildSrc/LaunchHtml.js"
import { build as esbuild } from "esbuild"
import { getTutanotaAppVersion, runStep, writeFile } from "../buildSrc/buildUtils.js"
import { aliasPath as esbuildPluginAliasPath } from "esbuild-plugin-alias-path"
import { libDeps, preludeEnvPlugin, sqliteNativePlugin } from "../buildSrc/esbuildUtils.js"
import { buildPackages } from "../buildSrc/packageBuilderFunctions.js"
import { domainConfigs } from "../buildSrc/DomainConfigs.js"
import { sh } from "../buildSrc/sh.js"

export async function runTestBuild({ clean, fast = false }) {
	if (clean) {
		await runStep("Clean", async () => {
			await fs.emptyDir("build")
		})
	}

	if (!fast) {
		await runStep("Packages", async () => {
			await buildPackages("..")
		})

		await runStep("Types", async () => {
			await sh`npx tsc --incremental true --noEmit true`
		})
	}

	const version = await getTutanotaAppVersion()
	const localEnv = env.create({ staticUrl: "http://localhost:9000", version, mode: "Test", dist: false, domainConfigs })

	await runStep("Assets", async () => {
		const pjPath = path.join("..", "package.json")
		await fs.mkdir(inBuildDir(), { recursive: true })
		await fs.copyFile(pjPath, inBuildDir("package.json"))
		await createUnitTestHtml(localEnv)
	})
	await runStep("Esbuild", async () => {
		const { esbuildWasmLoader } = await import("@tutao/tuta-wasm-loader")
		await esbuild({
			// this is here because the test build targets esm and esbuild
			// does not support dynamic requires, which better-sqlite3 uses
			// to load the native module.
			banner: {
				js: `
				let require, __filename, __dirname = null

					if (typeof process !== "undefined") {
						const path = await import("node:path")
						const {fileURLToPath} = await import("node:url")
						const {createRequire} = await import("node:module")
						require = createRequire(import.meta.url)
						__filename = fileURLToPath(import.meta.url);
						__dirname = path.dirname(__filename);
					}
    `,
			},
			entryPoints: ["tests/testInBrowser.ts", "tests/testInNode.ts"],
			outdir: "./build",
			// Bundle to include the whole graph
			bundle: true,
			// Split so that dynamically included node-only tests are not embedded/run in the browser
			splitting: true,
			format: "esm",
			sourcemap: "linked",
			target: "esnext",
			define: {
				// See Env.ts for explanation
				NO_THREAD_ASSERTIONS: "true",
			},
			external: [
				"electron",
				// esbuild can't deal with node imports in ESM output at the moment
				// see https://github.com/evanw/esbuild/pull/2067
				"xhr2",
				"better-sqlite3",
				"express",
				"server-destroy",
				"body-parser",
				"jsdom",
				"node:*",
				"http",
				"stream",
				"fs",
				"assert",
				"net",
				"diagnostics_channel",
				"zlib",
				"console",
				"async_hooks",
				"util/types",
				"perf_hooks",
				"worker_threads",
				"path",
				"tls",
				"buffer",
				"events",
				"util",
				"string_decoder",
			],
			// even though tests might be running in browser we set it to node so that it ignores all builtins
			platform: "neutral",
			mainFields: ["module", "main"],
			plugins: [
				preludeEnvPlugin(localEnv),
				libDeps(".."),
				esbuildPluginAliasPath({
					alias: {
						// Take browser testdouble without funny require() magic
						testdouble: path.resolve("../node_modules/testdouble/dist/testdouble.js"),
					},
				}),
				sqliteNativePlugin({
					environment: "node",
					// We put it back into node_modules because we don't bundle it. If we remove node_modules but keep the cached one we will not run build.
					dstPath: "../node_modules/better-sqlite3/build/Release/better_sqlite3.node",
					platform: process.platform,
					architecture: process.arch,
					nativeBindingPath: path.resolve("../node_modules/better-sqlite3/build/Release/better_sqlite3.node"),
				}),
				esbuildWasmLoader({
					output: `${process.cwd()}/build/wasm`,
					fallback: true,
					webassemblyLibraries: [
						{
							name: "liboqs.wasm",
							command: "make -f Makefile_liboqs build",
							workingDir: `${process.cwd()}/../libs/webassembly/`,
							env: {
								WASM: `${process.cwd()}/build/wasm/liboqs.wasm`,
							},
						},
						{
							name: "argon2.wasm",
							command: "make -f Makefile_argon2 build",
							workingDir: `${process.cwd()}/../libs/webassembly/`,
							env: {
								WASM: `${process.cwd()}/build/wasm/argon2.wasm`,
							},
						},
					],
				}),
			],
		})
	})
}

async function createUnitTestHtml(localEnv) {
	const imports = [{ src: `./testInBrowser.js`, type: "module" }]
	const htmlFilePath = inBuildDir("test.html")

	console.log(`Generating browser tests at "${htmlFilePath}"`)

	const html = await renderHtml(imports, localEnv)
	await writeFile(htmlFilePath, html)
}

function inBuildDir(...files) {
	return path.join("build", ...files)
}
