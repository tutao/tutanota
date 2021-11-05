import options from "commander"
import {runDevBuild} from "./buildSrc/DevBuild.js"
import {spawn} from "child_process"

options
	.usage('[options] [test|prod|local|host <url>], "local" is default')
	.arguments('[stage] [host]')
	.option('-c, --clean', 'Clean build directory')
	.option('-w, --watch', 'Watch build dir and rebuild if necessary')
	.option('-d, --desktop', 'Assemble & start desktop client')
	.option('-s, --serve', 'Start a local server to serve the website')
	.action(async (stage, host, options) => {
		if (!["test", "prod", "local", "host", undefined].includes(stage)
			|| (stage !== "host" && host)
			|| (stage === "host" && !host)) {
			options.outputHelp()
			process.exit(1)
		}

		const {clean, watch, serve, desktop} = options

		try {
			await runDevBuild({
				stage: stage ?? "local",
				host,
				clean,
				watch,
				serve,
				desktop
			})

			if (desktop) {
				// we don't want to quit here because we want to keep piping output to our stdout.
				spawn("./start-desktop.sh", {stdio: "inherit"})
			} else if (!watch) {
				// Don't wait for spawned child processes to exit (because they never will)
				process.exit(0)
			}
		} catch (e) {
			console.error("Build failed:", e)
			process.exit(1)
		}
	})

options.parseAsync(process.argv)

