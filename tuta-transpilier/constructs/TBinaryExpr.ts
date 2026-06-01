import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { BinaryExpression } from "ts-morph"
import { LangTarget } from "../LangTarget"
import { Assert } from "../Constants"

export class TBinaryExpr extends TConstruct {
	private readonly lhs: TConstruct
	private readonly operand: TConstruct
	private readonly rhs: TConstruct

	constructor(binaryExpression: BinaryExpression) {
		super()
		Assert.isTrue(binaryExpression.getChildCount() === 3, "binary expression always expects 3 node")
		const [lhs, operand, rhs] = binaryExpression.getChildren().map((n) => LangTarget.redirectNode(n))
		this.lhs = lhs
		this.operand = operand
		this.rhs = rhs
	}

	generateKotlin(): ConstructOut {
		return new TConstructMultiple(this.lhs, this.operand, this.rhs).generateKotlin()
	}
}
