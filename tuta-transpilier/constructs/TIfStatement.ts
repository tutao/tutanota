import { ConstructOut, TConstruct } from "./TConstruct"
import { IfStatement, Statement } from "ts-morph"

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
	constructor(ifStatement: IfStatement) {
		super()
	}

	generateKotlin(): ConstructOut {
		return `NOT_IMPLEMETED(ifStatement)`
	}
}
