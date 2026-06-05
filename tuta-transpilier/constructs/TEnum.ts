import { EnumDeclaration } from "ts-morph"
import { TIdentitider } from "./TIdentitider.js"
import { ConstructOut, TConstruct } from "./TConstruct"
import { TVisibility } from "./TVisibility"
import * as Assert from "node:assert"
import { TNumericLiteral, TStringLiteral } from "./TLiterals"

type TEnumVariant = { name: TIdentitider; value: TStringLiteral | TNumericLiteral }

enum TVariantValueType {
	Number = "Int",
	String = "String",
}

export class TEnum extends TConstruct {
	private readonly name: TIdentitider
	private readonly variants: Array<TEnumVariant>
	private readonly visibility: TVisibility
	private readonly variantValueType: TVariantValueType

	constructor(enumDecleration: EnumDeclaration) {
		super()

		let variantValueType = TVariantValueType.Number
		this.name = new TIdentitider(enumDecleration.getName())
		this.visibility = TVisibility.checkExported(enumDecleration)
		this.variants = enumDecleration.getMembers().map((enumMember) => {
			const name = new TIdentitider(enumMember.getName())
			const rawValue = enumMember.getValue()
			if (typeof rawValue === "number") {
				variantValueType = TVariantValueType.Number
				return { name, value: TNumericLiteral.fromValue(rawValue) }
			} else if (typeof rawValue === "string") {
				variantValueType = TVariantValueType.String
				return { name, value: TStringLiteral.fromValue(rawValue) }
			}
		})

		Assert.notEqual(enumDecleration.getMembers().length, [], "Enum with no variants is not allowed")
		this.variantValueType = variantValueType
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const variantValType = this.variantValueType
		const variants = this.variants
			.map((nv) => {
				return { name: nv.name.generateKotlin(), value: nv.value.generateKotlin() }
			})
			.map(({ name, value }) => `${name}(${value})`)
			.join(", ")
		return `${visibility} enum class ${name}(val __ts_value: ${variantValType}) { ${variants} }`
	}
}
