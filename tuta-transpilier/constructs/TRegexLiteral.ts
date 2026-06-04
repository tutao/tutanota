import { ConstructOut, TConstruct } from "./TConstruct"
import { RegularExpressionLiteral } from "ts-morph"
import { TType } from "./TType"

export class TRegexLiteral extends TConstruct {
	private readonly regexType: TType
	private readonly regexPattern: RegExp

	constructor(regexPattern: RegularExpressionLiteral) {
		super()
		this.regexType = new TType(regexPattern.getType())
		this.regexPattern = regexPattern.getLiteralValue()
	}

	generateKotlin(): ConstructOut {
		const type = this.regexType.generateKotlin()
		const regexString = this.regexPattern.toString()
		const regexWithoutSlashes = regexString.slice(1, regexString.length - 1)
		return `${type}("${regexWithoutSlashes}")`
	}
}
