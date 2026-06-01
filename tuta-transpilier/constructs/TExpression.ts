import { ConstructOut, TConstruct } from "./TConstruct"
import { Expression } from "ts-morph"
import { LangTarget } from "../LangTarget"

export class TExpression extends TConstruct {
	private readonly innerConstructs: Array<TConstruct> = []
	constructor(expression: Expression) {
		super()

		const childExpressions = expression.forEachChildAsArray().flatMap((childExpr) => LangTarget.redirectNode(childExpr))
		this.innerConstructs.push(...childExpressions)
	}

	generateKotlin(): ConstructOut {
		return this.innerConstructs.map((c) => c.generateKotlin()).join("")
	}
}
