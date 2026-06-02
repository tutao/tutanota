import { ConstructOut, TConstruct } from "./TConstruct"
import { ArrayLiteralExpression } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"

export class TArrayLiteral extends TConstruct {
	public readonly elements: Array<TConstruct>

	constructor(arrayLiteral: ArrayLiteralExpression) {
		super()
		this.elements = arrayLiteral.getElements().map((el) => NodeRedirector.redirectNode(el))
	}

	generateKotlin(): ConstructOut {
		const elements = this.elements.map((el) => el.generateKotlin()).join(" ,")
		return `arrayOf(${elements})`
	}
}
