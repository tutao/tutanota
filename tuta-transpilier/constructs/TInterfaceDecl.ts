import { ConstructOut, TConstruct } from "./TConstruct"
import { InterfaceDeclaration } from "ts-morph"
import { TIdentifierKind, TIdentitider } from "./TIdentitider"
import { TVisibility } from "./TVisibility"

export class TInterfaceDecl extends TConstruct {
	private name: TIdentitider
	private visibility: TVisibility

	constructor(classDeceleration: InterfaceDeclaration) {
		super()
		this.visibility = new TVisibility(classDeceleration)
		this.name = new TIdentitider(classDeceleration.getName(), TIdentifierKind.TypeName)
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const body = "/** TODO **/"
		return `${visibility} interface ${name} {${body}}`
	}
}
