import { ConstructOut, TConstruct } from "./TConstruct"
import { WhileStatement } from "ts-morph"
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
