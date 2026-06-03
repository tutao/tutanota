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
		this.name = new TIdentitider(typeAliasDeclaration.getName())
		this.visibility = TVisibility.checkExported(typeAliasDeclaration)

		const typeNode = typeAliasDeclaration.getTypeNodeOrThrow()
		this.properties = typeNode.getDescendantsOfKind(SyntaxKind.PropertySignature).map((p) => {
			const identName = new TIdentitider(p.getName())
			const typeName = new TType(p.getType())
			return { identName, typeName }
		})
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const properties = this.properties
			.map(({ identName, typeName }) => {
				const declKey = "var" // todo: check if it's readonly and use val in that case
				const name = identName.generateKotlin()
				const type = typeName.generateKotlin()
				return `${declKey} ${name}: ${type}`
			})
			.join(", ")
		return `${visibility} data class ${name}(${properties})`
	}
}
