import { ConstructOut, TConstruct } from "./TConstruct"
import { SyntaxKind, TypeAliasDeclaration } from "ts-morph"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { TVisibility } from "./TVisibility"
import { TType } from "./TType"

export class TTypeAlias extends TConstruct {
	private name: TIdentitider
	private visibility: TVisibility
	private properties: Array<TTypedIdentifier>

	constructor(typeAliasDeclaration: TypeAliasDeclaration) {
		super()
		const typeNode = typeAliasDeclaration.getTypeNodeOrThrow()
		this.name = new TIdentitider(typeAliasDeclaration.getName())
		this.visibility = TVisibility.checkExported(typeAliasDeclaration)
		this.properties = typeNode
			.getDescendantsOfKind(SyntaxKind.PropertySignature)
			.map((p) => new TTypedIdentifier(new TIdentitider(p.getName()), new TType(p.getType())))
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const properties = this.properties
			.map((prop) => prop.generateKotlin())
			.map((prop) => {
				const declKey = "var" // todo: check if it's readonly and use val in that case
				return `${declKey} ${prop}`
			})
			.join(", ")
		return `${visibility} data class ${name}(${properties})`
	}
}
