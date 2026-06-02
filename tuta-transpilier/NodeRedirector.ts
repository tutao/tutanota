import { TConstruct, TConstructMultiple, TsNode } from "./constructs/TConstruct"
import {
	BinaryExpression,
	CallExpression,
	ClassDeclaration,
	EnumDeclaration,
	ExportDeclaration,
	ExpressionStatement,
	FunctionDeclaration,
	Identifier,
	IfStatement,
	ImportDeclaration,
	InterfaceDeclaration,
	NumericLiteral,
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

export class NodeRedirector {
	public static redirectNode(node: TsNode): TConstruct {
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
			return new TIfStatement(typedNode)
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
			Assert.equal(typedNode.getChildCount(), 2, "return statement should only have one expression")
			const [returnKeyword, returnExpression] = typedNode.getChildren()
			const returnKeywordConstruct = new TReturnKeyword(returnKeyword)
			const returnExpressionConstruct = NodeRedirector.redirectNode(returnExpression)
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
}
