import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { AsExpression, TypeReferenceNode } from "ts-morph"
import { TReservedWord } from "./TReservedWord"
import { TType } from "./TType"
import { NodeRedirector } from "../NodeRedirector"
import * as Assert from "node:assert"

export class TAsExpr extends TConstruct {
	private readonly operand: TConstruct
	private readonly asKeyword: TReservedWord
	private readonly targetType: TType
	private readonly castedToConst: boolean

	constructor(asExpression: AsExpression) {
		super()
		Assert.equal(asExpression.getChildCount(), 3, "Expected 3 token in AsExpression")
		const [operand, asKeyword, targetType] = asExpression.getChildren()
		this.operand = NodeRedirector.redirectNode(operand)
		this.asKeyword = new TReservedWord(asKeyword)
		this.asKeyword = new TReservedWord(asExpression.getChildAtIndex(1))
		this.operand = NodeRedirector.redirectNode(asExpression.getExpression())
		this.targetType = new TType(targetType.getType())
		// Note:
		// This can be ignored and we can just emit the `as const` casting because,
		// if typescript code is compiling, then that gurantees that this casting was respected
		// properly everywhere in rest of the code, we won't just have that gurantee by looking
		// at thet target language code.
		this.castedToConst = targetType instanceof TypeReferenceNode && targetType.getTypeName().getText() === "const"
	}

	generateKotlin(): ConstructOut {
		if (this.castedToConst) {
			return this.operand.generateKotlin()
		} else {
			return new TConstructMultiple(this.operand, this.asKeyword, this.targetType).withSeparator(" ").generateKotlin()
		}
	}
}
