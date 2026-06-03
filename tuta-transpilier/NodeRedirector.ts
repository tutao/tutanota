import { TConstruct, TConstructMultiple, TsNode } from "./constructs/TConstruct"
import {
	ArrayLiteralExpression,
	BinaryExpression,
	Block,
	CallExpression,
	ClassDeclaration,
	ConditionalExpression,
	EnumDeclaration,
	ExportDeclaration,
	ExpressionStatement,
	FunctionDeclaration,
	Identifier,
	IfStatement,
	ImportDeclaration,
	InterfaceDeclaration,
	NumericLiteral,
	ParenthesizedExpression,
	PropertyAccessExpression,
	ReturnStatement,
	StringLiteral,
	SyntaxKind,
	TypeAliasDeclaration,
	VariableStatement,
} from "ts-morph"
import { TEmpty } from "./constructs/TEmpty"
import { TImport } from "./constructs/TImport"
import { TExportDecl } from "./constructs/TExportDecl"
import { TClassDecl } from "./constructs/TClassDecl"
import { TInterfaceDecl } from "./constructs/TInterfaceDecl"
import { TEnum } from "./constructs/TEnum"
import { TTypeAlias } from "./constructs/TTypeAlias"
import { TIfStatement } from "./constructs/TIfStatement"
import { TCall } from "./constructs/TCall"
import { TFunctionDecl } from "./constructs/TFunctionDecl"
import { TBinaryExpr } from "./constructs/TBinaryExpr"
import * as Assert from "node:assert"
import { TEndOfExpression } from "./constructs/TEndOfExpression"
import { TReturnKeyword } from "./constructs/TKeywords"
import { TIdentitider } from "./constructs/TIdentitider"
import { TNumericLiteral, TStringLiteral } from "./constructs/TLiterals"
import { TOperatorToken } from "./constructs/TOperatorToken"
import { TNotSupported } from "./constructs/TNotSupported"
import { TVariable } from "./constructs/TVariable"
import { TArrayLiteral } from "./constructs/TArrayLiteral"
import { IgnorableError } from "./errors/IgnorableError"
import { TPropAccess } from "./constructs/TPropAccess"
import { TNull } from "./constructs/TNull"
import { TBlock } from "./constructs/TBlock"

export class NodeRedirector {
	private static redirectNodeInner(node: TsNode): TConstruct {
		if (node.getSourceFile().getFilePath().includes("src/types/")) {
			// we have many complicated types in this folder, skip for now
			return new TEmpty()
		}

		const nodeKindName = node.getKindName()
		const nodeKind = node.getKind()
		const typedNode = node.asKindOrThrow(nodeKind)

		if (nodeKind === SyntaxKind.EndOfFileToken) {
			return new TEmpty()
		} else if (typedNode instanceof ImportDeclaration) {
			return new TImport(typedNode)
		} else if (typedNode instanceof ExportDeclaration) {
			return new TExportDecl(typedNode)
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
			return TIfStatement.fromIfStatement(typedNode)
		} else if (typedNode instanceof ConditionalExpression) {
			return TIfStatement.fromConditionalStatement(typedNode)
		} else if (typedNode instanceof CallExpression) {
			return new TCall(typedNode)
		} else if (typedNode instanceof FunctionDeclaration) {
			return new TFunctionDecl(typedNode)
		} else if (typedNode instanceof BinaryExpression) {
			return new TBinaryExpr(typedNode)
		} else if (typedNode instanceof ExpressionStatement) {
			const expression = NodeRedirector.redirectNode(typedNode.getExpression())
			return new TConstructMultiple(expression, new TEndOfExpression(typedNode)).withSeperator("")
		} else if (typedNode instanceof ReturnStatement) {
			const childNodeCount = typedNode.getChildCount()
			Assert.equal(childNodeCount === 1 || childNodeCount === 2, true, "return statement should have either 1 or 2 expression")
			const [returnKeyword, returnExpression] = typedNode.getChildren()
			const returnKeywordConstruct = new TReturnKeyword(returnKeyword)
			if (returnExpression == null) {
				return returnKeywordConstruct
			} else {
				const returnExpressionConstruct = NodeRedirector.redirectNode(returnExpression)
				return new TConstructMultiple(returnKeywordConstruct, returnExpressionConstruct)
			}
		} else if (typedNode instanceof Identifier) {
			return new TIdentitider(typedNode.getSymbol().getName())
		} else if (typedNode instanceof NumericLiteral) {
			return new TNumericLiteral(typedNode)
		} else if (typedNode instanceof StringLiteral) {
			return new TStringLiteral(typedNode)
		} else if (TOperatorToken.isOperatorToken(nodeKind)) {
			return new TOperatorToken(typedNode)
		} else if (typedNode instanceof ArrayLiteralExpression) {
			return new TArrayLiteral(typedNode)
		} else if (typedNode instanceof ParenthesizedExpression) {
			const [paranOpen, ...exprAndParanClose] = typedNode.getChildren()
			const [expression, paranClose] = exprAndParanClose
			const expressionConstructs = expression.forEachChildAsArray().map((ex) => NodeRedirector.redirectNode(ex))
			return new TConstructMultiple(new TOperatorToken(paranOpen), new TConstructMultiple(...expressionConstructs), new TOperatorToken(paranClose))
		} else if (typedNode instanceof PropertyAccessExpression) {
			return new TPropAccess(typedNode)
		} else if (typedNode instanceof Block) {
			return new TBlock(typedNode)
		} else if (TNull.isNull(node)) {
			return new TNull(node)
		} else {
			return new TNotSupported(node)
		}
	}

	public static redirectNode(node: TsNode): TConstruct {
		try {
			return this.redirectNodeInner(node)
		} catch (e) {
			if (e instanceof IgnorableError) {
				console.log("Error skipped: " + e.message)
				return new TEmpty()
			} else {
				throw e
			}
		}
	}
}
