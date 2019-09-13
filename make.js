import options from "commander"
import fs from "fs-extra"
import {spawn} from "child_process"
import flow from "flow-bin"
import {buildWithServer} from "./buildSrc/BuildServerClient.js"

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

spawn(flow, ["--quiet"], {stdio: "inherit"})

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
		.then(() => {
			console.log("Build finished")
			if (opts.desktop) {
				// we don't want to quit here because we want to keep piping output to our stdout.
				spawn("./start-desktop.sh", {stdio: "inherit"})
			} else if (!opts.watch) {
				process.exit(0)
			}
		})
		.catch(e => {
			console.error(e)
			process.exit(1)
		})
}

if (options.clean) {
	console.log("cleaning build dir")
	fs.emptyDir("build")
}