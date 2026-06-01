import { ConstructOut, TConstruct } from "./TConstruct"
import { BinaryExpression } from "ts-morph"
import { LangTarget } from "../LangTarget"
import { TEmpty } from "./TEmpty"

export class TBinaryExpr extends TConstruct {
	private readonly lhs: TConstruct | Array<TConstruct>
	private readonly operand: TConstruct | Array<TConstruct>
	private readonly rhs: TConstruct | Array<TConstruct>

	constructor(binaryExpression: BinaryExpression) {
		super()
		console.log(binaryExpression.getChildCount() === 3, "binary expression always expects 3 node")
		const [lhs, operand, rhs] = binaryExpression.getChildren().map((n) => LangTarget.redirectNode(n))
		this.lhs = lhs
		this.operand = operand
		this.rhs = rhs
	}

	generateKotlin(): ConstructOut {
		const constructs = new Array<TConstruct>()
		constructs.push(...new TEmpty().andThen(this.lhs))
		constructs.push(...new TEmpty().andThen(this.operand))
		constructs.push(...new TEmpty().andThen(this.rhs))
		return constructs.map((c) => c.generateKotlin()).join(" ")
	}
}
