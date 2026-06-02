import { ConstructOut, TConstruct } from "./TConstruct"
import { Expression } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"

export class TExpression extends TConstruct {
	private readonly innerConstructs: Array<TConstruct> = []
	constructor(expression: Expression) {
		super()

		const childExpressions = expression.forEachChildAsArray().flatMap((childExpr) => NodeRedirector.redirectNode(childExpr))
		this.innerConstructs.push(...childExpressions)
	}

	generateKotlin(): ConstructOut {
		return this.innerConstructs.map((c) => c.generateKotlin()).join("")
	}
}
