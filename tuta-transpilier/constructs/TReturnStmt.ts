import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { ReturnStatement, SyntaxKind } from "ts-morph"
import Assert from "node:assert"
import { TOneToOneReplacement } from "./TOneToOneReplacement"
import { NodeRedirector } from "../NodeRedirector"
import { TEmpty } from "./TEmpty"

export class TReturnStmt extends TConstruct {
	private readonly returnKeyword: TOneToOneReplacement
	private readonly returnedExpression: TConstruct
	constructor(returnStatement: ReturnStatement) {
		super()
		const childNodeCount = returnStatement.getChildCount()
		Assert.equal(childNodeCount === 1 || childNodeCount === 2, true, "return statement should have either 1 or 2 expression")

		const [returnKeyword, returnExpression] = returnStatement.getChildren()
		this.returnKeyword = new TOneToOneReplacement(returnKeyword, SyntaxKind.ReturnKeyword)
		this.returnedExpression = returnExpression == null ? new TEmpty() : NodeRedirector.redirectNode(returnExpression)
	}

	generateKotlin(): ConstructOut {
		return new TConstructMultiple(this.returnKeyword, this.returnedExpression).withSeparator(" ").generateKotlin()
	}
}
