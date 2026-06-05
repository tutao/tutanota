import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { ArrayLiteralExpression } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"

export class TArrayLiteral extends TConstruct {
	public readonly elements: TConstructMultiple
	private isReadOnly: boolean

	constructor(arrayLiteral: ArrayLiteralExpression) {
		super()
		const elements = arrayLiteral.getElements().map((el) => NodeRedirector.redirectNode(el))
		this.isReadOnly = false
		this.elements = new TConstructMultiple(...elements)
	}

	asReadOnly(): this {
		this.isReadOnly = true
		return this
	}

	generateKotlin(): ConstructOut {
		const elements = this.elements.withSeparator(",").generateKotlin()
		const arrayConstructor = this.isReadOnly ? "listOf" : "arrayOf"
		return `${arrayConstructor}(${elements})`
	}
}
