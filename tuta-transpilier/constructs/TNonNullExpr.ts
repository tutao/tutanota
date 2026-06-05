import { ConstructOut, TConstruct } from "./TConstruct"
import { NonNullExpression } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"

export class TNonNullExpr extends TConstruct {
	private readonly expression: TConstruct
	constructor(nonNullExpression: NonNullExpression) {
		super()
		this.expression = NodeRedirector.redirectNode(nonNullExpression.getExpression())
	}

	generateKotlin(): ConstructOut {
		const expression = this.expression.generateKotlin()
		return `${expression}!!`
	}
}
