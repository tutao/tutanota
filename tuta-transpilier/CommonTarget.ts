import {
	BinaryExpression,
	Block,
	CallExpression,
	EnumDeclaration,
	ExpressionStatement,
	FunctionDeclaration,
	Identifier,
	ImportDeclaration,
	Node,
	NumericLiteral,
	ReturnStatement,
	SourceFile,
	ts,
	TypeAliasDeclaration,
	VariableDeclaration,
	VariableStatement,
} from "ts-morph"
import { getRelativePath, joinPaths, TUTANOTA_ROOT } from "./Constants.js"
import fs from "node:fs"
import SyntaxKind = ts.SyntaxKind

export abstract class CommonTarget {
	private fileEnded: boolean = false
	protected outputContent: string = ""
	protected abstract outFileExtension: string

	protected constructor(protected readonly sourceFile: SourceFile) {
		this.writeDontEditComment()
	}

	protected abstract mapFromTsIdentifier(identifier: string): string
	protected abstract generateEnumDecleration(enumDefination: EnumDeclaration): string
	protected abstract generateTypeAliasDecleration(typeAliasDeclaration: TypeAliasDeclaration): string
	protected abstract generateCallExpression(callExpression: CallExpression): string
	protected abstract generateImportDecleration(importDecleration: ImportDeclaration): string
	protected abstract generateVariableDeclaration(variableStatement: VariableDeclaration): string
	protected abstract generateFunctionDecleration(functionDecleration: FunctionDeclaration): string
	protected abstract generateNumericLiteral(numericLiteral: NumericLiteral): string

	public generate() {
		console.log("Generating kotlin for file: " + this.sourceFile.getFilePath())

		const collectedOutputs = this.sourceFile.forEachChildAsArray().map((node) => this.joinOutputs(this.redirectNode(node)))
		this.outputContent += collectedOutputs.join("\n\n")
	}

	protected redirectNode(node: Node<ts.Node>): string | Array<string> {
		const nodeKindName = node.getKindName()
		const nodeKind = node.getKind()
		const typedNode = node.asKindOrThrow(nodeKind)

		if (this.fileEnded) {
			throw new Error("File already ended but got token: " + nodeKindName)
		} else if (typedNode instanceof ImportDeclaration) {
			return this.generateImportDecleration(typedNode)
		} else if (nodeKind === SyntaxKind.ReturnKeyword) {
			return "return "
		} else if (nodeKind === SyntaxKind.AsteriskToken) {
			const parentStatement = typedNode.getParent()
			if (parentStatement.getKind() === SyntaxKind.BinaryExpression) {
				return "*"
			} else {
				return "astrisk token in non-binary expression"
			}
		} else if (nodeKind === SyntaxKind.EndOfFileToken) {
			this.fileEnded = true
			return "/** File End **/"
		} else if (typedNode instanceof VariableStatement) {
			return typedNode.getDeclarations().map((declaration) => this.generateVariableDeclaration(declaration))
		} else if (typedNode instanceof NumericLiteral) {
			return this.generateNumericLiteral(typedNode)
		} else if (typedNode instanceof Identifier) {
			return this.mapFromTsIdentifier(typedNode.getSymbol().getName())
		} else if (typedNode instanceof ReturnStatement) {
			const returnValue = typedNode.getChildren().map((child) => this.joinOutputs(this.redirectNode(child)))
			return this.joinOutputs(returnValue)
		} else if (typedNode instanceof EnumDeclaration) {
			return this.generateEnumDecleration(typedNode)
		} else if (typedNode instanceof TypeAliasDeclaration) {
			return this.generateTypeAliasDecleration(typedNode)
		} else if (typedNode instanceof Block) {
			const blockStatements = typedNode.forEachChildAsArray().flatMap((blockContent) => this.redirectNode(blockContent))
			return ["\n", ...blockStatements, "\n"]
		} else if (typedNode instanceof FunctionDeclaration) {
			return this.generateFunctionDecleration(typedNode)
		} else if (typedNode instanceof BinaryExpression) {
			const [lhs, operator, rhs, ...rest] = typedNode.getChildren()
			if (rest.length > 0) {
				throw new Error("More than 3 tokens in BinaryExpression")
			}
			return [this.redirectNode(lhs), " ", this.redirectNode(operator), " ", this.redirectNode(rhs)].flat()
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
		} else {
			return "NOT_SUPPORTED"
		}
	}

	protected joinOutputs(outputs: string | Array<string>): string {
		if (typeof outputs === "string") {
			return outputs
		} else if (outputs == null) {
			throw new Error("no output??")
		} else {
			return outputs.join("")
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
