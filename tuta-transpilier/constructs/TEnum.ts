import { EnumDeclaration } from "ts-morph"
import { TIdentitider } from "./TIdentitider.js"
import { ConstructOut, TConstruct } from "./TConstruct"
import { TVisibility } from "./TVisibility"
import { TType } from "./TType"
import * as Assert from "node:assert"
import { TNumericLiteral, TStringLiteral } from "./TLiterals"

type TEnumVariant = { name: TIdentitider; value: TStringLiteral | TNumericLiteral }

export class TEnum extends TConstruct {
	private readonly name: TIdentitider
	private readonly variants: Array<TEnumVariant>
	private readonly visibility: TVisibility
	private readonly variantValueType: TType

	constructor(enumDecleration: EnumDeclaration) {
		super()

		const variantValueType = new Set<string>()
		this.name = new TIdentitider(enumDecleration.getName())
		this.visibility = new TVisibility(enumDecleration)
		this.variants = enumDecleration.getMembers().map((enumMember) => {
			variantValueType.add(enumMember.getType().getApparentType().getSymbol().getName())
			const name = new TIdentitider(enumMember.getName())
			const rawValue = enumMember.getValue()
			if (typeof rawValue === "number") return { name, value: TNumericLiteral.fromValue(rawValue) }
			else if (typeof rawValue === "string") return { name, value: TStringLiteral.fromValue(rawValue) }
		})

		Assert.notEqual(enumDecleration.getMembers().length, [], "Enum with no variants is not allowed")
		Assert.equal(variantValueType.size, 1, "All value of variant should _exclusively_ be either number or string")
		this.variantValueType = new TType(enumDecleration.getMembers()[0].getType())
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const variantValType = this.variantValueType.generateKotlin()
		const variants = this.variants
			.map((nv) => {
				return { name: nv.name.generateKotlin(), value: nv.value.generateKotlin() }
			})
			.map(({ name, value }) => `${name}(${value})`)
			.join(", ")
		return `${visibility} enum class ${name}(val __ts_value: ${variantValType}) { ${variants} }`
	}
}
