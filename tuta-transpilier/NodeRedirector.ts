import { TConstruct, TConstructMultiple, TsNode } from "./constructs/TConstruct"
import {
	ArrayLiteralExpression,
	ArrowFunction,
	AsExpression,
	BinaryExpression,
	Block,
	CallExpression,
	ClassDeclaration,
	ConditionalExpression,
	ElementAccessExpression,
	EnumDeclaration,
	ExportDeclaration,
	ExpressionStatement,
	ForOfStatement,
	FunctionDeclaration,
	Identifier,
	IfStatement,
	ImportDeclaration,
	InterfaceDeclaration,
	NewExpression,
	NonNullExpression,
	NumericLiteral,
	ParenthesizedExpression,
	PrefixUnaryExpression,
	PropertyAccessExpression,
	RegularExpressionLiteral,
	ReturnStatement,
	SatisfiesExpression,
	StringLiteral,
	SuperExpression,
	SwitchStatement,
	TemplateExpression,
	ThrowStatement,
	TryStatement,
	ts,
	TypeAliasDeclaration,
	TypeReferenceNode,
	VariableDeclaration,
	VariableDeclarationList,
	VariableStatement,
	WhileStatement,
} from "ts-morph"
import { TEmpty } from "./constructs/TEmpty"
import { TImport } from "./constructs/TImport"
import { TExportDecl } from "./constructs/TExportDecl"
import { TClassDecl } from "./constructs/TClassDecl"
import { TInterfaceDecl } from "./constructs/TInterfaceDecl"
import { TEnum } from "./constructs/TEnum"
import { TTypeAlias } from "./constructs/TTypeAlias"
import { TIfStatement, TSwitchStatement } from "./constructs/TIfStatement"
import { TCall, TNew } from "./constructs/TCall"
import { TArrow, TFunctionDecl } from "./constructs/TFunctionDecl"
import { TBinaryExpr } from "./constructs/TBinaryExpr"
import * as Assert from "node:assert"
import { TEndOfExpression } from "./constructs/TEndOfExpression"
import { TIdentitider } from "./constructs/TIdentitider"
import { TNumericLiteral, TStringLiteral } from "./constructs/TLiterals"
import { TOneToOneReplacement } from "./constructs/TOneToOneReplacement"
import { TNotSupported } from "./constructs/TNotSupported"
import { TArrayLiteral } from "./constructs/TArrayLiteral"
import { IgnorableError } from "./errors/IgnorableError"
import { TPropAccess } from "./constructs/TPropAccess"
import { TBlock } from "./constructs/TBlock"
import { TSuperKeyword } from "./constructs/TSuperKeyword"
import { TType } from "./constructs/TType"
import { TRegexLiteral } from "./constructs/TRegexLiteral"
import { TTry } from "./constructs/TTry"
import { TNonNullExpr } from "./constructs/TNonNullExpr"
import { TForOfLoop, TWhileLoop } from "./constructs/TLoop"
import { TElementAccess } from "./constructs/TElementAccess"
import { TAsExpr } from "./constructs/TCastings"
import { TBindingPatterns, TVariable } from "./constructs/TVariable"
import { TReturnStmt } from "./constructs/TReturnStmt"
import { TTemplateExpr } from "./constructs/TTemplateExpr"
import SyntaxKind = ts.SyntaxKind

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
			const declarations = typedNode.getDeclarations().map((declaration) => NodeRedirector.redirectNode(declaration))
			return new TConstructMultiple(...declarations).withSeparator("\n")
		} else if (typedNode instanceof VariableDeclaration) {
			switch (typedNode.getNameNode().getKind()) {
				case SyntaxKind.Identifier:
					return TVariable.new(typedNode)
				case SyntaxKind.ObjectBindingPattern:
					return new TBindingPatterns(typedNode)
				case SyntaxKind.ArrayBindingPattern:
					throw new IgnorableError("not yet implemented!")
				default:
					throw new Error("Invalid LHS for variable decleration")
			}
		} else if (typedNode instanceof VariableDeclarationList) {
			const varDecls = typedNode.getDeclarations().map((v) => NodeRedirector.redirectNode(v))
			return new TConstructMultiple(...varDecls)
		} else if (typedNode instanceof ClassDeclaration) {
			return new TClassDecl(typedNode)
		} else if (typedNode instanceof InterfaceDeclaration) {
			return new TInterfaceDecl(typedNode)
		} else if (typedNode instanceof EnumDeclaration) {
			return new TEnum(typedNode)
		} else if (typedNode instanceof TypeAliasDeclaration) {
			return new TTypeAlias(typedNode)
		} else if (typedNode instanceof TypeReferenceNode) {
			return new TType(typedNode.getType())
		} else if (typedNode instanceof IfStatement) {
			return TIfStatement.fromIfStatement(typedNode)
		} else if (typedNode instanceof ConditionalExpression) {
			return TIfStatement.fromConditionalStatement(typedNode)
		} else if (typedNode instanceof SwitchStatement) {
			return new TSwitchStatement(typedNode)
		} else if (typedNode instanceof CallExpression) {
			return TCall.from(typedNode)
		} else if (typedNode instanceof ArrowFunction) {
			return new TArrow(typedNode)
		} else if (typedNode instanceof NewExpression) {
			return new TNew(typedNode)
		} else if (typedNode instanceof FunctionDeclaration) {
			return TFunctionDecl.new(typedNode)
		} else if (typedNode instanceof NonNullExpression) {
			return new TNonNullExpr(typedNode)
		} else if (typedNode instanceof BinaryExpression) {
			return new TBinaryExpr(typedNode)
		} else if (typedNode instanceof ExpressionStatement) {
			const expression = NodeRedirector.redirectNode(typedNode.getExpression())
			return new TConstructMultiple(expression, new TEndOfExpression(typedNode)).withSeparator("")
		} else if (typedNode instanceof WhileStatement) {
			return new TWhileLoop(typedNode)
		} else if (typedNode instanceof ForOfStatement) {
			return new TForOfLoop(typedNode)
		} else if (typedNode instanceof ElementAccessExpression) {
			return new TElementAccess(typedNode)
		} else if (typedNode instanceof SatisfiesExpression) {
			return NodeRedirector.redirectNode(typedNode.getExpression())
		} else if (typedNode instanceof ReturnStatement) {
			return new TReturnStmt(typedNode)
		} else if (typedNode instanceof Identifier) {
			const symbol = typedNode.getSymbol()
			Assert.notEqual(symbol, null, "Symbol for an identifier is null? is this defined in global .d.ts. Dont do that")
			return new TIdentitider(symbol.getName())
		} else if (typedNode instanceof NumericLiteral) {
			return new TNumericLiteral(typedNode)
		} else if (typedNode instanceof StringLiteral) {
			return new TStringLiteral(typedNode)
		} else if (typedNode instanceof TemplateExpression) {
			return new TTemplateExpr(typedNode)
		} else if (TOneToOneReplacement.canBeOneToOneReplaced(nodeKind)) {
			return new TOneToOneReplacement(typedNode, null)
		} else if (typedNode instanceof ArrayLiteralExpression) {
			return new TArrayLiteral(typedNode)
		} else if (typedNode instanceof RegularExpressionLiteral) {
			return new TRegexLiteral(typedNode)
		} else if (typedNode instanceof ParenthesizedExpression) {
			const [paranOpen, ...exprAndParanClose] = typedNode.getChildren()
			const [expression, paranClose] = exprAndParanClose
			const expressionConstructs = expression.forEachChildAsArray().map((ex) => NodeRedirector.redirectNode(ex))
			return new TConstructMultiple<TConstruct>(
				new TOneToOneReplacement(paranOpen, SyntaxKind.OpenParenToken),
				new TConstructMultiple(...expressionConstructs),
				new TOneToOneReplacement(paranClose, SyntaxKind.CloseParenToken),
			).withSeparator("")
		} else if (typedNode instanceof PropertyAccessExpression) {
			return new TPropAccess(typedNode)
		} else if (typedNode instanceof Block) {
			return new TBlock(typedNode)
		} else if (typedNode instanceof SuperExpression) {
			return new TSuperKeyword(typedNode)
		} else if (typedNode instanceof PrefixUnaryExpression) {
			const [operator, expression, ...rest] = typedNode.getChildren()
			Assert.equal(rest.length, 0, "Ahh! too much token")
			return new TConstructMultiple(new TOneToOneReplacement(operator, null), NodeRedirector.redirectNode(expression))
		} else if (typedNode instanceof AsExpression) {
			return new TAsExpr(typedNode)
		} else if (typedNode instanceof TryStatement) {
			return new TTry(typedNode)
		} else if (typedNode instanceof ThrowStatement) {
			Assert.equal(typedNode.getChildCount(), 2, "Expected only two child for throw")
			const [throwKeyword, thrownObj] = typedNode.getChildren()
			return new TConstructMultiple(
				new TOneToOneReplacement(throwKeyword, SyntaxKind.ThrowKeyword),
				NodeRedirector.redirectNode(thrownObj),
			).withSeparator(" ")
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
				console.error("===========================")
				console.trace("Uncaught error: " + e)
				console.error(
					"Error happened while processing file: " + node.getSourceFile().getFilePath() + `:${node.getStartLineNumber()}:${node.getStartLinePos()}`,
				)
				console.error("Token that is problamatic: " + node.getText())
				console.error("It's parent token: " + node.getParent().getText())
				process.exit(1)
			}
		}
	}
}
