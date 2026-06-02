import { ConstructOut, TConstruct } from "./TConstruct"
import { CallExpression, PropertyAccessExpression } from "ts-morph"
import { TIdentitider } from "./TIdentitider"
import { NodeRedirector } from "../NodeRedirector"
import { TType } from "./TType"

export class TCall extends TConstruct {
	private readonly className: TType | null
	private readonly functionName: TIdentitider
	private readonly callArguments: Array<TConstruct>

	constructor(callExpression: CallExpression) {
		super()
		const propAccess = callExpression.getExpression()
		if (propAccess instanceof PropertyAccessExpression) {
			this.className = new TType(propAccess.getExpression().getType())
		}
		this.functionName = new TIdentitider(callExpression.getExpression().getSymbol().getName())
		this.callArguments = callExpression.getArguments().map((arg) => NodeRedirector.redirectNode(arg))
	}

	generateKotlin(): ConstructOut {
		const functionName = this.functionName.generateKotlin()
		const callArguments = this.callArguments.map((arg) => arg.generateKotlin()).join(",")
		if (this.className) {
			const className = this.className.generateKotlin()
			return `${className}.${functionName}(${callArguments})`
		} else {
			return `${functionName}(${callArguments})`
		}
	}
}
