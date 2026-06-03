import { ConstructOut, TConstruct } from "./TConstruct"
import { BooleanLiteral, NumericLiteral, StringLiteral } from "ts-morph"

export class TNumericLiteral extends TConstruct {
	private value: number
	constructor(literal: NumericLiteral) {
		super()
		this.value = literal.getLiteralValue()
	}

	static fromValue(value: number): TNumericLiteral {
		return new TNumericLiteral({
			getLiteralValue: () => value,
		} as any)
	}

	generateKotlin(): ConstructOut {
		// todo: make sure this number is correctly suffixed
		return this.value.toString()
	}
}

export class TStringLiteral extends TConstruct {
	private value: string
	constructor(literal: StringLiteral) {
		super()
		this.value = literal.getLiteralValue()
	}

	static fromValue(value: string): TStringLiteral {
		return new TStringLiteral({
			getLiteralValue: () => value,
		} as any)
	}

	generateKotlin(): ConstructOut {
		return '"' + this.value + '"'
	}
}

export class TBooleanLiteral extends TConstruct {
	private value: boolean
	constructor(literal: BooleanLiteral) {
		super()
		this.value = literal.getLiteralValue()
	}

	generateKotlin(): ConstructOut {
		if (this.value) return "true"
		else return "false"
	}
}
