#!/usr/bin/env node
import { generate } from "./index.js"
import * as fs from "node:fs"
import * as path from "node:path"
import { globby } from "zx"
import { Platform } from "./common"
import { Argument, Option, program } from "commander"
import JSON5 from "json5"

const PLATFORMS: Array<Platform> = ["ios", "web", "android", "desktop"]

const USAGE = `licc [options] from_dir to_dir

will recursively take all JSON files from \`from-dir\` and compile them.
output files are written into \`to-dir\`, without preserving subdirectory structure.`

await program
	.usage(USAGE)
	.addArgument(new Argument("from_dir").argRequired())
	.addArgument(new Argument("to_dir").argOptional())
	.addOption(
		new Option(
			"-p, --platform <platform>",
			"platform to generate code for. if not specified, from_dir must be omitted as well. In this case, licc will read <from_dir>/.liccc as a json map from platform to output dir. if -p is set, from_dir must be set as well.",
		)
			.makeOptionMandatory(false)
			.choices(PLATFORMS),
	)
	.action(async (from_dir, to_dir, { platform }) => {
		assert(!(platform == null && to_dir != null), "can't omit platform and use an explicit output dir. specify both -p <platform> and to_dir or none of them.")
		assert(!(platform != null && to_dir == null), "can't use an explicit platform but no output dir. specify both -p <platform> and to_dir or none of them.")

		let conf: Record<string, string> = {}
		if (platform != null) {
			conf[platform] = path.resolve(process.cwd(), to_dir)
		} else {
			// check if there's a .liccc file that states the desired platforms and output dirs
			const confPath = path.join(from_dir, ".liccc")
			try {
				const relConf: Record<Platform, string> = JSON5.parse(await fs.promises.readFile(confPath, { encoding: "utf-8" }))
				for (let [relPlatform, relPath] of Object.entries(relConf) as [Platform | "__comment", string][]) {
					if (relPlatform === "__comment") continue
					assert(PLATFORMS.includes(relPlatform), `invalid platform in .liccc: ${relPlatform}`)
					conf[relPlatform] = path.resolve(process.cwd(), from_dir, relPath)
				}
			} catch (e) {
				console.log(`unable to read ${confPath} as JSON: ${e}`)
				process.exit(1)
			}
		}
		await run(from_dir, conf)
	})
	.parseAsync(process.argv)

async function run(from_dir: string, conf: Record<Platform, string>): Promise<void> {
	const inputFiles = await globby(["*/**/*.json", "*/**/*.json5"].map((glob) => path.join(process.cwd(), from_dir, glob)))
	const inputMap = new Map(inputFiles.map((n: string) => [path.basename(n, n.endsWith("5") ? ".json5" : ".json"), fs.readFileSync(n, "utf8")]))

	// doing it here because some platforms generate into the same dir.
	for (let outDir of Object.values(conf)) {
		clearDir(outDir)
	}

	for (let [confPlatform, confOutDir] of Object.entries(conf)) {
		console.log("generating for", confPlatform, "into", confOutDir)
		try {
			await generate(confPlatform as Platform, inputMap, confOutDir)
		} catch (e) {
			assert(false, `compilation failed with ${e}`)
		}
		console.log("done; no errors\n")
	}
}

function assert(proposition: boolean, text: string): void {
	if (proposition) return
	console.log("\nFatal Error:\n", text)
	console.log("")
	console.log(program.helpInformation())
	process.exit(1)
}

function clearDir(dir: string) {
	console.log("clearing dir:", dir)
	try {
		const files = fs.readdirSync(dir)
		for (const file of files) {
			fs.unlinkSync(path.join(dir, file))
		}
	} catch (e) {
		console.log("could not clear dir:", e)
	}
}
