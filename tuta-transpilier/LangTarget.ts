import {
	BinaryExpression,
	CallExpression,
	ClassDeclaration,
	EnumDeclaration,
	ExpressionStatement,
	FunctionDeclaration,
	Identifier,
	IfStatement,
	ImportDeclaration,
	InterfaceDeclaration,
	NumericLiteral,
	ReturnStatement,
	SourceFile,
	StringLiteral,
	ts,
	TypeAliasDeclaration,
	VariableStatement,
} from "ts-morph"
import { Assert, TUTANOTA_ROOT } from "./Constants.js"
import { TConstruct, TConstructMultiple, TsNode } from "./constructs/TConstruct"
import { TImport } from "./constructs/TImport"
import { TNotSupported } from "./constructs/TNotSupported"
import { TVariable } from "./constructs/TVariable"
import { TEnum } from "./constructs/TEnum"
import { TTypeAlias } from "./constructs/TTypeAlias"
import { TCall } from "./constructs/TCall"
import fs from "node:fs"
import path from "node:path"
import { TFunctionDecl } from "./constructs/TFunctionDecl"
import { TReturnKeyword } from "./constructs/TKeywords"
import { TBinaryExpr } from "./constructs/TBinaryExpr"
import { TEmpty } from "./constructs/TEmpty"
import { TIdentitider } from "./constructs/TIdentitider"
import { TNumericLiteral, TStringLiteral } from "./constructs/TLiterals"
import { TOperatorToken } from "./constructs/TOperatorToken"
import { TEndOfExpression } from "./constructs/TEndOfExpression"
import { TClassDecl } from "./constructs/TClassDecl"
import { TInterfaceDecl } from "./constructs/TInterfaceDecl"
import { TIfStatement } from "./constructs/TIfStatement"
import SyntaxKind = ts.SyntaxKind

export const enum TargetLanguage {
	Kotlin = ".kt",
	Swift = ".swift",
}

export class LangTarget {
	private fileEnded: boolean = false
	protected outputContent: string = ""
	private readonly collectedNodes: ReadonlyArray<TConstruct>

	constructor(
		private readonly sourceFile: SourceFile,
		private readonly targetLanguage: TargetLanguage,
	) {
		this.collectedNodes = sourceFile.forEachChildAsArray().flatMap((node) => LangTarget.redirectNode(node))
	}

	public async generate(): Promise<void> {
		this.writeDontEditComment()

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

	public async writeToFile(): Promise<void> {
		const tsFileProjPath = path.relative(TUTANOTA_ROOT, this.sourceFile.getDirectoryPath())
		const outDir = path.join(TUTANOTA_ROOT, "kotlin-sdk", tsFileProjPath)
		const outFileName = this.sourceFile.getBaseNameWithoutExtension() + this.targetLanguage
		const fullOutPath = path.join(outDir, outFileName)
		fs.mkdirSync(outDir, { recursive: true })
		fs.writeFileSync(fullOutPath, this.outputContent, { encoding: "utf-8" })
		console.log(`Written file: ${fullOutPath}`)
	}

	public static redirectNode(node: TsNode): TConstruct {
		const nodeKindName = node.getKindName()
		const nodeKind = node.getKind()
		const typedNode = node.asKindOrThrow(nodeKind)

		if (nodeKind === SyntaxKind.EndOfFileToken) {
			return new TEmpty()
		} else if (typedNode instanceof ImportDeclaration) {
			return new TImport(typedNode)
		} else if (typedNode instanceof VariableStatement) {
			const declarations = typedNode.getDeclarations().map((declaration) => new TVariable(declaration))
			return new TConstructMultiple(...declarations).withSeperator(";\n")
		} else if (typedNode instanceof ClassDeclaration) {
			return new TClassDecl(typedNode)
		} else if (typedNode instanceof InterfaceDeclaration) {
			return new TInterfaceDecl(typedNode)
		} else if (typedNode instanceof EnumDeclaration) {
			return new TEnum(typedNode)
		} else if (typedNode instanceof TypeAliasDeclaration) {
			return new TTypeAlias(typedNode)
		} else if (typedNode instanceof IfStatement) {
			return new TIfStatement(typedNode)
		} else if (typedNode instanceof CallExpression) {
			return new TCall(typedNode)
		} else if (typedNode instanceof FunctionDeclaration) {
			return new TFunctionDecl(typedNode)
		} else if (typedNode instanceof BinaryExpression) {
			return new TBinaryExpr(typedNode)
		} else if (typedNode instanceof ExpressionStatement) {
			const expression = LangTarget.redirectNode(typedNode.getExpression())
			return new TConstructMultiple(expression, new TEndOfExpression(typedNode)).withSeperator("")
		} else if (typedNode instanceof ReturnStatement) {
			Assert.isTrue(typedNode.getChildCount() === 2, "return statement should only have one expression")
			const [returnKeyword, returnExpression] = typedNode.getChildren()
			const returnKeywordConstruct = new TReturnKeyword(returnKeyword)
			const returnExpressionConstruct = LangTarget.redirectNode(returnExpression)
			return new TConstructMultiple(returnKeywordConstruct, returnExpressionConstruct)
		} else if (typedNode instanceof Identifier) {
			return new TIdentitider(typedNode.getSymbol().getName())
		} else if (typedNode instanceof NumericLiteral) {
			return new TNumericLiteral(typedNode)
		} else if (typedNode instanceof StringLiteral) {
			return new TStringLiteral(typedNode)
		} else if (TOperatorToken.isOperatorToken(nodeKind)) {
			return new TOperatorToken(typedNode)
		} else {
			return new TNotSupported(node)
		}
	}

	protected writeDontEditComment() {
		const currentDate = new Date()
		this.outputContent += `/* Generated file. timestamp: ${currentDate.getDate()}::${currentDate.getTime()}*/\n`
	}
}
