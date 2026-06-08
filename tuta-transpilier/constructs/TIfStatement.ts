import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import {
	CaseClause,
	CaseOrDefaultClause,
	ConditionalExpression,
	DefaultClause,
	Expression,
	IfStatement,
	Statement,
	SwitchStatement,
	SyntaxKind,
} from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"
import * as Assert from "node:assert"
import { TBlock } from "./TBlock"
import { TReturnStmt } from "./TReturnStmt"

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

class TSwitchClause extends TConstruct {
	private readonly statements: TConstructMultiple
	private readonly expression: TConstruct | null
	constructor(caseClause: CaseOrDefaultClause) {
		super()

		if (caseClause instanceof CaseClause) {
			this.expression = NodeRedirector.redirectNode(caseClause.getExpression())
		} else if (caseClause instanceof DefaultClause) {
			this.expression = null
		}

		let isTerminated = false
		this.statements = new TConstructMultiple()
		for (const stmt of caseClause.getStatements()) {
			const statementConstruct = NodeRedirector.redirectNode(stmt)
			if (statementConstruct instanceof TBlock) {
				isTerminated = isTerminated || statementConstruct.findStatements((stmt) => stmt instanceof TReturnStmt) != null
			} else {
				isTerminated = isTerminated || [SyntaxKind.ReturnStatement, SyntaxKind.ThrowStatement, SyntaxKind.BreakStatement].includes(stmt.getKind())
			}
			this.statements.addConstructs(statementConstruct)
		}
		Assert.equal(isTerminated, true, "Try to have a terminating last statement in all case branch")
	}

	generateKotlin(): ConstructOut {
		const expression = this.expression.generateKotlin()
		const body = this.statements.withSeparator("\n;").generateKotlin()
		return `${expression} -> ${body}`
	}
}

export class TSwitchStatement extends TConstruct {
	private readonly cased: TConstruct
	private readonly clauses: TConstructMultiple<TSwitchClause>
	constructor(switchStatement: SwitchStatement) {
		super()
		const statements = switchStatement.getClauses().map((clause) => new TSwitchClause(clause))
		this.clauses = new TConstructMultiple(...statements)
	}

	generateKotlin(): ConstructOut {
		const cased = this.cased.generateKotlin()
		const clauses = this.clauses.withSeparator("\n").generateKotlin()
		return `when (${cased}) { ${clauses} }`
	}
}
