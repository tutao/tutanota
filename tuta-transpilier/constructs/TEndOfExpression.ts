import { ConstructOut, TConstruct, TsNode } from "./TConstruct"

export class TEndOfExpression extends TConstruct {
	constructor(private readonly statementToEnd: TsNode) {
		super()
	}

	generateKotlin(): ConstructOut {
		return ";\n"
	}
}
