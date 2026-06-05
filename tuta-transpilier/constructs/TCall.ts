import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { ArgumentedNode, CallExpression, ExpressionedNode, NewExpression } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"
import { TPropAccess, TSpecialPropAccess } from "./TPropAccess"
import { TArrayLiteral } from "./TArrayLiteral"
import { TSuperKeyword } from "./TSuperKeyword"
import { TType } from "./TType"
import * as Assert from "node:assert"

export const enum SpecialCall {
	ObjectFreezeOnArrayLiteral,
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

		// Case I: Object.freeze([])
		// we want readonly array that cannot be modified ( reassign/remove/add element ) during runtime
		const isObjectFreeze = this.callIdentifier instanceof TPropAccess && this.callIdentifier.specialPropAccess === TSpecialPropAccess.ObjectFreeze
		const isObjectFreezeOnArray = isObjectFreeze && this.callArguments.length === 1 && this.callArguments[0] instanceof TArrayLiteral
		if (isObjectFreezeOnArray) {
			this.specialCall = SpecialCall.ObjectFreezeOnArrayLiteral
		} else if (isObjectFreeze) {
			throw new Error("Object.freeze call is only supported in array")
		}
		// Case II: is a super(...) call
		else if (this.callIdentifier instanceof TSuperKeyword) {
			this.specialCall = SpecialCall.SuperCall
		}
		/// Case III: is a new SomeCall() call
		else if (call instanceof NewExpression) {
			this.specialCall = SpecialCall.NewExpression
		}
	}

	public static from(callExpression: CallExpression): TCall {
		return new TCall(callExpression)
	}

	generateKotlin(): ConstructOut {
		if (this.specialCall === SpecialCall.ObjectFreezeOnArrayLiteral) {
			const arrayLiteral = (this.callArguments[0] as TArrayLiteral).asReadOnly()
			return arrayLiteral.generateKotlin()
		} else {
			const callArguments = new TConstructMultiple(...this.callArguments).withSeparator(",").generateKotlin()
			const callId = this.callIdentifier.generateKotlin()
			return `${callId}(${callArguments})`
		}
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
