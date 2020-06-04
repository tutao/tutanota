import options from "commander"
import fs from "fs-extra"
import {spawn} from "child_process"
import flow from "flow-bin"
import {buildWithServer} from "./buildSrc/BuildServerClient.js"
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

const flowPromise = new Promise((resolve, reject) => {
	// It's better to set listener right away
	spawn(flow, ["--quiet"], {stdio: "inherit"}).on("exit", resolve).on("error", reject)
})

const SOCKET_PATH = "/tmp/buildServer"

runBuild()

function runBuild() {
	buildWithServer({
		clean: opts.clean,
		builder: "./Builder.js",
		watchFolders: ["src"],
		socketPath: SOCKET_PATH,
		buildOpts: opts,
	})
		.then(async () => {
			const dictPath = "build/dictionaries"
			if(fs.existsSync(dictPath)) return
			const {devDependencies} = JSON.parse(await fs.readFile("package.json", "utf8"))
			return fetchDictionaries(devDependencies.electron, [dictPath])
		})
		.then(async () => {
			console.log("Build finished")
			if (opts.desktop) {
				// we don't want to quit here because we want to keep piping output to our stdout.
				spawn("./start-desktop.sh", {stdio: "inherit"})
			} else if (!opts.watch) {
				await flowPromise
				process.exit(0)
			}
		})
		.catch(async e => {
			console.error(e)
			await flowPromise
			process.exit(1)
		})
}

if (options.clean) {
	console.log("cleaning build dir")
	fs.emptyDir("build")
}