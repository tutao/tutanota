import fs from "fs-extra"
import { Argument, InvalidArgumentError, program } from "commander"
import path from "node:path"
import { fileExists } from "./buildUtils.js"

await program
	.addArgument(
		new Argument("app", "Which tuta application needs a migration").choices(["accounting", "base", "gossip", "monitor", "storage", "sys", "tutanota"]),
	)
	.addArgument(new Argument("version", "Which version of the given app needs a migration").argParser(validateNumberArg))
	.action(run)
	.parseAsync(process.argv)

function validateNumberArg(value) {
	const parsedValue = parseInt(value, 10)
	if (isNaN(parsedValue)) {
		throw new InvalidArgumentError("Not a number.")
	}
	return parsedValue
}

async function run(app, version) {
	const template = `
import {OfflineMigration} from "../OfflineStorageMigrator.js"
import {OfflineStorage} from "../OfflineStorage.js"

export const ${app}${version}: OfflineMigration = {
\tapp: "${app}",
\tversion: ${version},
\tasync migrate(storage: OfflineStorage) {
\t  throw new Error("TODO")
\t}
}
`.trimStart()
	const outputName = path.resolve(`./src/common/api/worker/offline/migrations/${app}-v${version}.ts`)

	if (await fileExists(outputName)) {
		console.error("That migration already exists!")
		process.exit(1)
	}

	await fs.writeFile(outputName, template, "utf-8")
	console.log(`Wrote to: ${outputName}`)
}
