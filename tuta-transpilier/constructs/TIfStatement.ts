import { ConstructOut, TConstruct } from "./TConstruct"
import { ConditionalExpression, Expression, IfStatement, Statement } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"
import * as Assert from "node:assert"

export class TIfStatement extends TConstruct {
	private readonly ifCondition: TConstruct
	private readonly ifBody: TConstruct
	private readonly elseBody: TConstruct | null = null

	private constructor(ifCondition: Expression, ifBody: Expression | Statement, elseBody: Expression | Statement | null = null) {
		super()
		// todo: uncomment
		// Assert.equal(ifBody.getKind() === SyntaxKind.Block, true, "if statement better to be a block")
		this.ifCondition = NodeRedirector.redirectNode(ifCondition)
		this.ifBody = NodeRedirector.redirectNode(ifBody)
		if (elseBody != null) {
			this.elseBody = NodeRedirector.redirectNode(elseBody)
			// todo: uncomment
			// Assert.equal(elseBody?.getKind() === SyntaxKind.Block, true, "if statement better to be a block")
		}
	}

	public static fromIfStatement(ifStatement: IfStatement): TIfStatement {
		return new TIfStatement(ifStatement.getExpression(), ifStatement.getThenStatement(), ifStatement.getElseStatement())
	}

	public static fromConditionalStatement(conditionalExpression: ConditionalExpression): TIfStatement {
		const elseCondition = conditionalExpression.getWhenFalse()
		Assert.notEqual(elseCondition, null, "Conditional operator always have a false branch")
		return new TIfStatement(conditionalExpression.getCondition(), conditionalExpression.getWhenTrue(), elseCondition)
	}

	generateKotlin(): ConstructOut {
		const ifCondition = this.ifCondition.generateKotlin()
		const ifBody = this.ifBody.generateKotlin()
		if (this.elseBody != null) {
			const elseBody = this.elseBody.generateKotlin()
			return `if (${ifCondition}) ${ifBody} else ${elseBody}`
		} else {
			return `if (${ifCondition}) ${ifBody}`
		}
	}
}

export class TConditionalExpr extends TConstruct {
	constructor(conditionalExpression: ConditionalExpression) {
		super()
	}

	generateKotlin(): ConstructOut {
		return ""
	}
}
