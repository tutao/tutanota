import { EnumDeclaration } from "ts-morph"
import { TIdentitider } from "./TIdentitider.js"
import { ConstructOut, TConstruct } from "./TConstruct"
import { TVisibility } from "./TVisibility"

export class TEnum extends TConstruct {
	private readonly name: TIdentitider
	private readonly variants: Array<TIdentitider>
	private readonly visibility: TVisibility

	constructor(enumDecleration: EnumDeclaration) {
		super()
		this.name = new TIdentitider(enumDecleration.getName())
		this.visibility = new TVisibility(enumDecleration)
		this.variants = enumDecleration.getMembers().map((enumMember) => new TIdentitider(enumMember.getName()))
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const variants = this.variants.map((variant) => variant.generateKotlin()).join(", ")
		return `${visibility} enum ${name} { ${variants} }`
	}
}
