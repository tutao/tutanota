import { CallExpression, EnumDeclaration, ExpressionStatement, ImportDeclaration, Node, SourceFile, ts, TypeAliasDeclaration } from "ts-morph"
import { getRelativePath, joinPaths, TUTANOTA_ROOT } from "./Constants.js"
import fs from "node:fs"
import SyntaxKind = ts.SyntaxKind

export abstract class CommonTarget {
	protected outputContent: string = ""
	protected abstract outFileExtension: string

	protected constructor(protected readonly sourceFile: SourceFile) {
		this.writeDontEditComment()
	}

	protected abstract generateEnumDecleration(enumDefination: EnumDeclaration): string
	protected abstract generateTypeAliasDecleration(typeAliasDeclaration: TypeAliasDeclaration): string
	protected abstract generateCallExpression(callExpression: CallExpression): string
	protected abstract generateImportDecleration(importDecleration: ImportDeclaration): string

	public generate() {
		console.log("Generating kotlin for file: " + this.sourceFile.getFilePath())

		const collectedOutputs = this.sourceFile.forEachChildAsArray().map((node) => this.redirectNode(node))
		this.outputContent += collectedOutputs.join("\n\n")
	}

	private redirectNode(node: Node<ts.Node>) {
		const _kindName = node.getKindName()
		const typedNode = node.asKindOrThrow(node.getKind())

		if (typedNode instanceof ImportDeclaration) {
			return this.generateImportDecleration(typedNode)
		} else if (typedNode instanceof EnumDeclaration) {
			return this.generateEnumDecleration(typedNode)
		} else if (typedNode instanceof TypeAliasDeclaration) {
			return this.generateTypeAliasDecleration(typedNode)
		} else if (typedNode instanceof CallExpression) {
			const parentExpressionStatement = node.getParent()
			const callOut = this.generateCallExpression(typedNode)
			if (parentExpressionStatement.getParent().getKind() === SyntaxKind.SourceFile) {
				return `/*TRANSPILIER: CallExpression at topLevel is not repersentable outside ts\n${callOut}\n*/`
			}
			return callOut
		} else if (typedNode instanceof ExpressionStatement) {
			const expression = typedNode.getExpression()
			return this.redirectNode(expression)
		}
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
