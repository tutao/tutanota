import { ConstructOut, TConstruct } from "./TConstruct"
import { ArrayLiteralExpression } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"

export class TArrayLiteral extends TConstruct {
	public readonly elements: Array<TConstruct>
	private isReadOnly: boolean

	constructor(arrayLiteral: ArrayLiteralExpression) {
		super()
		this.isReadOnly = false
		this.elements = arrayLiteral.getElements().map((el) => NodeRedirector.redirectNode(el))
	}

	asReadOnly(): this {
		this.isReadOnly = true
		return this
	}

	generateKotlin(): ConstructOut {
		const elements = this.elements.map((el) => el.generateKotlin()).join(" ,")
		const arrayConstructor = this.isReadOnly ? "listOf" : "arrayOf"
		return `${arrayConstructor}(${elements})`
	}
}
