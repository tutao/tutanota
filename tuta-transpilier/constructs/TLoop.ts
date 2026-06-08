import { ConstructOut, TConstruct } from "./TConstruct"
import { ForOfStatement, WhileStatement } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"

export class TWhileLoop extends TConstruct {
	private readonly condition: TConstruct
	private readonly statement: TConstruct
	constructor(whileStatement: WhileStatement) {
		super()
		this.condition = NodeRedirector.redirectNode(whileStatement.getExpression())
		this.statement = NodeRedirector.redirectNode(whileStatement.getStatement())
	}

	generateKotlin(): ConstructOut {
		const condition = this.condition.generateKotlin()
		const statement = this.statement.generateKotlin()
		return `while (${condition}) ${statement}`
	}
}

export class TForOfLoop extends TConstruct {
	private readonly initializer: TConstruct
	private readonly targetedObj: TConstruct
	private readonly loopBody: TConstruct
	constructor(forOfStmt: ForOfStatement) {
		super()
		this.initializer = NodeRedirector.redirectNode(forOfStmt.getInitializer())
		this.targetedObj = NodeRedirector.redirectNode(forOfStmt.getExpression())
		this.loopBody = NodeRedirector.redirectNode(forOfStmt.getStatement())
	}

	generateKotlin(): ConstructOut {
		const initializer = this.initializer.generateKotlin()
		const targetObj = this.targetedObj.generateKotlin()
		const loopBody = this.loopBody.generateKotlin()
		return `for (${initializer} in ${targetObj}) ${loopBody}`
	}
}
