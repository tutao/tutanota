import { program } from "commander"
import { Project } from "ts-morph"
import { KotlinTarget } from "./KotlinTarget.js"
import { TUTANOTA_ROOT } from "./Constants.js"

program
	.action(async () => {
		const project = new Project({
			tsConfigFilePath: `src/platform-kit/tsconfig.app-env.json`,
			skipAddingFilesFromTsConfig: true,
		})
		project.addSourceFileAtPath(TUTANOTA_ROOT + "/src/platform-kit/app-env/AppType.ts")
		project.addSourceFileAtPath(TUTANOTA_ROOT + "/src/platform-kit/app-env/boot/ClientConstants.ts")
		const targetTranspilation = project.getSourceFiles().map((sourceFile) => {
			const kotlinTarget = new KotlinTarget(sourceFile)
			kotlinTarget.generate()
			kotlinTarget.writeToFile()
		})
		await Promise.all(targetTranspilation)
	})
	.parse()
