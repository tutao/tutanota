import { ConstructOut, TConstruct } from "./TConstruct"
import { ArgumentedNode, CallExpression, ExpressionedNode, NewExpression } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"
import { TPropAccess, TSpecialPropAccess } from "./TPropAccess"
import { TArrayLiteral } from "./TArrayLiteral"
import { TEmpty } from "./TEmpty"

export class TCall extends TConstruct {
	private readonly callIdentifier: TConstruct
	private readonly callArguments: Array<TConstruct>

	private constructor(call: ArgumentedNode & ExpressionedNode) {
		super()

		this.callIdentifier = NodeRedirector.redirectNode(call.getExpression())
		this.callArguments = call.getArguments().map((arg) => NodeRedirector.redirectNode(arg))

		// == special handeling for some function calls
		// =========================================

		// 1) Case I: Object.freeze([])
		// we want readonly array that cannot be modified ( reassign/remove/add element ) during runtime
		const isObjectFreezeOnArray =
			this.callIdentifier instanceof TPropAccess &&
			this.callIdentifier.specialPropAccess === TSpecialPropAccess.ObjectFreeze &&
			this.callArguments.length === 1 &&
			this.callArguments[0] instanceof TArrayLiteral
		if (isObjectFreezeOnArray) {
			this.callIdentifier = new TEmpty()
			;(this.callArguments[0] as TArrayLiteral).asReadOnly()
		}
	}

	public static fromCalLExpr(callExpression: CallExpression): TCall {
		return new TCall(callExpression)
	}
	public static fromNewExpression(newExpression: NewExpression): TCall {
		return new TCall(newExpression)
	}

	generateKotlin(): ConstructOut {
		const callArguments = this.callArguments.map((arg) => arg.generateKotlin()).join(",")
		if (this.callIdentifier instanceof TEmpty) {
			return callArguments
		} else {
			const callId = this.callIdentifier.generateKotlin()
			return `${callId}(${callArguments})`
		}
	}
}
