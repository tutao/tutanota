import options from "commander"
import fs from "fs-extra"
import {spawn} from "child_process"
import flow from "flow-bin"
import {BuildServerClient} from "@tutao/tutanota-build-server"
import path from "path"
import {fetchDictionaries} from "./buildSrc/DictionaryFetcher.js"

let opts
options
	.usage('[options] [test|prod|local|host <url>], "local" is default')
	.arguments('[stage] [host]')
	.option('-c, --clean', 'Clean build directory')
	.option('-w, --watch', 'Watch build dir and rebuild if necessary')
	.option('-d, --desktop', 'assemble & start desktop client')
	.action(function (stage, host) {
		opts = options.opts()
		if (!["test", "prod", "local", "host", undefined].includes(stage)
			|| (stage !== "host" && host)
			|| (stage === "host" && !host)) {
			options.outputHelp()
			process.exit(1)
		}
		opts.stage = stage || "local"
		opts.host = host
	})
	.parse(process.argv)

if (opts.watch) {
	console.error("Watch mode (dev server) is currently disabled")
	process.exit(1)
}

const flowPromise = new Promise((resolve, reject) => {
	// It's better to set listener right away
	spawn(flow, {stdio: "inherit"})
		.on("exit", resolve)
		.on("error", reject)
		.unref()
})

if (options.clean) {
	console.log("cleaning build dir")
	fs.emptyDir("build")
}

runBuild()

async function runBuild() {

	try {
		const buildServerClient = new BuildServerClient("make")
		await buildServerClient.buildWithServer({
			forceRestart: opts.clean,
			builder: path.resolve("./buildSrc/Builder.js"),
			watchFolders: [path.resolve("src")],
			buildOpts: opts,
			webRoot: path.resolve('build'),
			spaRedirect: true,
			// Disabled until dev server mode is fixed
			// devServerPort: 9001,
			preserveLogs: true,
		})

		const dictPath = "build/dictionaries"
		if (!fs.existsSync(dictPath)) {
			const {devDependencies} = JSON.parse(await fs.readFile("package.json", "utf8"))
			await fetchDictionaries(devDependencies.electron, [dictPath])
		}

		console.log("Build finished")

		if (opts.desktop) {
			// we don't want to quit here because we want to keep piping output to our stdout.
			spawn("./start-desktop.sh", {stdio: "inherit"})
		} else if (!opts.watch) {
			await flowPromise
		}
	} catch (e) {
		console.error(e)
		await flowPromise
		process.exit(1)
	}
}

