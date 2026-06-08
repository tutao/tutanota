import { Option, program } from "commander"
import { Project } from "ts-morph"
import { COMPATIBILITY_FILE, LangTarget, TargetLanguage } from "./LangTarget"
import path from "node:path"
import { TUTANOTA_ROOT } from "./Constants"

program
	.addOption(new Option("--targetLanguage <targetLanguage>", "Language to transpile to").choices(["swift", "kotlin"]).default("kotlin"))
	.option("--tsConfigFile <tsConfigFile>", "Typescript project to transpile")
	.action(async (options) => {
		let targetProjectRoot: string
		if (options.targetLanguage === "kotlin") {
			targetProjectRoot = path.join(TUTANOTA_ROOT, "kotlin-sdk", "src", "main", "kotlin")
		} else if (options.targetLanguage === "swift") {
			// todo:
		} else {
			throw new Error("Unknown target language")
		}

		const project = new Project({
			tsConfigFilePath: options.tsConfigFile,
			skipAddingFilesFromTsConfig: false,
		})

		const targetTranspilation = project
			.getSourceFiles()
			.filter((sourceFile) => sourceFile.getFilePath() !== COMPATIBILITY_FILE)
			.map(async (sourceFile) => {
				const langTarget = new LangTarget(sourceFile, TargetLanguage.Kotlin)
				await langTarget.generate()
				await langTarget.writeToFile(targetProjectRoot)
			})
		await Promise.all(targetTranspilation)
	})
	.parse()
