import {rollupDebugPlugins, writeNollupBundle} from "../buildSrc/RollupDebugConfig.js"
import nollup from "nollup"
import * as env from "../buildSrc/env.js"
import {promises as fs} from "fs"
import path, {dirname} from "path"
import {renderHtml} from "../buildSrc/LaunchHtml.js"
import {fileURLToPath} from "url"
import nodeResolve from "@rollup/plugin-node-resolve"
import {sqliteNativeBannerPlugin} from "../buildSrc/nativeLibraryRollupPlugin.js"
import rollupPluginJson from "@rollup/plugin-json"

const testRoot = dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(path.join(testRoot, ".."))

export async function build(buildOptions, serverOptions, log) {
	log("Building tests")

	const pjPath = path.join(projectRoot, "package.json")
	await fs.mkdir(buildDir(), {recursive: true})
	const {version} = JSON.parse(await fs.readFile(pjPath, "utf8"))
	await fs.copyFile(pjPath, buildDir("package.json"))
	const localEnv = env.create({staticUrl: "http://localhost:9000", version, mode: "Test", dist: false})

	log("Bundling...")
	const bundle = await nollup({
		input: [
			"api/bootstrapTests-api.ts",
			"client/bootstrapTests-client.ts"
		],
		plugins: [
			envPlugin(localEnv),
			resolveTestLibsPlugin(),
			...rollupDebugPlugins(path.resolve(".."), {outDir: "build"}),
			rollupPluginJson({}),
			nodeResolve({preferBuiltins: true}),
			sqliteNativeBannerPlugin(
				{
					environment: "node",
					rootDir: projectRoot,
					dstPath: buildDir("better_sqlite3.node")
				},
				log
			),
		],
	})
	return [
		{
			bundle,
			async generate() {
				await Promise.all([
					createUnitTestHtml(false, "api", localEnv, log),
					createUnitTestHtml(false, "client", localEnv, log)
				])

				const start = Date.now()
				log("Generating...")
				const result = await bundle.generate({sourceMap: true, dir: buildDir(), format: "esm", chunkFileNames: "[name].js"})
				log("Generated in", Date.now() - start)

				const writingStart = Date.now()
				await writeNollupBundle(result, log, buildDir())
				log("Wrote in ", Date.now() - writingStart)
			},
		}
	]
}

// We use this homebrew plugin so that libs are copies to _virtual folder and *not* build/node_modules
// (which would be the case with preserve_modules).
// Files in build/node_modules are treated as separate libraries and ES mode resets back to commonjs.
function resolveTestLibsPlugin() {
	return {
		name: "resolve-test-libs",
		resolveId(source, importer) {
			switch (source) {
				case "mithril/test-utils/browserMock":
					// This one is *not* a module, just a script so we need to rewrite import path.
					// nollup only rewrites absolute paths so resolve path first.
					return path.resolve("../node_modules/mithril/test-utils/browserMock.js")
				case "ospec":
					return "../node_modules/ospec/ospec.js"
				case "better-sqlite3":
				case "testdouble":
				case "crypto":
				case "xhr2":
				case "express":
				case "server-destroy":
				case "body-parser":
				case "mockery":
				case "path":
				case "url":
				case "util":
				case "node-forge":
				case "os":
				case "electron-updater":
				case "child_process":
				case "querystring":
				case "events":
				case "fs":
				case "buffer":
				case "winreg":
					return false
				case "electron":
					throw new Error(`electron is imported by ${importer}, don't do it in tests`)
			}
		},
	}
}


/**
 * Simple plugin for virtual module "@tutanota/env" which resolves to the {@param env}.
 * see https://rollupjs.org/guide/en/#a-simple-example
 */
function envPlugin(env) {
	return {
		name: "tutanota-env",
		resolveId(source) {
			if (source === "@tutanota/env") return source
		},
		load(id) {
			if (id === "@tutanota/env") return `export default ${JSON.stringify(env)}`
		},
	}
}

async function createUnitTestHtml(watch, project, localEnv, log) {
	const imports = [{src: `test-${project}.js`, type: "module"}]


	const template = `import('./bootstrapTests-${project}.js')`
	const targetFile = buildDir(`test-${project}.html`)
	log(`Generating browser tests for ${project} at "${targetFile}"`)
	await _writeFile(buildDir(`test-${project}.js`), [
		`window.whitelabelCustomizations = null`,
		`window.env = ${JSON.stringify(localEnv, null, 2)}`,
		watch ? "new WebSocket('ws://localhost:8080').addEventListener('message', (e) => window.hotReload())" : "",
	].join("\n") + "\n" + template)

	const html = await renderHtml(imports, localEnv)
	await _writeFile(targetFile, html)
}

function _writeFile(targetFile, content) {
	return fs.mkdir(path.dirname(targetFile), {recursive: true}).then(() => fs.writeFile(targetFile, content, 'utf-8'))
}

function buildDir(...files) {
	return path.join(testRoot, "build", ...files)
}