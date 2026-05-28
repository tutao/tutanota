import { EnumDeclaration, SourceFile, ts, TypeAliasDeclaration } from "ts-morph"
import { getRelativePath, joinPaths, TUTANOTA_ROOT } from "./Constants.js"
import fs from "node:fs"

export abstract class CommonTarget {
	protected outputContent: string = ""
	protected abstract outFileExtension: string

	protected constructor(protected readonly sourceFile: SourceFile) {
		this.writeDontEditComment()
	}

	protected abstract generateEnum(enumDefination: EnumDeclaration): string
	protected abstract generateTypeAliasDecleration(enumDefination: TypeAliasDeclaration): string

	public generate() {
		console.log("Generating kotlin for file: " + this.sourceFile.getFilePath())

		this.sourceFile.getEnums().map((enumDecleration) => {
			const enumOut = this.generateEnum(enumDecleration)
			this.outputContent += enumOut + "\n"
		})
		this.sourceFile.getTypeAliases().map((typeAlisDeclaration) => {
			const decOut = this.generateTypeAliasDecleration(typeAlisDeclaration)
			this.outputContent += decOut + "\n"
		})
	}
	public async writeToFile(): Promise<void> {
		const { outDir, outFileName } = this.getOutputPath()
		fs.mkdirSync(outDir, { recursive: true })
		fs.writeFileSync(joinPaths(outDir, outFileName), this.outputContent, { encoding: "utf-8" })
	}

	protected writeDontEditComment() {
		const currentDate = new Date()
		this.outputContent += `/* Generated file. timestamp: ${currentDate.getDate()}::${currentDate.getTime()}*/\n`
	}

	protected getOutputPath(): { outDir: string; outFileName: string } {
		const tsFileProjPath = getRelativePath(TUTANOTA_ROOT, this.sourceFile.getDirectoryPath())
		const outDir = joinPaths(TUTANOTA_ROOT, "kotlin-sdk", tsFileProjPath)
		const outFileName = this.sourceFile.getBaseNameWithoutExtension() + this.outFileExtension
		return { outDir, outFileName }
	}
}
