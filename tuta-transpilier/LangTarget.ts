import { SourceFile } from "ts-morph"
import { TUTANOTA_ROOT } from "./Constants.js"
import { TConstruct } from "./constructs/TConstruct"
import fs from "node:fs"
import path from "node:path"
import { TIdentifierFormatting, TIdentitider } from "./constructs/TIdentitider"
import { NodeRedirector } from "./NodeRedirector"

export const enum TargetLanguage {
	Kotlin = ".kt",
	Swift = ".swift",
}

export class LangTarget {
	protected outputContent: string = ""
	private readonly collectedNodes: ReadonlyArray<TConstruct>
	private readonly packageDeclaration: string

	constructor(
		private readonly sourceFile: SourceFile,
		private readonly targetLanguage: TargetLanguage,
	) {
		const sourceFileRelativeDir: string = path.relative(path.join(TUTANOTA_ROOT, "src"), this.sourceFile.getDirectoryPath())
		this.packageDeclaration = sourceFileRelativeDir
			.split(path.sep)
			.map((pathComponent) => new TIdentitider(pathComponent).withFormattingKind(TIdentifierFormatting.VariableLike))
			.map((pathIdent) => {
				if (this.targetLanguage === TargetLanguage.Kotlin) {
					return pathIdent.generateKotlin()
				} else if (this.targetLanguage === TargetLanguage.Swift) {
					return pathIdent.generateSwift()
				}
			})
			.join(".")

		this.collectedNodes = sourceFile.forEachChildAsArray().flatMap((node) => NodeRedirector.redirectNode(node))
	}

	public async generate(): Promise<void> {
		this.writeDontEditComment()
		this.writeKotlinTopLevelDecl()

		for (const construct of this.collectedNodes) {
			const constructOut = (() => {
				switch (this.targetLanguage) {
					case TargetLanguage.Kotlin:
						return construct.generateKotlin()
					case TargetLanguage.Swift:
						return construct.generateSwift()
				}
			})()

			if (typeof constructOut === "string") {
				this.outputContent += constructOut
			} else if (constructOut instanceof Array) {
				this.outputContent += constructOut.join("\n")
			} else if (constructOut == null) {
				throw new Error("A construct gave null/undefined output?")
			}

			this.outputContent += "\n"
		}
	}

	public async writeToFile(targetLanguageRoot: string): Promise<void> {
		const packagePath = this.packageDeclaration.split(".").join(path.sep)
		const outDir = path.join(targetLanguageRoot, packagePath)

		const outFileName = this.sourceFile.getBaseNameWithoutExtension() + this.targetLanguage
		const fullOutPath = path.join(outDir, outFileName)
		fs.mkdirSync(outDir, { recursive: true })
		fs.writeFileSync(fullOutPath, this.outputContent, { encoding: "utf-8" })
		console.log(`Written file: ${fullOutPath}`)
	}

	protected writeDontEditComment() {
		this.outputContent += `/* Generated file. Do not edit by hand!*/\n`
	}

	private writeKotlinTopLevelDecl() {
		this.outputContent += "package de.tutao." + this.packageDeclaration + ";\n\n"
	}
}
