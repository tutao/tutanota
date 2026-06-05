import { ConstructOut, TConstruct } from "./TConstruct"
import { NumericLiteral, StringLiteral } from "ts-morph"

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
		const literalValue = literal.getLiteralValue()
		this.value = `${
			literalValue
				.replace(/\\/g, "\\\\") // backslash first
				.replace(/"/g, '\\"') // double quotes
				.replace(/\r\n/g, "\\n") // Windows newline
				.replace(/\n/g, "\\n") // Unix newline
				.replace(/\r/g, "\\n") // old Mac newline
				.replace(/\t/g, "\\t") // tabs
		}`
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
