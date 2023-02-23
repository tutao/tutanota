// For programmatic use please prefer "./packageBuilderFunctions"
// This is a wrapper mostly meant for npm.

import { Argument, program } from "commander"
import { buildPackages, buildRuntimePackages } from "./packageBuilderFunctions.js"

program.name("buildPackages").description("A script to invoke tsc -b on the right packages")

program
	.addArgument(new Argument("type").choices(["runtime", "all"]))
	.action(async (type) => {
		if (type === "runtime") {
			await buildRuntimePackages()
		} else if (type === "all") {
			await buildPackages()
		} else {
			throw new Error(`Unknown type ${type}`)
		}
	})
	.parse()
