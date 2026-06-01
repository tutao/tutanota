import { ConstructOut, TConstruct } from "./TConstruct"
import { SyntaxKind, TypeAliasDeclaration } from "ts-morph"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { TVisibility } from "./TVisibility"

export class TTypeAlias extends TConstruct {
	private name: TIdentitider
	private visibility: TVisibility
	private properties: Array<TTypedIdentifier>

	constructor(typeAliasDeclaration: TypeAliasDeclaration) {
		super()
		this.name = new TIdentitider(typeAliasDeclaration.getName())
		this.visibility = new TVisibility(typeAliasDeclaration)

		const typeNode = typeAliasDeclaration.getTypeNodeOrThrow()
		this.properties = typeNode.getDescendantsOfKind(SyntaxKind.PropertySignature).map((p) => {
			const identName = new TIdentitider(p.getName())
			const typeName = new TIdentitider(p.getType().getApparentType().getSymbol().getName())
			return { identName, typeName }
		})
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const properties = this.properties.map(({ identName, typeName }) => identName.generateKotlin() + ": " + typeName.generateKotlin()).join(", ")
		return `${visibility} data class ${name}(${properties})`
	}
}
