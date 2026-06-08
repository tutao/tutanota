import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { ArgumentedNode, CallExpression, ExpressionedNode, NewExpression } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"
import { TSuperKeyword } from "./TSuperKeyword"
import { TType } from "./TType"
import * as Assert from "node:assert"

export const enum SpecialCall {
	SuperCall,
	NewExpression,
}

export class TCall extends TConstruct {
	private callIdentifier: TConstruct
	private readonly callArguments: Array<TConstruct>
	public readonly specialCall: SpecialCall | null

	protected constructor(call: ArgumentedNode & ExpressionedNode) {
		super()

		this.callIdentifier = NodeRedirector.redirectNode(call.getExpression())
		this.callArguments = call.getArguments().map((arg) => NodeRedirector.redirectNode(arg))
		this.specialCall = null

		// == special handeling for some function calls
		// =========================================
		// Case I: Is a super(...) call
		if (this.callIdentifier instanceof TSuperKeyword) {
			this.specialCall = SpecialCall.SuperCall
		}
		/// Case II: is a new SomeCall() call
		else if (call instanceof NewExpression) {
			this.specialCall = SpecialCall.NewExpression
		}
	}

	public static from(callExpression: CallExpression): TCall {
		return new TCall(callExpression)
	}

	generateKotlin(): ConstructOut {
		const callArguments = new TConstructMultiple(...this.callArguments).withSeparator(",").generateKotlin()
		const callId = this.callIdentifier.generateKotlin()
		return `${callId}(${callArguments})`
	}

	public setBaseClassName(baseClass: TType): this {
		Assert.equal(this.specialCall === SpecialCall.SuperCall || this.specialCall === SpecialCall.NewExpression, true, "This is not a super call")
		this.callIdentifier = baseClass
		return this
	}
}

export class TNew extends TCall {
	// for both swift and kotlin,
	// we can create new obj with `ClassName()`
	// and new keyword have no meaning
	constructor(newExpression: NewExpression) {
		super(newExpression)
		this.setBaseClassName(new TType(newExpression.getType()))
	}
}
