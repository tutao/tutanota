import { program } from "commander"
import { Project } from "ts-morph"
import { LangTarget, TargetLanguage } from "./LangTarget"

program
	.action(async () => {
		const project = new Project({
			tsConfigFilePath: `src/platform-kit/tsconfig.app-env.json`,
		})
		const targetTranspilation = project.getSourceFiles().map(async (sourceFile) => {
			const langTarget = new LangTarget(sourceFile, TargetLanguage.Kotlin)
			await langTarget.generate()
			await langTarget.writeToFile()
		})
		await Promise.all(targetTranspilation)
	})
	.parse()
