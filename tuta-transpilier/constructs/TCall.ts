import { ConstructOut, TConstruct } from "./TConstruct"
import { CallExpression, PropertyAccessExpression } from "ts-morph"
import { TIdentitider } from "./TIdentitider"
import { NodeRedirector } from "../NodeRedirector"
import { TType } from "./TType"
import { TArrayLiteral } from "./TArrayLiteral"
import { IgnorableError } from "../errors/IgnorableError"

export class TCall extends TConstruct {
	private readonly referencingClass: TType | null
	private readonly functionName: TIdentitider
	private readonly callArguments: Array<TConstruct>

	constructor(callExpression: CallExpression) {
		super()
		const propAccess = callExpression.getExpression()
		this.functionName = new TIdentitider(callExpression.getExpression().getSymbol().getName())
		this.callArguments = callExpression.getArguments().map((arg) => NodeRedirector.redirectNode(arg))

		if (propAccess instanceof PropertyAccessExpression) {
			const expressionType = propAccess.getExpression().getType()

			const isObjectFreeze = expressionType.isObject() && this.functionName.generateKotlin() === "freeze"
			const onlyArgumentIsArray = this.callArguments.length === 1 && this.callArguments[0] instanceof TArrayLiteral
			if (isObjectFreeze && onlyArgumentIsArray) {
				this.functionName = new TIdentitider("listOf")
				this.callArguments = (this.callArguments[0] as TArrayLiteral).elements
			} else if (isObjectFreeze) {
				throw new IgnorableError(`Call Object.${this.functionName} cannot be mapped. Is it fine to ignore?`)
			} else {
				this.referencingClass = new TType(propAccess.getExpression().getType())
			}
		}
	}

	generateKotlin(): ConstructOut {
		const functionName = this.functionName.generateKotlin()
		const callArguments = this.callArguments.map((arg) => arg.generateKotlin()).join(",")
		if (this.referencingClass == null) {
			return `${functionName}(${callArguments})`
		} else {
			const className = this.referencingClass.generateKotlin()
			return `${className}.${functionName}(${callArguments})`
		}
	}
}
