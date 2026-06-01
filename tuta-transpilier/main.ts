import { program } from "commander"
import { Project } from "ts-morph"
import { TUTANOTA_ROOT } from "./Constants.js"
import { LangTarget, TargetLanguage } from "./LangTarget"

program
	.action(async () => {
		const project = new Project({
			tsConfigFilePath: `src/platform-kit/tsconfig.app-env.json`,
			skipAddingFilesFromTsConfig: true,
		})
		project.addSourceFileAtPath(TUTANOTA_ROOT + "/src/platform-kit/app-env/AppType.ts")
		project.addSourceFileAtPath(TUTANOTA_ROOT + "/src/platform-kit/app-env/boot/ClientConstants.ts")
		project.addSourceFileAtPath(TUTANOTA_ROOT + "/src/platform-kit/app-env/TimeConstants.ts")
		const targetTranspilation = project.getSourceFiles().map(async (sourceFile) => {
			const langTarget = new LangTarget(sourceFile, TargetLanguage.Kotlin)
			await langTarget.generate()
			await langTarget.writeToFile()
		})
		await Promise.all(targetTranspilation)
	})
	.parse()
