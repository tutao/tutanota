import { ConstructOut, TConstruct } from "./TConstruct"
import { IfStatement, Statement } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"

enum IfStatementLevel {
	FirstIfStmt,
	ElseIfStmt,
	ElseStmt,
}

abstract class BranchesOfIfStmt extends TConstruct {
	constructor(
		statement: Statement,
		private readonly statementLevel: IfStatementLevel,
	) {
		super()
	}

	generateKotlin(): ConstructOut {
		let keyword: string
		if (this.statementLevel === IfStatementLevel.FirstIfStmt) keyword = "if"
		else if (this.statementLevel === IfStatementLevel.ElseIfStmt) keyword = "elseif"
		else if (this.statementLevel === IfStatementLevel.ElseStmt) keyword = "else"

		const evalExpr = "something()"
		const body = "/** TODO **/"
		return `${keyword} (${evalExpr}) { ${body} }`
	}
}

export class TIfStatement extends TConstruct {
	private readonly ifCondition: TConstruct
	private readonly elseBody: TConstruct | null
	private readonly ifBody: TConstruct

	constructor(ifStatement: IfStatement) {
		super()
		this.ifCondition = NodeRedirector.redirectNode(ifStatement.getExpression())

		const thenStmt = ifStatement.getThenStatement()
		// todo: uncomment
		// Assert.equal(thenStmt.getKind() === SyntaxKind.Block, true, "if statement better to be a block")
		this.ifBody = NodeRedirector.redirectNode(thenStmt)

		const elseStmt = ifStatement.getElseStatement() ?? null
		if (elseStmt != null) {
			// todo: uncomment
			// Assert.equal(elseStmt.getKind() === SyntaxKind.Block, true, "else statement better to be a block")
			this.elseBody = NodeRedirector.redirectNode(elseStmt)
		}
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
