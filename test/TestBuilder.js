import * as env from "../buildSrc/env.js"
import { preludeEnvPlugin } from "../buildSrc/env.js"
import fs from "fs-extra"
import path, { dirname } from "node:path"
import { renderHtml } from "../buildSrc/LaunchHtml.js"
import { getTutanotaAppVersion, runStep, writeFile } from "../buildSrc/buildUtils.js"
import { domainConfigs } from "../buildSrc/DomainConfigs.js"
import { rolldown } from "rolldown"
import { resolveLibs } from "../buildSrc/RollupConfig.js"
import { nodeGypPlugin } from "../buildSrc/nodeGypPlugin.js"
import { fileURLToPath } from "node:url"
import { $ } from "zx"
import { execSync, spawnSync } from "node:child_process"

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(path.join(currentDir, ".."))

export async function runTestBuild({ networkDebugging = false, clean }) {
	const buildDir = path.resolve("build")
	const version = await getTutanotaAppVersion()
	const localEnv = env.create({
		staticUrl: "http://localhost:9000",
		version,
		mode: "Test",
		dist: false,
		domainConfigs,
		networkDebugging,
	})

	if (clean) {
		await runStep("Clean", async () => {
			fs.rmSync(buildDir, { recursive: true, force: true })
			fs.rmSync("src/mimimi/dist", { recursive: true, force: true })
			spawnSync("cargo", ["clean"])
			spawnSync("npx", ["tsc", "--build", "--clean"])
		})
	}

	await runStep("Build crypto-primitives", async () => {
		const targetDir = path.resolve(buildDir)
		const _ = clean
			? await $({ stdio: "inherit", cwd: "../src/crypto" })`node --experimental-strip-types make.ts ${targetDir} --clean`
			: await $({ stdio: "inherit", cwd: "../src/crypto" })`node --experimental-strip-types make.ts ${targetDir}`
	})

	await runStep("Build mimimi", async () => {
		execSync("node --experimental-strip-types make.ts", {
			cwd: "../src/mimimi",
			stdio: "inherit",
		})
	})

	await runStep("Types", async () => {
		await $({ stdio: "inherit" })`npm run test:types`
	})

	await runStep("Assets", async () => {
		const pjPath = path.join("..", "package.json")
		await fs.mkdir(inBuildDir(), { recursive: true })
		await fs.copyFile(pjPath, inBuildDir("package.json"))
		await createUnitTestHtml(localEnv)
	})

	await runStep("Rolldown", async () => {
		const { rollupWasmLoader } = await import("../src/wasm-loader/dist/index.js") // FIXME: this have to already exists? and is there bettr way to import
		const bundle = await rolldown({
			input: ["tests/testInBrowser.ts", "tests/testInNode.ts", "../src/common/api/common/pow-worker.ts"],
			platform: "neutral",
			transform: {
				define: {
					// See Env.ts for explanation
					LOAD_ASSERTIONS: "false",
				},
			},
			external: [
				"electron",
				// esbuild can't deal with node imports in ESM output at the moment
				// see https://github.com/evanw/esbuild/pull/2067
				"xhr2",
				"express",
				"server-destroy",
				"body-parser",
				"jsdom",
				/node:.*/,
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
				"crypto", // oxmsg needs it
				"memcpy", // optional dep of oxmsg
			],
			plugins: [
				preludeEnvPlugin(localEnv),
				resolveLibs(".."),
				nodeGypPlugin({
					rootDir: projectRoot,
					platform: process.platform,
					architecture: process.arch,
					nodeModule: "@signalapp/sqlcipher",
					environment: "node",
					targetName: "node_sqlcipher",
				}),
				rollupWasmLoader({
					output: `${process.cwd()}/build`,
					webassemblyLibraries: [
						{
							name: "liboqs.wasm",
							command: "make -f Makefile_liboqs build",
							workingDir: `${process.cwd()}/../libs/webassembly/`,
							outputPath: `${process.cwd()}/build/liboqs.wasm`,
						},
						{
							name: "argon2.wasm",
							command: "make -f Makefile_argon2 build",
							workingDir: `${process.cwd()}/../libs/webassembly/`,
							outputPath: `${process.cwd()}/build/argon2.wasm`,
						},
					],
				}),
			],
			resolve: {
				mainFields: ["module", "main"],
				alias: {
					// Take browser testdouble without funny require() magic
					testdouble: path.resolve("../node_modules/testdouble/dist/testdouble.js"),
				},
			},
			onwarn: (warning, defaultHandler) => {
				if (warning.code !== "EVAL") {
					defaultHandler(warning)
				}
			},
		})
		await bundle.write({
			dir: "./build",
			format: "esm",
			sourcemap: true,
			// overwrite the files rather than keeping all versions in the build folder
			chunkFileNames: "[name]-chunk.js",
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
